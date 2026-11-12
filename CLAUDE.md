# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Spa booking and inventory management system. React frontend talking directly
to a Supabase (Postgres) backend — there is no application server. The repo
used to have a Laravel API (`backend/`); it was removed and its business
logic was ported into Postgres triggers/functions.

## Commands

All commands run from `frontend/`:

```bash
npm install
npm run dev       # Vite dev server on http://localhost:3000
npm run build     # production build to frontend/dist
npm run preview   # serve the production build locally
npm run lint      # eslint — note: no eslint config file exists yet, this currently errors out of the box
```

There is no test suite in this repo.

Database changes live in `supabase/migrations/*.sql`, applied either by
pasting them into the Supabase Dashboard SQL Editor, or via the Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

## Architecture

**No backend server.** The frontend (`frontend/src`) talks straight to
Supabase via `@supabase/supabase-js`. Anything that used to be
application-layer logic in the old Laravel app now lives either in
`frontend/src/services/api.js` or directly in Postgres
(`supabase/migrations/20261112120000_init_schema.sql`):

- **`bookings_before_write()`** trigger (BEFORE INSERT/UPDATE on `bookings`) —
  derives `duration`/`end_time` from the treatment when not supplied, and
  raises an exception if the booking would double-book a therapist or room
  while in an active status (`confirmed`/`tentative`). This is the only real
  enforcement of "no double bookings" — there's no app server to gate writes,
  so the constraint has to live in the database.
- **`check_booking_conflicts(...)`** RPC — non-blocking conflict *preview*
  used by the booking form while a user is still filling it in (separate from
  the hard enforcement above).
- **`booking_products_deduct/restore/adjust()`** triggers on
  `booking_products` — keep `products.quantity` in sync whenever products are
  attached to / detached from a booking.
- **`delete_booking(id)`** RPC — soft-deletes a booking (sets `deleted_at`)
  and restores any inventory it had reserved. Bookings/therapists/rooms/
  treatments/products are all soft-deleted (`deleted_at` column), never hard
  DELETE'd — every read filters `deleted_at is null`.
- **`get_statistics(start_date, end_date)`** RPC — the full aggregate powering
  the Statistics page (revenue, occupancy, per-therapist/room/treatment
  breakdowns). This replaces what used to be a large PHP controller; changes
  to the report shape should be made here, not by pulling raw rows into JS.
- **Auth**: Supabase Auth + a `profiles` table (`id` = `auth.users.id`).
  `handle_new_user()` auto-creates a profile row on signup via a trigger on
  `auth.users`. Row Level Security is enabled on every table; all business
  tables are readable/writable by any `authenticated` user (there was never a
  real admin/staff permission split), while `profiles` restricts rows to
  their owner.

**`frontend/src/services/api.js`** wraps `supabase-js` calls behind the same
shape the old axios client used (`{ data }` on success, thrown `Error` with
`.response.data.message` on failure). This was intentional so the page
components didn't need to change when the backend did — keep that contract
if you touch this file, since every page's error handling (`error.response?.data?.message`)
depends on it.

**`frontend/src/contexts/AuthContext.jsx`** wraps Supabase Auth
(`signInWithPassword`/`signUp`/`signOut`) and additionally checks
`profiles.is_active`, signing the user back out if their account has been
deactivated — Supabase Auth alone doesn't know about that flag.

## Frontend structure

- `src/pages/` — one file per route (Calendar, Dashboard, Therapists, Rooms,
  Treatments, Products, Statistics, Login, Register), wired up in `App.jsx`.
  `Calendar.jsx` contains both the calendar view and the booking create/edit
  modal in one file.
- `src/services/api.js` — all Supabase data access, grouped by resource
  (`bookingAPI`, `therapistAPI`, `roomAPI`, `treatmentAPI`, `productAPI`,
  `statisticsAPI`, `authAPI`).
- `src/lib/supabaseClient.js` — the single `supabase-js` client instance,
  configured from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.
- `src/contexts/AuthContext.jsx` — session state + login/register/logout,
  consumed via the `useAuth()` hook.

## Environment

`frontend/.env` (gitignored, see `frontend/.env.example`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```
