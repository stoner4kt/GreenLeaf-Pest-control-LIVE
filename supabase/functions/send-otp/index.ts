import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendVerificationEmail(
  toEmail: string,
  name: string,
  bookingDate: string,
  bookingTime: string,
  token: string
) {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'bookings@example.com';
  const verifyBaseUrl = Deno.env.get('BOOKING_VERIFY_URL');

  if (!resendKey) throw new Error('RESEND_API_KEY is missing.');

  if (!verifyBaseUrl) throw new Error('BOOKING_VERIFY_URL is missing.');

  const separator = verifyBaseUrl.includes('?') ? '&' : '?';
  const verifyLink = `${verifyBaseUrl}${separator}token=${encodeURIComponent(token)}`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: 'Verify your GreenLeaf booking',
      html: `<p>Hi ${name},</p><p>Thanks for your booking request for ${bookingDate} at ${bookingTime}.</p><p>Please verify your booking by clicking the link below (this will instantly confirm your booking):</p><p><a href="${verifyLink}">Verify my booking</a></p><p>This link expires in 3 days.</p>`
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Resend API failed: ${message}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const full_name = String(body.full_name ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone_number = String(body.phone_number ?? '').trim();
    const service_type = String(body.service_type ?? '').trim();
    const booking_date = String(body.booking_date ?? '').trim();
    const booking_time = String(body.booking_time ?? '').trim();

    if (!full_name || !validEmail(email) || !phone_number || !service_type || !booking_date || !booking_time) {
      return jsonResponse({ error: 'Invalid input.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .maybeSingle();

    if (existingBooking) {
      return jsonResponse({ error: 'This slot is already booked.' }, 409);
    }

    const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('booking_otps')
      .insert({
        email,
        full_name,
        phone_number,
        service_type,
        booking_date,
        booking_time,
        otp_hash: 'LINK_VERIFICATION',
        expires_at: expiresAt,
        attempts: 0,
        is_verified: false,
        is_consumed: false
      })
      .select('otp_token')
      .single();

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    await sendVerificationEmail(email, full_name, booking_date, booking_time, data.otp_token);

    return jsonResponse({
      message: 'Verification link sent successfully.'
    });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
