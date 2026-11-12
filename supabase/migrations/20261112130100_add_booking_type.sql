-- Booking type: package deal vs a regular single-treatment booking.
alter table public.bookings
  add column if not exists type text not null default 'regular'
    check (type in ('regular', 'package'));
