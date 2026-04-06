# Roadmap: Spa Inventory & Booking System

**Created:** 2026-04-03
**Granularity:** Coarse
**Timeline:** 4-8 weeks to launch

## Phases

- [ ] **Phase 1: Authentication & Foundation** - Secure admin access and project scaffolding
- [ ] **Phase 2: Calendar & Booking Core** - Visual booking management with conflict prevention
- [ ] **Phase 3: Resource Management** - Therapists, rooms, and treatments administration
- [ ] **Phase 4: Inventory System** - Product tracking and automatic consumption
- [ ] **Phase 5: Data Access & Filtering** - Enhanced search and filtering capabilities

## Phase Details

### Phase 1: Authentication & Foundation

**Goal:** Admin users can securely access the system through authenticated sessions

**Depends on:** Nothing (foundation phase)

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Success Criteria** (what must be TRUE):
1. Admin can register account with email/password and receive confirmation
2. Admin can log in and receive session token that persists across browser refresh
3. Admin can log out from any page and session is terminated
4. Unauthenticated users cannot access protected routes (API returns 401)

**Plans:** TBD

### Phase 2: Calendar & Booking Core

**Goal:** Staff can visually manage bookings through drag-and-drop calendar interface with automatic conflict prevention

**Depends on:** Phase 1

**Requirements:** BOOK-01, BOOK-02, BOOK-03, BOOK-04, BOOK-05, BOOK-06, BOOK-07, BOOK-08, BOOK-09, BOOK-10, UI-01, UI-02, UI-03, UI-04, UI-05

**Success Criteria** (what must be TRUE):
1. User can view daily and weekly calendar with existing bookings displayed
2. User can create booking by clicking/dragging on calendar and filling in guest details, treatment, therapist, and room
3. User can move booking via drag-and-drop and system prevents conflicts (therapist or room already booked)
4. User can edit booking details including guest name, phone, email, treatment, therapist, room, and time
5. User can delete booking from calendar and system confirms deletion
6. System displays clear error messages when conflicts are detected (double-booking prevention)
7. Calendar interface is responsive and works on mobile devices
8. API returns structured JSON responses with proper error handling

**Plans:** TBD

**UI hint**: yes

### Phase 3: Resource Management

**Goal:** Staff can manage therapists, treatment rooms, and treatments through admin interface

**Depends on:** Phase 1

**Requirements:** RES-01, RES-02, RES-03, RES-04, RES-05, RES-06, RES-07, RES-08, RES-09, RES-10, RES-11, RES-12

**Success Criteria** (what must be TRUE):
1. User can create therapist with name and contact details
2. User can edit therapist details and deactivate therapist (preserves historical bookings)
3. User can create room with name and capacity
4. User can edit room details and deactivate room (preserves historical bookings)
5. User can create treatment with name, duration, price, and description
6. User can edit treatment details and deactivate treatment (preserves historical bookings)
7. User can view lists of active therapists, rooms, and treatments

**Plans:** TBD

**UI hint**: yes

### Phase 4: Inventory System

**Goal:** Staff can track product stock levels and system automatically deducts/returns inventory based on booking changes

**Depends on:** Phase 2 (bookings must exist to consume inventory)

**Requirements:** INV-01, INV-02, INV-03, INV-04, INV-05, INV-06, INV-07, INV-08

**Success Criteria** (what must be TRUE):
1. User can create product with name, quantity, unit, and reorder level
2. User can edit product details and view current inventory levels for all products
3. User can record product usage when creating or editing booking (select products and quantities)
4. System automatically deducts used products from inventory when booking is created
5. System automatically returns products to inventory when booking is deleted
6. System displays low stock alert when product falls below reorder level
7. User can view inventory usage history per booking

**Plans:** TBD

**UI hint**: yes

### Phase 5: Data Access & Filtering

**Goal:** Staff can quickly find specific bookings through filtering and search capabilities

**Depends on:** Phase 2 (bookings must exist to filter)

**Requirements:** DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06

**Success Criteria** (what must be TRUE):
1. User can filter bookings by therapist to see specific therapist's schedule
2. User can filter bookings by room to see room utilization
3. User can filter bookings by treatment type to see service demand
4. User can filter bookings by date range to view specific periods
5. User can search bookings by guest name to find specific customer
6. User can search bookings by guest phone or email to locate bookings

**Plans:** TBD

**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Authentication & Foundation | 0/1 | Not started | - |
| 2. Calendar & Booking Core | 0/1 | Not started | - |
| 3. Resource Management | 0/1 | Not started | - |
| 4. Inventory System | 0/1 | Not started | - |
| 5. Data Access & Filtering | 0/1 | Not started | - |

## Dependencies

```
Phase 1 (Auth)
    ↓
Phase 2 (Calendar) ←───┐
    ↓                   │
Phase 3 (Resources)    │
    ↓                   │
Phase 4 (Inventory) ───┘
    ↓
Phase 5 (Filtering)
```

**Notes:**
- Phase 3 (Resources) can proceed in parallel with Phase 2 once auth is complete
- Phase 4 (Inventory) requires Phase 2 (bookings) to exist
- Phase 5 (Filtering) requires Phase 2 (bookings) to exist

## Coverage

**Total v1 requirements:** 42
**Mapped to phases:** 42
**Unmapped:** 0 ✓

**Requirement distribution:**
- Phase 1: 4 requirements (Authentication)
- Phase 2: 15 requirements (Bookings + UI infrastructure)
- Phase 3: 12 requirements (Resource management)
- Phase 4: 8 requirements (Inventory)
- Phase 5: 6 requirements (Filtering & search)

---
*Roadmap created: 2026-04-03*
