-- Enable pgcrypto for UUID + hashing
create extension if not exists pgcrypto;

create table if not exists public.booking_otps (
  id uuid primary key default gen_random_uuid(),
  otp_token uuid not null unique default gen_random_uuid(),
  email text not null,
  full_name text not null,
  phone_number text not null,
  service_type text not null,
  booking_date date not null,
  booking_time time not null,
  otp_hash text not null,
  attempts integer not null default 0,
  is_verified boolean not null default false,
  is_consumed boolean not null default false,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone_number text not null,
  service_type text not null,
  booking_date date not null,
  booking_time time not null,
  status text not null default 'confirmed',
  otp_token uuid not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_slot_unique unique (booking_date, booking_time),
  constraint bookings_otp_fk foreign key (otp_token) references public.booking_otps (otp_token)
);

create index if not exists idx_bookings_date_time on public.bookings (booking_date, booking_time);
create index if not exists idx_booking_otps_email on public.booking_otps (email);
create index if not exists idx_booking_otps_token on public.booking_otps (otp_token);

alter table public.bookings enable row level security;
alter table public.booking_otps enable row level security;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
before update on public.bookings
for each row execute function public.touch_updated_at();

drop trigger if exists booking_otps_touch_updated_at on public.booking_otps;
create trigger booking_otps_touch_updated_at
before update on public.booking_otps
for each row execute function public.touch_updated_at();
