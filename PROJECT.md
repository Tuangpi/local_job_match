# Local Job Match - Project Overview

## Goal
Build a Myanmar-first, two-sided marketplace connecting people who need repairs, maintenance, installations, or larger projects with independent local experts and service businesses.

## Scope - MVP v1.0
### Included
- Phone-based authentication and account management
- Customer and expert profiles
- Service categories, cities, and townships
- Expert search by skill and service area
- Job requests with descriptions, dates, budget ranges, and photos
- Expert invitations and quotations
- Customer-led quotation acceptance and booking
- Job status tracking and reviews
- Admin tools for verification, moderation, and complaints
- Basic in-app notifications and audit records

### Deferred (Phase 2+)
- Native iOS/Android apps
- Automated wallet payments, payouts, and escrow
- Real-time GPS tracking
- AI matching
- Complex bidding/auction mechanics
- Multi-company workforce scheduling
- Automated dispute adjudication

## Product Decisions
- **Launch market**: Myanmar
- **Initial launch**: One city and a limited number of townships, selected after local validation
- **Job types**: One-day jobs, installations, and larger projects
- **Matching**: Customers browse and choose experts; customers may also post requests and compare quotations
- **Revenue**: Begin with free access during the pilot and test monetization after validating completed jobs
- **Languages**: Burmese and English
- **Payment**: Customer and expert agree on direct payment during the pilot. Do not imply platform escrow or automated wallet collection
- **Architecture**: Modular monolith, responsive web app/PWA, PostgreSQL

## Target Users
### Customers
- Households needing urgent or scheduled repairs
- Property owners and landlords
- Small shops and offices needing maintenance
- Customers planning solar, installation, or renovation projects

### Experts
- Independent technicians and tradespeople
- Specialist installation businesses
- Small contractor teams
- Multi-trade maintenance providers

### Administrators
- Operations staff who verify profiles, moderate content, resolve reports, manage categories, and assist matching

## Technology Stack
- **Frontend**: React + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Routing**: React Router
- **API state**: TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **API**: REST + JSON
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **File storage**: Local server filesystem
- **Authentication**: Phone OTP + secure sessions
- **Testing**: Vitest + Supertest + Playwright

## Key Principles
1. **Trust before scale**: Verify expert identity and, where relevant, trade qualifications
2. **Location-first launch**: Concentrate supply and demand in a small geographic area
3. **Human-assisted operations**: Admins may manually help customers find experts during the pilot
4. **Privacy by default**: Public profiles must not expose private addresses, identity documents, or full customer job details
5. **Server-side enforcement**: Authorization and business invariants must not depend on frontend checks
6. **Measure completed value**: Registrations are not success if requests do not become completed jobs

## Assumptions
- MMK is the default currency; persist a currency code with monetary values
- A user account may act as both customer and expert
- Customers may compare multiple quotations, but only one quotation may be accepted for a job
- Large projects reuse the job/quotation/booking foundation and add milestones in a later phase
- Operational policies and Myanmar legal/payment requirements must be reviewed before public launch