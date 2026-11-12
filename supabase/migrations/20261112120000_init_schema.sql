-- Spa Inventory & Booking System — Supabase schema
-- Replaces the Laravel API: business logic that used to live in
-- App\Services\BookingService and the various controllers now lives here,
-- since the frontend talks to Postgres directly (no application server).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Profiles (mirrors the old `users` table, keyed to Supabase Auth)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'admin',
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER functions are callable by PUBLIC by default; this one is
-- only ever invoked by the trigger above, so direct calls are revoked.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ============================================================
-- Resources
-- ============================================================
create table public.therapists (
  id bigint generated always as identity primary key,
  name text not null,
  email text,
  phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index therapists_active_created_idx on public.therapists (is_active, created_at);
create trigger therapists_set_updated_at before update on public.therapists for each row execute function public.set_updated_at();

create table public.rooms (
  id bigint generated always as identity primary key,
  name text not null,
  capacity integer not null default 1,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index rooms_active_created_idx on public.rooms (is_active, created_at);
create trigger rooms_set_updated_at before update on public.rooms for each row execute function public.set_updated_at();

create table public.treatments (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  duration integer not null,
  price numeric(10, 2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index treatments_active_created_idx on public.treatments (is_active, created_at);
create trigger treatments_set_updated_at before update on public.treatments for each row execute function public.set_updated_at();

create table public.products (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  quantity integer not null default 0,
  unit text not null default 'pcs',
  reorder_level integer not null default 10,
  cost numeric(10, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index products_active_quantity_idx on public.products (is_active, quantity);
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();

-- ============================================================
-- Bookings
-- ============================================================
create table public.bookings (
  id bigint generated always as identity primary key,
  guest_name text not null,
  guest_email text,
  guest_phone text,
  treatment_id bigint not null references public.treatments (id) on delete restrict,
  therapist_id bigint not null references public.therapists (id) on delete restrict,
  room_id bigint not null references public.rooms (id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz,
  duration integer,
  notes text,
  status text not null default 'tentative'
    check (status in ('confirmed', 'tentative', 'waiting_list', 'completed', 'cancelled')),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index bookings_therapist_time_idx on public.bookings (therapist_id, start_time, end_time);
create index bookings_room_time_idx on public.bookings (room_id, start_time, end_time);
create index bookings_treatment_id_idx on public.bookings (treatment_id);
create index bookings_status_start_idx on public.bookings (status, start_time);
create index bookings_guest_name_idx on public.bookings (guest_name);
create index bookings_guest_phone_idx on public.bookings (guest_phone);
create index bookings_guest_email_idx on public.bookings (guest_email);
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();

comment on column public.bookings.status is 'confirmed, tentative, waiting_list, completed, cancelled';

create table public.booking_products (
  id bigint generated always as identity primary key,
  booking_id bigint not null references public.bookings (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, product_id)
);
create index booking_products_product_id_idx on public.booking_products (product_id);
create trigger booking_products_set_updated_at before update on public.booking_products for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- end_time/duration derivation + conflict enforcement.
-- Previously: BookingService::createBooking/updateBooking (duration math)
-- and the (unenforced) checkConflicts preview. Without an application
-- server sitting in front of writes, the conflict rule has to be a hard
-- DB constraint or any client could silently double-book a therapist/room.
-- ------------------------------------------------------------
create or replace function public.bookings_before_write()
returns trigger language plpgsql as $$
declare
  treatment_duration integer;
  conflict_count integer;
begin
  if new.duration is null then
    select duration into treatment_duration from public.treatments where id = new.treatment_id;
    new.duration := treatment_duration;
  end if;

  new.end_time := new.start_time + (new.duration || ' minutes')::interval;

  if new.status in ('confirmed', 'tentative') then
    select count(*) into conflict_count
    from public.bookings b
    where b.deleted_at is null
      and b.id is distinct from new.id
      and b.status in ('confirmed', 'tentative')
      and (
        (b.therapist_id = new.therapist_id and (
          b.start_time between new.start_time and new.end_time
          or b.end_time between new.start_time and new.end_time
          or (b.start_time < new.start_time and b.end_time > new.end_time)
        ))
        or
        (b.room_id = new.room_id and (
          b.start_time between new.start_time and new.end_time
          or b.end_time between new.start_time and new.end_time
          or (b.start_time < new.start_time and b.end_time > new.end_time)
        ))
      );

    if conflict_count > 0 then
      raise exception 'This therapist or room already has a booking during the selected time'
        using errcode = '23P01';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_bookings_before_write
  before insert or update on public.bookings
  for each row execute function public.bookings_before_write();

-- Restore inventory when a booking is soft-deleted (mirrors BookingService::deleteBooking,
-- which restores stock but — matching the original behavior — leaves the
-- booking_products rows in place rather than detaching them).
create or replace function public.bookings_restore_inventory_on_delete()
returns trigger language plpgsql as $$
begin
  update public.products p
  set quantity = p.quantity + bp.quantity
  from public.booking_products bp
  where bp.booking_id = new.id
    and p.id = bp.product_id;
  return new;
end;
$$;

create trigger trg_bookings_restore_inventory_on_delete
  after update on public.bookings
  for each row
  when (old.deleted_at is null and new.deleted_at is not null)
  execute function public.bookings_restore_inventory_on_delete();

-- Keep product stock in sync with attached booking_products rows
-- (mirrors the attach/decrement and detach/increment calls in BookingService).
create or replace function public.booking_products_deduct()
returns trigger language plpgsql as $$
begin
  update public.products set quantity = quantity - new.quantity where id = new.product_id;
  return new;
end;
$$;

create or replace function public.booking_products_restore()
returns trigger language plpgsql as $$
begin
  update public.products set quantity = quantity + old.quantity where id = old.product_id;
  return old;
end;
$$;

create or replace function public.booking_products_adjust()
returns trigger language plpgsql as $$
begin
  if new.quantity <> old.quantity then
    update public.products set quantity = quantity + (old.quantity - new.quantity) where id = new.product_id;
  end if;
  return new;
end;
$$;

create trigger trg_booking_products_deduct after insert on public.booking_products for each row execute function public.booking_products_deduct();
create trigger trg_booking_products_restore after delete on public.booking_products for each row execute function public.booking_products_restore();
create trigger trg_booking_products_adjust after update on public.booking_products for each row execute function public.booking_products_adjust();

-- Non-blocking conflict preview, used by the booking form while the user is
-- still filling it in (mirrors BookingController::checkConflicts).
create or replace function public.check_booking_conflicts(
  p_therapist_id bigint default null,
  p_room_id bigint default null,
  p_start_time timestamptz default null,
  p_end_time timestamptz default null,
  p_exclude_booking_id bigint default null
)
returns table (
  id bigint,
  guest_name text,
  status text,
  start_time timestamptz,
  end_time timestamptz,
  treatment jsonb,
  therapist jsonb,
  room jsonb
)
language sql stable as $$
  select b.id, b.guest_name, b.status, b.start_time, b.end_time,
         jsonb_build_object('id', t.id, 'name', t.name, 'duration', t.duration, 'price', t.price) as treatment,
         jsonb_build_object('id', th.id, 'name', th.name) as therapist,
         jsonb_build_object('id', r.id, 'name', r.name) as room
  from public.bookings b
  join public.treatments t on t.id = b.treatment_id
  join public.therapists th on th.id = b.therapist_id
  join public.rooms r on r.id = b.room_id
  where b.deleted_at is null
    and b.status in ('confirmed', 'tentative')
    and b.id is distinct from p_exclude_booking_id
    and p_start_time is not null and p_end_time is not null
    and (
      (p_therapist_id is not null and b.therapist_id = p_therapist_id and (
        b.start_time between p_start_time and p_end_time
        or b.end_time between p_start_time and p_end_time
        or (b.start_time < p_start_time and b.end_time > p_end_time)
      ))
      or
      (p_room_id is not null and b.room_id = p_room_id and (
        b.start_time between p_start_time and p_end_time
        or b.end_time between p_start_time and p_end_time
        or (b.start_time < p_start_time and b.end_time > p_end_time)
      ))
    );
$$;

-- Soft-delete a booking: restore any attached inventory, then mark it
-- deleted (never a hard delete, so history is preserved like the Laravel
-- SoftDeletes trait did).
create or replace function public.delete_booking(p_booking_id bigint)
returns void language sql as $$
  update public.bookings set deleted_at = now() where id = p_booking_id and deleted_at is null;
$$;

-- ============================================================
-- Statistics (mirrors StatisticsController::index)
-- ============================================================
create or replace function public.get_statistics(
  p_start_date date default null,
  p_end_date date default null
)
returns jsonb
language plpgsql stable as $$
declare
  v_start date := coalesce(p_start_date, date_trunc('month', current_date)::date);
  v_end date := coalesce(p_end_date, (date_trunc('month', current_date) + interval '1 month - 1 day')::date);
  v_range_start timestamptz := v_start;
  v_range_end timestamptz := v_end + interval '1 day';
  v_total_bookings integer;
  v_confirmed integer;
  v_completed integer;
  v_tentative integer;
  v_waiting integer;
  v_cancelled integer;
  v_total_therapists integer;
  v_active_therapists integer;
  v_total_rooms integer;
  v_total_capacity integer;
  v_total_treatments integer;
  v_active_treatments integer;
  v_total_revenue numeric;
  v_total_minutes numeric;
  v_avg_booking_value numeric;
  v_active_bookings_count integer;
  v_occupancy_rate numeric;
  v_total_products integer;
  v_low_stock_products integer;
  v_total_inventory_value numeric;
  v_therapist_performance jsonb;
  v_room_utilization jsonb;
  v_treatment_popularity jsonb;
  v_total_treatment_revenue numeric;
  v_most_popular jsonb;
begin
  select count(*) into v_total_bookings from public.bookings
    where deleted_at is null and start_time >= v_range_start and start_time < v_range_end;
  select count(*) into v_confirmed from public.bookings
    where deleted_at is null and start_time >= v_range_start and start_time < v_range_end and status = 'confirmed';
  select count(*) into v_completed from public.bookings
    where deleted_at is null and start_time >= v_range_start and start_time < v_range_end and status = 'completed';
  select count(*) into v_tentative from public.bookings
    where deleted_at is null and start_time >= v_range_start and start_time < v_range_end and status = 'tentative';
  select count(*) into v_waiting from public.bookings
    where deleted_at is null and start_time >= v_range_start and start_time < v_range_end and status = 'waiting_list';
  select count(*) into v_cancelled from public.bookings
    where deleted_at is null and start_time >= v_range_start and start_time < v_range_end and status = 'cancelled';

  select count(*), coalesce(sum(capacity), 0) into v_total_rooms, v_total_capacity
    from public.rooms where deleted_at is null;
  select count(*) into v_total_therapists from public.therapists where deleted_at is null;
  select count(*) into v_active_therapists from public.therapists where deleted_at is null and is_active;
  select count(*) into v_total_treatments from public.treatments where deleted_at is null;
  select count(*) into v_active_treatments from public.treatments where deleted_at is null and is_active;

  select coalesce(sum(t.price), 0), coalesce(sum(t.duration), 0)
    into v_total_revenue, v_total_minutes
    from public.bookings b join public.treatments t on t.id = b.treatment_id
    where b.deleted_at is null and b.start_time >= v_range_start and b.start_time < v_range_end
      and b.status in ('confirmed', 'completed');

  v_active_bookings_count := v_confirmed + v_completed;
  v_avg_booking_value := case when v_active_bookings_count > 0 then v_total_revenue / v_active_bookings_count else 0 end;
  v_occupancy_rate := case when v_total_capacity > 0
    then round(((v_total_minutes / 60) / (v_total_capacity * 8 * 30)) * 100, 2)
    else 0 end;

  select count(*), count(*) filter (where quantity <= reorder_level), coalesce(sum(quantity * coalesce(cost, 0)), 0)
    into v_total_products, v_low_stock_products, v_total_inventory_value
    from public.products where deleted_at is null;

  select coalesce(jsonb_agg(row order by sort_revenue desc, th_id asc), '[]'::jsonb) into v_therapist_performance from (
    select
      jsonb_build_object(
        'id', th.id,
        'name', th.name,
        'email', th.email,
        'total_bookings', count(b.id),
        'total_hours', round(coalesce(sum(t.duration), 0) / 60.0, 2),
        'total_revenue', round(coalesce(sum(t.price), 0), 2),
        'average_booking_value', case when count(b.id) > 0 then round(coalesce(sum(t.price), 0) / count(b.id), 2) else 0 end
      ) as row,
      coalesce(sum(t.price), 0) as sort_revenue,
      th.id as th_id
    from public.therapists th
    left join public.bookings b on b.therapist_id = th.id and b.deleted_at is null
      and b.start_time >= v_range_start and b.start_time < v_range_end and b.status in ('confirmed', 'completed')
    left join public.treatments t on t.id = b.treatment_id
    where th.deleted_at is null
    group by th.id, th.name, th.email
  ) ranked;

  select coalesce(jsonb_agg(row order by sort_bookings desc, r_id asc), '[]'::jsonb) into v_room_utilization from (
    select
      jsonb_build_object(
        'id', r.id,
        'name', r.name,
        'capacity', r.capacity,
        'total_bookings', count(b.id),
        'total_hours', round(coalesce(sum(t.duration), 0) / 60.0, 2),
        'utilization_percentage', case when coalesce(sum(t.duration), 0) > 0
          then round((coalesce(sum(t.duration), 0) / 60.0 / (r.capacity * 8 * 30)) * 100, 2)
          else 0 end
      ) as row,
      count(b.id) as sort_bookings,
      r.id as r_id
    from public.rooms r
    left join public.bookings b on b.room_id = r.id and b.deleted_at is null
      and b.start_time >= v_range_start and b.start_time < v_range_end and b.status in ('confirmed', 'completed')
    left join public.treatments t on t.id = b.treatment_id
    where r.deleted_at is null
    group by r.id, r.name, r.capacity
  ) ranked;

  select coalesce(sum(count_for_treatment * tr.price), 0) into v_total_treatment_revenue
    from public.treatments tr
    left join lateral (
      select count(*) as count_for_treatment
      from public.bookings b
      where b.treatment_id = tr.id and b.deleted_at is null
        and b.start_time >= v_range_start and b.start_time < v_range_end and b.status in ('confirmed', 'completed')
    ) counted on true
    where tr.deleted_at is null;

  select coalesce(jsonb_agg(row order by sort_count desc, tr_id asc), '[]'::jsonb) into v_treatment_popularity from (
    select
      jsonb_build_object(
        'id', tr.id,
        'name', tr.name,
        'duration', tr.duration,
        'price', round(tr.price, 2),
        'booking_count', count(b.id),
        'total_revenue', round(count(b.id) * tr.price, 2),
        'revenue_percentage', case when v_total_treatment_revenue > 0
          then round((count(b.id) * tr.price / v_total_treatment_revenue) * 100, 2)
          else 0 end
      ) as row,
      count(b.id) as sort_count,
      tr.id as tr_id
    from public.treatments tr
    left join public.bookings b on b.treatment_id = tr.id and b.deleted_at is null
      and b.start_time >= v_range_start and b.start_time < v_range_end and b.status in ('confirmed', 'completed')
    where tr.deleted_at is null
    group by tr.id, tr.name, tr.duration, tr.price
  ) ranked;

  v_most_popular := case when (v_treatment_popularity -> 0 ->> 'booking_count')::int > 0 then
    jsonb_build_object(
      'name', v_treatment_popularity -> 0 ->> 'name',
      'count', (v_treatment_popularity -> 0 ->> 'booking_count')::int,
      'revenue', (v_treatment_popularity -> 0 ->> 'total_revenue')::numeric
    )
  else null end;

  return jsonb_build_object(
    'period', jsonb_build_object('start_date', v_start, 'end_date', v_end),
    'overview', jsonb_build_object(
      'total_bookings', v_total_bookings,
      'confirmed_bookings', v_confirmed,
      'completed_bookings', v_completed,
      'tentative_bookings', v_tentative,
      'waiting_list_bookings', v_waiting,
      'cancelled_bookings', v_cancelled,
      'total_revenue', round(v_total_revenue, 2),
      'total_treatment_hours', round(v_total_minutes, 2),
      'average_booking_value', round(v_avg_booking_value, 2),
      'occupancy_rate', v_occupancy_rate,
      'most_popular_treatment', v_most_popular
    ),
    'resources', jsonb_build_object(
      'total_therapists', v_total_therapists,
      'active_therapists', v_active_therapists,
      'total_rooms', v_total_rooms,
      'total_capacity', v_total_capacity,
      'total_treatments', v_total_treatments,
      'active_treatments', v_active_treatments
    ),
    'inventory', jsonb_build_object(
      'total_products', v_total_products,
      'low_stock_products', v_low_stock_products,
      'total_inventory_value', round(v_total_inventory_value, 2)
    ),
    'therapist_performance', v_therapist_performance,
    'room_utilization', v_room_utilization,
    'treatment_popularity', v_treatment_popularity
  );
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.therapists enable row level security;
alter table public.rooms enable row level security;
alter table public.treatments enable row level security;
alter table public.products enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_products enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Every signed-in staff account is trusted equally (admin/staff were never
-- actually distinguished in the old Laravel authorization either), so these
-- tables are readable/writable by any authenticated user.
create policy "Authenticated users can read therapists" on public.therapists for select to authenticated using (true);
create policy "Authenticated users can write therapists" on public.therapists for insert to authenticated with check (true);
create policy "Authenticated users can update therapists" on public.therapists for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete therapists" on public.therapists for delete to authenticated using (true);

create policy "Authenticated users can read rooms" on public.rooms for select to authenticated using (true);
create policy "Authenticated users can write rooms" on public.rooms for insert to authenticated with check (true);
create policy "Authenticated users can update rooms" on public.rooms for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete rooms" on public.rooms for delete to authenticated using (true);

create policy "Authenticated users can read treatments" on public.treatments for select to authenticated using (true);
create policy "Authenticated users can write treatments" on public.treatments for insert to authenticated with check (true);
create policy "Authenticated users can update treatments" on public.treatments for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete treatments" on public.treatments for delete to authenticated using (true);

create policy "Authenticated users can read products" on public.products for select to authenticated using (true);
create policy "Authenticated users can write products" on public.products for insert to authenticated with check (true);
create policy "Authenticated users can update products" on public.products for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete products" on public.products for delete to authenticated using (true);

create policy "Authenticated users can read bookings" on public.bookings for select to authenticated using (true);
create policy "Authenticated users can write bookings" on public.bookings for insert to authenticated with check (true);
create policy "Authenticated users can update bookings" on public.bookings for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete bookings" on public.bookings for delete to authenticated using (true);

create policy "Authenticated users can read booking_products" on public.booking_products for select to authenticated using (true);
create policy "Authenticated users can write booking_products" on public.booking_products for insert to authenticated with check (true);
create policy "Authenticated users can update booking_products" on public.booking_products for update to authenticated using (true) with check (true);
create policy "Authenticated users can delete booking_products" on public.booking_products for delete to authenticated using (true);

grant execute on function public.check_booking_conflicts to authenticated;
grant execute on function public.get_statistics to authenticated;
grant execute on function public.delete_booking to authenticated;
