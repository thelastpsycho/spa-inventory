# Spa Inventory & Booking System

A comprehensive spa management system with API-first Laravel backend and React frontend. Enables spa staff to manage bookings through an intuitive calendar interface, track inventory consumption, and prevent scheduling conflicts.

## Features

### 📅 Calendar & Booking Management
- **Interactive Calendar**: Daily, weekly, and monthly views with FullCalendar
- **Drag-and-Drop**: Easy booking creation and modification
- **Conflict Prevention**: Real-time detection of therapist and room conflicts
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
- **Secure Access**: Laravel Sanctum token-based authentication
- **User Management**: Admin and staff roles
- **Session Management**: Persistent logins with auto-logout

## Tech Stack

### Backend
- **Laravel 11**: Modern PHP framework
- **PostgreSQL**: Advanced relational database
- **Sanctum**: API authentication
- **API-First**: Clean separation of concerns

### Frontend
- **React 18**: Modern UI library
- **Tailwind CSS**: Utility-first styling
- **FullCalendar**: Professional calendar component
- **Vite**: Fast build tool

## Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- PostgreSQL 12+

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure `.env`:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=spa_booking
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

```bash
createdb spa_booking
php artisan migrate
php artisan serve
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
spa-inventory/
├── backend/                 # Laravel API
│   ├── app/
│   │   ├── Http/           # Controllers, Requests
│   │   ├── Models/         # Eloquent models
│   │   └── Services/       # Business logic
│   ├── database/
│   │   └── migrations/     # Database schema
│   └── routes/
│       └── api.php         # API routes
├── frontend/               # React app
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React context
│   │   ├── pages/          # Page components
│   │   └── services/       # API calls
│   └── package.json
└── .planning/              # Project planning
```

## API Documentation

### Authentication
- `POST /api/register` - Create new admin account
- `POST /api/login` - Authenticate user
- `POST /api/logout` - End session
- `GET /api/me` - Get current user

### Bookings
- `GET /api/bookings` - List bookings (supports filtering)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Delete booking
- `GET /api/bookings/conflicts/check` - Check for conflicts

### Resources
- `GET /api/therapists` - List therapists
- `GET /api/rooms` - List rooms
- `GET /api/treatments` - List treatments
- `GET /api/products` - List products (with low_stock filter)

All resources support full CRUD operations.

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

### Running Tests
```bash
cd backend
php artisan test
```

### Code Style
```bash
cd backend
./vendor/bin/pint

cd frontend
npm run lint
```

## Deployment

### Backend (Shared Hosting)
1. Upload backend files
2. Configure environment variables
3. Run migrations: `php artisan migrate --force`
4. Set file permissions

### Frontend (Vercel)
1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy automatically on push

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
