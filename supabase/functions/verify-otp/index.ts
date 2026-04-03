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

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { otp_token, otp_code } = await req.json();
    if (!otp_token || !otp_code) {
      return jsonResponse({ error: 'otp_token and otp_code are required.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: otpRecord, error } = await supabase
      .from('booking_otps')
      .select('id, otp_hash, attempts, expires_at, is_consumed, is_verified')
      .eq('otp_token', otp_token)
      .maybeSingle();

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    if (!otpRecord) return jsonResponse({ error: 'OTP session not found.' }, 404);
    if (otpRecord.is_consumed) return jsonResponse({ error: 'OTP already used.' }, 400);
    if (otpRecord.is_verified) return jsonResponse({ message: 'OTP already verified.' }, 200);
    if (new Date(otpRecord.expires_at).getTime() < Date.now()) {
      return jsonResponse({ error: 'OTP expired.' }, 400);
    }
    if (otpRecord.attempts >= 5) {
      return jsonResponse({ error: 'Too many OTP attempts.' }, 429);
    }

    const incomingHash = await sha256(String(otp_code).trim());
    if (incomingHash !== otpRecord.otp_hash) {
      await supabase
        .from('booking_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      return jsonResponse({ error: 'Invalid OTP code.' }, 401);
    }

    const { error: updateError } = await supabase
      .from('booking_otps')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    if (updateError) {
      return jsonResponse({ error: updateError.message }, 500);
    }

    return jsonResponse({ message: 'OTP verified successfully.' }, 200);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
