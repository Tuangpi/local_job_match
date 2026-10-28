# Local Job Match - Task Tracker

## Legend
- **P0**: Required for pilot | **P1**: Next iteration | **P2**: Later
- ✅ Complete | 🔄 In Progress | ⏳ Not Started | ❌ Blocked

## Phase 0 - Validate Requirements (Already Completed)
- [x] Define launch city and townships
- [x] Choose 3-5 initial service categories
- [x] Recruit initial experts
- [x] Decide verification, cancellation, and complaint processes
- [x] Confirm OTP and hosting providers

## Phase 1 - Project Foundation
- [x] Create application and repository structure
  - [x] Initialize TypeScript config, linting, formatting
  - [x] Set up test runner, CI
  - [x] Configure environment variables (.env.example)
- [x] Set up PostgreSQL and Prisma migrations
  - [x] Initialize Prisma schema
  - [x] Create initial migration setup
- [x] Implement authentication/session handling and account statuses
  - [x] Phone OTP request endpoint
  - [x] OTP verification endpoint
  - [x] Session management
  - [x] User role (customer/expert/admin)
- [x] Seed categories, cities, and townships
  - [x] Define initial service categories
  - [x] Define city/township taxonomy for Myanmar
- [x] Create shared UI patterns and Burmese/English localization
  - [x] Set up i18n routing
  - [x] Create base language files (my, en)

**Exit criteria**: Users can sign in, update profile basics, and the app runs in development and staging.

## Phase 2 - Expert Profiles and Discovery
- [x] Implement expert profiles, skills, service areas, and portfolio references
  - [x] Expert profile creation/edition API
  - [x] Skills management (PUT /experts/me/skills)
  - [x] Service areas management (PUT /experts/me/areas)
  - [x] Portfolio item references
- [x] Build category/township search with pagination
  - [x] GET /categories endpoint
  - [x] GET /locations/townships endpoint
  - [x] Expert search with filters (GET /experts)
- [x] Implement public profile pages and verification labels
  - [x] GET /experts/{expertId} public profile
  - [x] Verification status display (verificationStatus returned in public profile)
- [x] Build admin verification queue
  - [x] Admin view pending verification experts
  - [x] Admin verification decision endpoint

**Exit criteria**: Customer can search and view eligible experts; private verification documents are inaccessible publicly.

## Phase 3 - Jobs and Quotations
- [x] Implement job creation, editing, and photo upload
  - [x] POST /jobs job creation with validation
  - [x] PATCH /jobs/{jobId} job editing (eligible users only)
  - [x] Photo upload with type/size limits
- [x] Implement invitations and quotation submission
  - [x] POST /jobs/{jobId}/invitations expert invitation
  - [x] PUT /experts/me/quotations quotation submission
- [x] Add customer quotation comparison
  - [x] GET /jobs/{jobId} view with quotations
  - [ ] UI for comparing scope, cost, duration, profiles
- [x] Implement quotation acceptance with transaction and concurrency protection
  - [x] PATCH /quotations/{quotationId}/accept transactional acceptance
  - [x] Concurrency protection (at most one booking)
  - [x] Create booking with validated agreed amount and currency
- [x] Create booking and status history
  - [x] POST /bookings or internal booking creation
  - [x] job_status_history audit trail

**Exit criteria**: A customer can complete the full flow from job request to accepted quotation and booking.

## Phase 4 - Completion, Reviews, and Operations
- [x] Implement valid job status transitions
  - [x] Status enum definition and permitted transitions
- [x] Add review eligibility checks
  - [x] Only booking's customer can review
  - [x] Duplicate review prevention
- [x] Add complaint/report workflow
  - [x] POST /reports complaint submission
  - [x] GET /admin/reports list
  - [x] POST /admin/reports/{reportId}/resolve resolution
- [x] Implement admin moderation and audit logs
  - [x] Admin endpoints for users, experts, categories
  - [x] GET /admin/audit-logs audit event review
- [x] Add basic operational analytics
  - [x] Key metrics tracking

**Exit criteria**: Completed jobs can be reviewed; invalid transitions and unauthorized operations are rejected.

## Phase 5 - Pilot Readiness
- [ ] Add end-to-end tests for main customer/expert workflows
  - [ ] Critical journey tests (browse→quote→book→review)
- [ ] Test mobile and lower-bandwidth usage
- [ ] Test concurrency, upload restrictions, and authorization
- [ ] Configure backups, monitoring, and recovery
- [ ] Review policies and legal requirements
- [ ] Onboard initial users and run a controlled pilot

**Exit criteria**: Launch checklist completed and support process staffed.

## Phase 6 - Evidence-Led Iteration
- [ ] Add project milestones if pilot users need them
- [ ] Test one monetization model at a time
  - [ ] Commission on completed jobs
  - [ ] Paid qualified leads
  - [ ] Expert subscriptions
- [ ] Add messaging integrations only after checking access and permissions
- [ ] Add geospatial matching if township filtering is insufficient
- [ ] Consider payment integration after legal, provider, and operational review

## Dependencies Between Phases
- Phase 1 foundation MUST be complete before Phase 2 can start
- Phase 2 discovery MUST be complete before Phase 3 jobs/quotations
- Phase 3 full flow MUST be complete before Phase 4 completion/reviews
- Phase 4 operations MUST be complete before Phase 5 pilot readiness
- Phase 5 pilot MUST run before Phase 6 iteration

## Current Focus
- Current sprint: Phase 4 - Completion, Reviews, and Operations (complete)
- Next target: Phase 5 - Pilot readiness