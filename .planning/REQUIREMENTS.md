# Requirements: Spa Inventory & Booking System

**Defined:** 2026-04-03
**Core Value:** Operational efficiency through conflict prevention

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: Admin user can register account with email and password
- [ ] **AUTH-02**: Admin user can log in and receive session token via Laravel Sanctum
- [ ] **AUTH-03**: Admin session persists across browser refresh
- [ ] **AUTH-04**: Admin user can log out from any page

### Calendar & Bookings

- [ ] **BOOK-01**: User can view bookings in daily calendar view
- [ ] **BOOK-02**: User can view bookings in weekly calendar view
- [ ] **BOOK-03**: User can create booking by clicking/dragging on calendar
- [ ] **BOOK-04**: User can edit booking details (guest name, phone, email, treatment, therapist, room, start/end time)
- [ ] **BOOK-05**: User can move booking via drag-and-drop to different time slot
- [ ] **BOOK-06**: User can resize booking via drag to change duration
- [ ] **BOOK-07**: User can delete booking from calendar
- [ ] **BOOK-08**: System prevents double-booking of therapist (real-time conflict detection)
- [ ] **BOOK-09**: System prevents double-booking of room (real-time conflict detection)
- [ ] **BOOK-10**: System displays conflict error with clear messaging

### Resources Management

- [ ] **RES-01**: User can create therapist with name and contact details
- [ ] **RES-02**: User can edit therapist details
- [ ] **RES-03**: User can deactivate therapist (soft delete, preserves historical bookings)
- [ ] **RES-04**: User can create room with name and capacity
- [ ] **RES-05**: User can edit room details
- [ ] **RES-06**: User can deactivate room (soft delete, preserves historical bookings)
- [ ] **RES-07**: User can create treatment with name, duration, price, and description
- [ ] **RES-08**: User can edit treatment details
- [ ] **RES-09**: User can deactivate treatment (soft delete, preserves historical bookings)
- [ ] **RES-10**: User can view list of active therapists
- [ ] **RES-11**: User can view list of active rooms
- [ ] **RES-12**: User can view list of active treatments

### Inventory Management

- [ ] **INV-01**: User can create product with name, quantity, unit, and reorder level
- [ ] **INV-02**: User can edit product details
- [ ] **INV-03**: User can view current inventory levels for all products
- [ ] **INV-04**: User can record product usage when creating/editing booking
- [ ] **INV-05**: System automatically deducts used products from inventory when booking is created
- [ ] **INV-06**: System automatically returns products to inventory when booking is deleted
- [ ] **INV-07**: System displays low stock alert when product falls below reorder level
- [ ] **INV-08**: User can view inventory usage history per booking

### Data & Filtering

- [ ] **DATA-01**: User can filter bookings by therapist
- [ ] **DATA-02**: User can filter bookings by room
- [ ] **DATA-03**: User can filter bookings by treatment type
- [ ] **DATA-04**: User can filter bookings by date range
- [ ] **DATA-05**: User can search bookings by guest name
- [ ] **DATA-06**: User can search bookings by guest phone or email

### Frontend Infrastructure

- [ ] **UI-01**: Application uses Tailwind CSS for all styling
- [ ] **UI-02**: Calendar interface uses FullCalendar library with React integration
- [ ] **UI-03**: Application is responsive and mobile-friendly
- [ ] **UI-04**: API provides structured JSON responses for all endpoints
- [ ] **UI-05**: Frontend handles API errors with clear user messaging

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **AUTH-05**: Role-based access control (admin vs staff permissions)
- **AUTH-06**: Staff user accounts with restricted permissions
- **NOTIF-01**: Email confirmations sent to guests after booking creation
- **NOTIF-02**: Email reminders sent to guests before appointments
- **NOTIF-03**: SMS notifications for appointments
- **PAY-01**: Payment processing integration (Stripe/PayPal)
- **REPORT-01**: Business analytics and reporting dashboard
- **REPORT-02**: Revenue reports by date range, therapist, treatment
- **CRM-01**: Customer loyalty tracking and history
- **CRM-02**: Dedicated customers table for repeat customer management
- **MOBILE-01**: Native mobile app (iOS/Android)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Customer self-service portal | Staff-managed bookings only for v1; defer to v2 |
| Advanced reporting | Basic data access sufficient for launch; analytics later |
| Marketing features | Focus on core operations; marketing tools deferred |
| Multi-location support | Single spa for v1; expansion later |
| Online booking for customers | Staff-administered system for v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| BOOK-01 | Phase 2 | Pending |
| BOOK-02 | Phase 2 | Pending |
| BOOK-03 | Phase 2 | Pending |
| BOOK-04 | Phase 2 | Pending |
| BOOK-05 | Phase 2 | Pending |
| BOOK-06 | Phase 2 | Pending |
| BOOK-07 | Phase 2 | Pending |
| BOOK-08 | Phase 2 | Pending |
| BOOK-09 | Phase 2 | Pending |
| BOOK-10 | Phase 2 | Pending |
| RES-01 | Phase 3 | Pending |
| RES-02 | Phase 3 | Pending |
| RES-03 | Phase 3 | Pending |
| RES-04 | Phase 3 | Pending |
| RES-05 | Phase 3 | Pending |
| RES-06 | Phase 3 | Pending |
| RES-07 | Phase 3 | Pending |
| RES-08 | Phase 3 | Pending |
| RES-09 | Phase 3 | Pending |
| RES-10 | Phase 3 | Pending |
| RES-11 | Phase 3 | Pending |
| RES-12 | Phase 3 | Pending |
| INV-01 | Phase 4 | Pending |
| INV-02 | Phase 4 | Pending |
| INV-03 | Phase 4 | Pending |
| INV-04 | Phase 4 | Pending |
| INV-05 | Phase 4 | Pending |
| INV-06 | Phase 4 | Pending |
| INV-07 | Phase 4 | Pending |
| INV-08 | Phase 4 | Pending |
| DATA-01 | Phase 5 | Pending |
| DATA-02 | Phase 5 | Pending |
| DATA-03 | Phase 5 | Pending |
| DATA-04 | Phase 5 | Pending |
| DATA-05 | Phase 5 | Pending |
| DATA-06 | Phase 5 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |
| UI-04 | Phase 2 | Pending |
| UI-05 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap creation*
