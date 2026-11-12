# Spa Inventory & Booking System

## What This Is

A spa management system for a medium-scale spa (4-8 therapists, 4-6 rooms,
30-50 daily bookings). Staff manage bookings through a calendar interface,
track inventory consumption per treatment, and the system prevents
double-booking therapists or rooms.

The frontend is a React SPA that talks directly to Supabase (Postgres) —
there is no application server in between. This is a deliberate rewrite: the
project originally shipped with a Laravel API backend, which was removed in
favor of Supabase so the app could run as a frontend-only deployment on
Vercel.

## Core Value

**Operational efficiency through conflict prevention.** No double-bookings of
therapists or rooms, with clear visibility into daily schedules and inventory
levels.

## Current Features

- **Calendar booking interface** — day/week/month views (FullCalendar),
  drag-and-drop to move or resize bookings
- **Booking management** — full CRUD with guest details, treatment,
  therapist, and room assignment
- **Conflict prevention** — enforced in Postgres (not just the client), so no
  double-booking is possible regardless of which client writes the data
- **Resource management** — therapists, rooms, treatments, all soft-deleted
  to preserve booking history
- **Inventory tracking** — product stock with automatic deduction/restoration
  tied to bookings, low-stock alerts
- **Statistics/reporting** — revenue, occupancy, therapist/room/treatment
  performance, computed by a Postgres function
- **Auth** — Supabase Auth (email/password), one role tier (every signed-in
  user has full access — there's no admin/staff permission split)

## Out of Scope (for now)

- Payment processing
- Email/SMS notifications
- Customer-facing booking portal
- Native mobile app
- Multi-location support
- Customer loyalty/repeat-customer tracking (guest details are stored per
  booking, not in a separate customers table)

## Technical Environment

- **Database**: Supabase (Postgres) — schema, RLS policies, and business
  logic (conflict detection, inventory sync, reporting) all live in
  `supabase/migrations/`
- **Frontend**: React 18 + Vite + Tailwind CSS, deployed to Vercel
- **Data access**: `@supabase/supabase-js` directly from the browser, no
  custom API layer beyond a thin wrapper (`src/services/api.js`)
- **No server-side application code** — anything that would normally live in
  a backend controller/service now lives in a Postgres trigger or RPC
  function (see `CLAUDE.md` for specifics)

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Removed the Laravel backend; moved to Supabase | Avoids hosting/maintaining a separate PHP server; lets the app deploy as a static frontend on Vercel |
| Conflict detection enforced as a Postgres trigger, not just client-side validation | With no backend gatekeeping writes, PostgREST exposes the tables directly — the no-double-booking rule has to be a hard DB constraint or any client could bypass it |
| Soft deletes on all resource tables (`deleted_at`), never hard DELETE | Preserves historical booking/inventory data, matching the original app's behavior |
| Single permission tier (any authenticated user has full read/write) | The original app never actually enforced an admin/staff distinction either; RLS policies reflect the real access model rather than inventing one |
| Inventory and statistics logic live in Postgres functions, not JS | Keeps a single source of truth for business rules now that there's no backend service layer to own them |

## Status

Migration from Laravel+PostgreSQL to Supabase is complete: schema, triggers,
RPC functions, and mock seed data are in `supabase/migrations/`; the frontend
has been fully repointed at Supabase. Not yet done:

- [ ] Apply the migrations to the live Supabase project (requires DB
      credentials or CLI access this environment doesn't have — run via the
      Supabase SQL Editor or `supabase db push`)
- [ ] Confirm the Supabase Auth email-confirmation setting matches what's
      needed for the `/register` flow to work end-to-end
- [ ] Deploy the frontend to Vercel with `VITE_SUPABASE_URL` /
      `VITE_SUPABASE_PUBLISHABLE_KEY` configured
