-- Guest nationality and booking source/company, surfaced in the booking form.
alter table public.bookings
  add column if not exists nationality text,
  add column if not exists source text;
