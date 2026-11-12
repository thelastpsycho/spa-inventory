# Spa Inventory & Booking System

A comprehensive spa management system with a Supabase (Postgres) backend and a React frontend. Enables spa staff to manage bookings through an intuitive calendar interface, track inventory consumption, and prevent scheduling conflicts.

## Features

### 📅 Calendar & Booking Management
- **Interactive Calendar**: Daily, weekly, and monthly views with FullCalendar
- **Drag-and-Drop**: Easy booking creation and modification
- **Conflict Prevention**: Database-enforced detection of therapist and room conflicts
- **Booking Management**: Full CRUD operations with guest details

### 👥 Resource Management
- **Therapists**: Manage staff with contact information and availability
- **Rooms**: Track treatment rooms with capacity limits
- **Treatments**: Define services with duration and pricing
- **Soft Deletes**: Preserve historical booking data

### 📦 Inventory System
- **Product Tracking**: Monitor stock levels with units and reorder points
- **Auto-Deduction**: Automatic inventory updates based on bookings
- **Low Stock Alerts**: Dashboard notifications for reordering
- **Usage History**: Track product consumption per booking

### 🔐 Authentication
- **Secure Access**: Supabase Auth (email/password)
- **Row Level Security**: Every table is protected by Postgres RLS policies
- **Session Management**: Persistent logins with auto-logout

## Tech Stack

### Database / Backend
- **Supabase**: Postgres database, Auth, and auto-generated REST API (PostgREST)
- **No application server**: conflict detection, inventory sync, and statistics
  live in Postgres functions/triggers (see `supabase/migrations/`)

### Frontend
- **React 18**: Modern UI library
- **@supabase/supabase-js**: Talks to Supabase directly from the browser
- **Tailwind CSS**: Utility-first styling
- **FullCalendar**: Professional calendar component
- **Vite**: Fast build tool

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- Supabase CLI (optional, for pushing migrations): `npm install -g supabase`

### Database Setup

1. Create a Supabase project and grab its Project URL and publishable (anon) key from
   **Project Settings → API**.
2. Apply the migrations in `supabase/migrations/` in order — either:
   - Paste each file's contents into the Supabase Dashboard's **SQL Editor** and run them, or
   - `supabase link --project-ref <your-project-ref>` then `supabase db push`

   This creates all tables, RLS policies, and the Postgres functions/triggers
   that replace the old Laravel business logic, and seeds a small set of
   mock therapists/rooms/treatments/products/bookings.
3. Sign up for an account from the app's `/register` page — a `profiles` row
   is created automatically (via a trigger on `auth.users`) with `role: admin`.

### Frontend Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxx
```

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
spa-inventory/
├── supabase/
│   └── migrations/      # Schema, RLS policies, triggers/functions, mock data
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React context (auth)
│   ├── lib/             # Supabase client
│   ├── pages/           # Page components
│   └── services/        # Supabase data access (api.js)
└── package.json
```

## Database Logic

Since there's no application server, the following live directly in Postgres
(`supabase/migrations/20261112120000_init_schema.sql`):

- **`bookings_before_write()`** trigger — derives `end_time`/`duration` from
  the treatment, and rejects (raises an exception) any insert/update that
  would double-book a therapist or room for an active (`confirmed`/`tentative`) booking.
- **`check_booking_conflicts(...)`** RPC — non-blocking conflict preview used
  by the booking form while the user is still filling it in.
- **`booking_products_*`** triggers — deduct/restore product stock whenever
  products are attached to or detached from a booking.
- **`delete_booking(id)`** RPC — soft-deletes a booking and restores any
  inventory it had reserved.
- **`get_statistics(start_date, end_date)`** RPC — the reporting aggregate
  used by the Statistics page.
- Row Level Security — every table requires an authenticated Supabase session;
  `profiles` additionally restricts rows to their owner.

## Conflict Detection

The system automatically prevents:
- **Therapist Conflicts**: Double-booking the same therapist
- **Room Conflicts**: Double-booking the same room
- **Visual Alerts**: Clear error messages for conflicts

## Inventory Management

- **Automatic Deduction**: Products deducted when booking created
- **Automatic Restoration**: Products returned when booking deleted
- **Low Stock Alerts**: Products below reorder level highlighted
- **Flexible Units**: Support for pieces, ml, grams, etc.

## Development

### Code Style
```bash
npm run lint
```

## Deployment

### Database
Supabase is already hosted — just push migrations (`supabase db push`) as the
schema evolves.

### Frontend (Vercel)
1. Connect GitHub repository
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as environment variables
3. Deploy automatically on push

## Roadmap

### v1 (Current)
- ✅ Authentication & Authorization
- ✅ Calendar & Bookings
- ✅ Resource Management
- ✅ Inventory Tracking
- ✅ Conflict Prevention

### v2 (Future)
- Email/SMS Notifications
- Payment Processing
- Customer Portal
- Advanced Reporting
- Mobile App
- Multi-location Support

## Contributing

This is a proprietary project for spa management. For questions or support, please contact the development team.

## License

Proprietary - All rights reserved

## Support

For issues or questions, please create an issue in the project repository or contact the development team directly.
