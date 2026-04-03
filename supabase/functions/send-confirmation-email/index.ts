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
    const { full_name, email, service_type, booking_date, booking_time } = await req.json();
    if (!full_name || !email || !service_type || !booking_date || !booking_time) {
      return jsonResponse({ error: 'Missing required fields for confirmation email.' }, 400);
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'bookings@example.com';

    if (!resendKey) {
      return jsonResponse({ error: 'RESEND_API_KEY is missing.' }, 500);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'Your GreenLeaf booking is confirmed',
        html: `<p>Hi ${full_name},</p><p>Your booking is confirmed.</p><p><strong>Service:</strong> ${service_type}<br><strong>Date:</strong> ${booking_date}<br><strong>Time:</strong> ${booking_time}</p><p>Thank you for choosing GreenLeaf Pest Control.</p>`
      })
    });

    if (!response.ok) {
      const details = await response.text();
      return jsonResponse({ error: `Failed to send email: ${details}` }, 502);
    }

    return jsonResponse({ message: 'Confirmation email sent.' }, 200);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
