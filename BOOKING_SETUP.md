# Booking System Setup (Dashboard-first: Supabase + Resend + cPanel)

This guide is written for **Supabase Dashboard deployment first** (no CLI required).

## 1) Create Supabase project
1. Go to https://supabase.com and create a project.
2. In **Project Settings → API**, copy:
   - Project URL
   - anon public key
   - service_role key (backend only, never in frontend)

## 2) Create database tables
1. Open **SQL Editor** in Supabase Dashboard.
2. Paste and run `supabase/sql/booking_schema.sql`.
3. Confirm tables exist:
   - `booking_otps`
   - `bookings`

## 3) Add Edge Functions from Dashboard (no CLI)
Create 5 functions in **Supabase → Edge Functions**:
- `get-availability`
- `send-otp`
- `verify-otp`
- `create-booking`
- `send-confirmation-email`

For each function:
1. Click **New Function**.
2. Use the exact function name above.
3. Open matching local file `supabase/functions/<function-name>/index.ts`.
4. Copy/paste full code into the Dashboard editor.
5. Deploy.

> Note: each function is intentionally self-contained (single-file) to support direct dashboard paste/deploy.

## 4) Add Edge Function secrets in Dashboard
Open **Project Settings → Edge Functions → Secrets** and add:
- `SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY`
- `RESEND_API_KEY=YOUR_RESEND_API_KEY`
- `RESEND_FROM_EMAIL=bookings@yourdomain.com`

## 5) Configure frontend connection
In `booking.js`, replace:
- `CONFIG.supabaseUrl`
- `CONFIG.supabaseAnonKey`

Do not add service role keys to frontend code.

## 6) Configure Resend
1. Verify your sending domain in Resend.
2. Ensure `RESEND_FROM_EMAIL` belongs to that verified domain.
3. Test outbound mail before production.

## 7) OTP flow test checklist
1. Open `contact.html`.
2. Fill the booking form.
3. Select date and time.
4. Click **Send OTP**.
5. Verify OTP from your inbox.
6. Click **Confirm Booking**.
7. Confirm redirect to `/thank-you.html`.

## 8) Double-booking test checklist
1. Complete one booking for a specific slot.
2. In another browser/session, try the same slot.
3. Verify second booking fails with conflict.

## 9) Deploy website files to cPanel
Upload/update:
- `contact.html`
- `booking.js`
- `style.css`

Then clear cache/CDN if applicable.

## 10) (Optional) CLI deploy commands
If you later choose CLI:
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy get-availability
supabase functions deploy send-otp
supabase functions deploy verify-otp
supabase functions deploy create-booking
supabase functions deploy send-confirmation-email
```
