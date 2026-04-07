import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });
}

function redirectToThankYou(status: string, reason?: string) {
  const thankYouUrl = Deno.env.get('BOOKING_THANK_YOU_URL') ?? 'https://www.greenleafpestcontrol.co.za/thank-you.html';
  const url = new URL(thankYouUrl);
  url.searchParams.set('status', status);
  if (reason) url.searchParams.set('reason', reason);

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      ...corsHeaders
    }
  });
}

async function sendToSpreadsheet(payload: Record<string, unknown>) {
  const webhookUrl = Deno.env.get('GOOGLE_SHEETS_WEBHOOK_URL');
  if (!webhookUrl) throw new Error('GOOGLE_SHEETS_WEBHOOK_URL is missing.');

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Spreadsheet webhook failed: ${text}`);
  }
}

async function sendConfirmationEmail(booking: {
  full_name: string;
  email: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
}) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'bookings@example.com';

  if (!resendKey) throw new Error('RESEND_API_KEY is missing.');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [booking.email],
      subject: 'Your GreenLeaf booking is confirmed',
      html: `<p>Hi ${booking.full_name},</p><p>Your booking is confirmed.</p><p><strong>Service:</strong> ${booking.service_type}<br><strong>Date:</strong> ${booking.booking_date}<br><strong>Time:</strong> ${booking.booking_time}</p><p>Thank you for choosing GreenLeaf Pest Control.</p>`
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to send confirmation email: ${details}`);
  }
}

async function verifyBookingToken(otp_token: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: otpRow, error: otpError } = await supabase
    .from('booking_otps')
    .select('id, otp_token, email, full_name, phone_number, service_type, booking_date, booking_time, is_consumed, expires_at')
    .eq('otp_token', otp_token)
    .maybeSingle();

  if (otpError) throw new Error(otpError.message);
  if (!otpRow) throw new Error('Verification session not found.');
  if (otpRow.is_consumed) return { status: 'already-verified' };
  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    throw new Error('Verification link expired.');
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      full_name: otpRow.full_name,
      email: otpRow.email,
      phone_number: otpRow.phone_number,
      service_type: otpRow.service_type,
      booking_date: otpRow.booking_date,
      booking_time: otpRow.booking_time,
      otp_token: otpRow.otp_token,
      status: 'confirmed'
    })
    .select('id, full_name, email, phone_number, service_type, booking_date, booking_time, status, created_at')
    .single();

  if (bookingError) {
    if (bookingError.code === '23505') {
      throw new Error('Selected slot was just booked by another customer.');
    }
    throw new Error(bookingError.message);
  }

  await sendToSpreadsheet({
    booking_id: booking.id,
    full_name: booking.full_name,
    email: booking.email,
    phone_number: booking.phone_number,
    service_type: booking.service_type,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    status: booking.status,
    created_at: booking.created_at
  });

  await sendConfirmationEmail({
    full_name: booking.full_name,
    email: booking.email,
    service_type: booking.service_type,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time
  });

  const { error: consumeError } = await supabase
    .from('booking_otps')
    .update({ is_verified: true, is_consumed: true, verified_at: new Date().toISOString() })
    .eq('id', otpRow.id);

  if (consumeError) throw new Error(consumeError.message);

  return { status: 'verified', booking };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let otp_token = '';

    if (req.method === 'GET') {
      const url = new URL(req.url);
      otp_token = (url.searchParams.get('token') ?? '').trim();
      if (!otp_token) return redirectToThankYou('verification-error', 'missing-token');

      try {
        const result = await verifyBookingToken(otp_token);
        if (result.status === 'already-verified') {
          return redirectToThankYou('already-verified');
        }
        return redirectToThankYou('verified');
      } catch (error) {
        return redirectToThankYou('verification-error', (error as Error).message);
      }
    }

    const body = await req.json();
    otp_token = String(body.otp_token ?? '').trim();
    if (!otp_token) {
      return jsonResponse({ error: 'otp_token is required.' }, 400);
    }

    const result = await verifyBookingToken(otp_token);
    if (result.status === 'already-verified') {
      return jsonResponse({ message: 'Booking already verified.' }, 200);
    }

    return jsonResponse({ message: 'Booking verified successfully.', booking: result.booking }, 200);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
