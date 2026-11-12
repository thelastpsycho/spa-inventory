-- Mock data for local development / demos.
-- Safe to re-run: every insert is guarded so it only fires on an empty table.

insert into public.rooms (name, capacity, notes, is_active)
select * from (values
  ('Serenity Suite', 1, 'Private suite with ocean view', true),
  ('Lotus Room', 2, 'Couples treatment room', true),
  ('Bamboo Room', 1, 'Standard single treatment room', true),
  ('Jasmine Room', 1, 'Standard single treatment room', true),
  ('Orchid Suite', 2, 'Premium suite with jacuzzi', true)
) as v (name, capacity, notes, is_active)
where not exists (select 1 from public.rooms);

insert into public.therapists (name, email, phone, notes, is_active)
select * from (values
  ('Wayan Sari', 'wayan.sari@example.com', '+62-812-1111-2222', 'Specializes in deep tissue massage', true),
  ('Made Ayu', 'made.ayu@example.com', '+62-812-3333-4444', 'Specializes in Balinese massage', true),
  ('Kadek Putri', 'kadek.putri@example.com', '+62-812-5555-6666', 'Specializes in facials and body scrubs', true),
  ('Nyoman Dewi', 'nyoman.dewi@example.com', '+62-812-7777-8888', 'Specializes in reflexology', true),
  ('Ketut Ratna', null, '+62-812-9999-0000', 'On leave until next month', false)
) as v (name, email, phone, notes, is_active)
where not exists (select 1 from public.therapists);

insert into public.treatments (name, description, duration, price, is_active)
select * from (values
  ('Balinese Massage', 'Traditional full-body massage using acupressure and aromatherapy oils', 60, 450000, true),
  ('Deep Tissue Massage', 'Targets deep muscle tension and chronic pain', 90, 600000, true),
  ('Aromatherapy Massage', 'Relaxing massage with essential oils', 60, 480000, true),
  ('Hot Stone Massage', 'Smooth heated stones ease muscle tension', 75, 550000, true),
  ('Classic Facial', 'Cleansing, exfoliation, and hydration facial', 45, 350000, true),
  ('Body Scrub & Wrap', 'Full-body exfoliation followed by a nourishing wrap', 60, 500000, true),
  ('Reflexology', 'Pressure-point foot massage to relieve tension', 45, 300000, true),
  ('Couples Retreat Package', 'Side-by-side massage for two in a private suite', 90, 1100000, true)
) as v (name, description, duration, price, is_active)
where not exists (select 1 from public.treatments);

insert into public.products (name, description, quantity, unit, reorder_level, cost, is_active)
select * from (values
  ('Massage Oil - Lavender', 'Relaxing lavender-scented massage oil', 45, 'ml', 20, 15000, true),
  ('Massage Oil - Eucalyptus', 'Invigorating eucalyptus massage oil', 8, 'ml', 20, 15000, true),
  ('Hot Stones Set', 'Set of basalt stones for hot stone massage', 6, 'pcs', 2, 250000, true),
  ('Body Scrub - Coffee', 'Exfoliating coffee body scrub', 12, 'kg', 5, 85000, true),
  ('Facial Cleanser', 'Gentle foaming facial cleanser', 18, 'ml', 10, 45000, true),
  ('Disposable Towels', 'Single-use spa towels', 150, 'pcs', 50, 2000, true),
  ('Aromatherapy Candles', 'Scented soy candles for ambiance', 4, 'pcs', 10, 35000, true),
  ('Hydrating Face Mask', 'Single-use hydrating sheet mask', 30, 'pcs', 15, 12000, true)
) as v (name, description, quantity, unit, reorder_level, cost, is_active)
where not exists (select 1 from public.products);

-- A handful of sample bookings spread across today and the surrounding week
-- so the Dashboard, Calendar, and Statistics pages have something to show.
-- created_by is left null — there's no seed auth user to attribute these to.
do $$
declare
  v_room_1 bigint; v_room_2 bigint; v_room_3 bigint;
  v_therapist_1 bigint; v_therapist_2 bigint; v_therapist_3 bigint;
  v_treatment_1 bigint; v_treatment_2 bigint; v_treatment_3 bigint; v_treatment_4 bigint;
begin
  if exists (select 1 from public.bookings) then
    return;
  end if;

  select id into v_room_1 from public.rooms order by id limit 1 offset 0;
  select id into v_room_2 from public.rooms order by id limit 1 offset 1;
  select id into v_room_3 from public.rooms order by id limit 1 offset 2;

  select id into v_therapist_1 from public.therapists order by id limit 1 offset 0;
  select id into v_therapist_2 from public.therapists order by id limit 1 offset 1;
  select id into v_therapist_3 from public.therapists order by id limit 1 offset 2;

  select id into v_treatment_1 from public.treatments order by id limit 1 offset 0;
  select id into v_treatment_2 from public.treatments order by id limit 1 offset 1;
  select id into v_treatment_3 from public.treatments order by id limit 1 offset 2;
  select id into v_treatment_4 from public.treatments order by id limit 1 offset 4;

  insert into public.bookings (guest_name, guest_email, guest_phone, treatment_id, therapist_id, room_id, start_time, status, notes, created_by)
  values
    ('Sarah Johnson', 'sarah.j@example.com', '+1-555-0101', v_treatment_1, v_therapist_1, v_room_1, date_trunc('day', now()) + interval '10 hours', 'confirmed', 'First-time guest', null),
    ('Michael Chen', 'michael.chen@example.com', '+1-555-0102', v_treatment_2, v_therapist_2, v_room_2, date_trunc('day', now()) + interval '13 hours', 'confirmed', null, null),
    ('Emily Rodriguez', null, '+1-555-0103', v_treatment_3, v_therapist_3, v_room_3, date_trunc('day', now()) + interval '15 hours 30 minutes', 'tentative', 'Prefers quiet room', null),
    ('David Park', 'david.park@example.com', '+1-555-0104', v_treatment_4, v_therapist_1, v_room_2, date_trunc('day', now()) + interval '1 day 9 hours', 'confirmed', null, null),
    ('Lisa Wang', 'lisa.wang@example.com', '+1-555-0105', v_treatment_1, v_therapist_2, v_room_1, date_trunc('day', now()) + interval '1 day 11 hours', 'waiting_list', 'Waiting for a cancellation', null),
    ('James Miller', null, '+1-555-0106', v_treatment_2, v_therapist_3, v_room_3, date_trunc('day', now()) + interval '2 days 14 hours', 'tentative', null, null),
    ('Anna Kowalski', 'anna.k@example.com', '+1-555-0107', v_treatment_3, v_therapist_1, v_room_2, date_trunc('day', now()) - interval '1 day' + interval '10 hours', 'completed', 'Regular guest', null),
    ('Robert Garcia', 'robert.g@example.com', '+1-555-0108', v_treatment_1, v_therapist_2, v_room_1, date_trunc('day', now()) - interval '2 days' + interval '16 hours', 'cancelled', 'Rescheduled to next week', null);
end $$;
