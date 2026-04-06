# Spa Inventory & Booking System

## What This Is

A comprehensive spa management system with API-first Laravel backend and React frontend. Enables spa staff to manage bookings through an intuitive calendar interface, track inventory consumption, and prevent scheduling conflicts. Designed for a new medium-scale spa (4-8 therapists, 4-6 rooms, 30-50 daily bookings).

## Core Value

**Operational efficiency through conflict prevention.** The system must ensure no double-bookings of therapists or rooms while providing staff with clear visibility into daily schedules and inventory levels.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **Calendar-based booking interface** - Daily and weekly views with drag-and-drop booking creation, editing, and moving
- [ ] **Booking management** - Full CRUD with guest details (name, phone, email), treatment assignment, therapist assignment, room assignment, start/end times
- [ ] **Conflict prevention** - Real-time availability checks that prevent double-booking therapists or rooms
- [ ] **Resource management** - Manage therapists and treatment rooms with availability status
- [ ] **Treatment catalog** - Define treatments with duration, price, and descriptions
- [ ] **Inventory tracking** - Track product stock levels and usage per treatment
- [ ] **Authentication & authorization** - Staff/admin access via Laravel Sanctum with role-based permissions
- [ ] **Responsive UI** - Mobile-friendly interface optimized for daily staff operations
- [ ] **Filtering & search** - Filter bookings by therapist, room, treatment type, and date ranges
- [ ] **JSON API** - Structured API-first backend responses for frontend consumption

### Out of Scope

- **Payment processing** — Deferred to v2; focus on booking operations for launch
- **Email/SMS notifications** — Deferred to v2; core system only for v1
- **Customer portal** — Deferred to v2; staff-managed bookings only for v1
- **Reporting & analytics** — Deferred to v2; basic data access sufficient for launch
- **Mobile app** — Deferred to v2; responsive web interface for v1
- **Customer loyalty/history tracking** — Client details stored in bookings for v1; dedicated customers table added later if needed

## Context

**Business situation:**
- New spa business launching in 4-8 weeks (urgent timeline)
- Starting fresh without legacy systems
- Medium-scale operation: 4-8 therapists, 4-6 rooms, 30-50 bookings per day
- Staff needs operational efficiency for daily booking management

**Technical environment:**
- Shared hosting for Laravel backend (cost-effective for new business)
- Vercel for React frontend (modern deployment, fast iteration)
- PostgreSQL database (complex queries for conflict detection, relational integrity)
- API-first architecture (JSON responses, clear separation of concerns)

**Key features:**
- FullCalendar integration for visual schedule management
- Drag-and-drop booking creation and modification
- Real-time validation via API
- Inventory consumption tracking per booking
- Conflict detection (no double-bookings)

## Constraints

- **Timeline**: 4-8 weeks to launch — Urgent, prioritize core functionality over extensibility
- **Budget**: Shared hosting + Vercel — Cost-effective deployment, no enterprise infrastructure
- **Tech stack**: Laravel + React + PostgreSQL — Must use these technologies
- **Authentication**: Laravel Sanctum — Token-based auth for API
- **Calendar**: FullCalendar library — Industry standard, supports drag-drop
- **Scale**: Medium (4-8 therapists, 4-6 rooms, 30-50 daily bookings) — Performance must handle concurrent bookings
- **Data integrity**: No double-bookings — Critical business requirement
- **Complexity**: Must be simple enough for rapid development — Avoid over-engineering for v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Client details in bookings table | Simpler, faster to build for 4-8 week timeline; can normalize later when loyalty features needed | — Pending |
| No dedicated customers table for v1 | Trade-off: can't track repeat customers initially, but reduces complexity and speeds launch | — Pending |
| PostgreSQL over MySQL | Better for complex conflict detection queries and relational data integrity | — Pending |
| Shared hosting + Vercel deployment | Cost-effective for new business, balances performance with budget | — Pending |
| API-first architecture | Clean separation, enables future mobile app, easier testing | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after initialization*
