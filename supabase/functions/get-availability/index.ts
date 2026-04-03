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
    const { date_from, date_to } = await req.json();
    if (!date_from || !date_to) {
      return jsonResponse({ error: 'date_from and date_to are required.' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('bookings')
      .select('booking_date, booking_time')
      .eq('status', 'confirmed')
      .gte('booking_date', date_from)
      .lte('booking_date', date_to);

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    const bookedTimesByDate: Record<string, string[]> = {};
    (data ?? []).forEach((row) => {
      const key = row.booking_date;
      const time = (row.booking_time as string).slice(0, 5);
      bookedTimesByDate[key] = bookedTimesByDate[key] ?? [];
      bookedTimesByDate[key].push(time);
    });

    return jsonResponse({ booked_times_by_date: bookedTimesByDate });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
