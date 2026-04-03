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
    const otp_token = String(body.otp_token ?? '').trim();

    if (!full_name || !email || !phone_number || !service_type || !booking_date || !booking_time || !otp_token) {
      return jsonResponse({ error: 'Missing required fields.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: otpRow, error: otpError } = await supabase
      .from('booking_otps')
      .select('id, email, booking_date, booking_time, is_verified, is_consumed, expires_at')
      .eq('otp_token', otp_token)
      .maybeSingle();

    if (otpError) return jsonResponse({ error: otpError.message }, 500);
    if (!otpRow) return jsonResponse({ error: 'OTP session not found.' }, 404);
    if (otpRow.is_consumed) return jsonResponse({ error: 'OTP has already been used.' }, 400);
    if (!otpRow.is_verified) return jsonResponse({ error: 'OTP has not been verified.' }, 401);
    if (new Date(otpRow.expires_at).getTime() < Date.now()) return jsonResponse({ error: 'OTP expired.' }, 400);

    if (
      otpRow.email !== email ||
      otpRow.booking_date !== booking_date ||
      (otpRow.booking_time as string).slice(0, 5) !== booking_time
    ) {
      return jsonResponse({ error: 'Booking details do not match OTP session.' }, 400);
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        full_name,
        email,
        phone_number,
        service_type,
        booking_date,
        booking_time,
        otp_token,
        status: 'confirmed'
      })
      .select('id, full_name, email, service_type, booking_date, booking_time, status')
      .single();

    if (bookingError) {
      if (bookingError.code === '23505') {
        return jsonResponse({ error: 'Selected slot was just booked by another customer.' }, 409);
      }
      return jsonResponse({ error: bookingError.message }, 500);
    }

    const { error: consumeError } = await supabase
      .from('booking_otps')
      .update({ is_consumed: true })
      .eq('id', otpRow.id);

    if (consumeError) {
      return jsonResponse({ error: consumeError.message }, 500);
    }

    return jsonResponse({ message: 'Booking confirmed.', booking }, 201);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
