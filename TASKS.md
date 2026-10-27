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
- [ ] Seed categories, cities, and townships
  - [ ] Define initial service categories
  - [ ] Define city/township taxonomy for Myanmar
- [ ] Create shared UI patterns and Burmese/English localization
  - [ ] Set up i18n routing
  - [ ] Create base language files (my, en)

**Exit criteria**: Users can sign in, update profile basics, and the app runs in development and staging.

## Phase 2 - Expert Profiles and Discovery
- [ ] Implement expert profiles, skills, service areas, and portfolio references
  - [ ] Expert profile creation/edition API
  - [ ] Skills management (PUT /experts/me/skills)
  - [ ] Service areas management (PUT /experts/me/areas)
  - [ ] Portfolio item references
- [ ] Build category/township search with pagination
  - [ ] GET /categories endpoint
  - [ ] GET /locations/townships endpoint
  - [ ] Expert search with filters (GET /experts)
- [ ] Implement public profile pages and verification labels
  - [ ] GET /experts/{expertId} public profile
  - [ ] Verification status display
- [ ] Build admin verification queue
  - [ ] Admin view pending verification experts
  - [ ] Admin verification decision endpoint

**Exit criteria**: Customer can search and view eligible experts; private verification documents are inaccessible publicly.

## Phase 3 - Jobs and Quotations
- [ ] Implement job creation, editing, and photo upload
  - [ ] POST /jobs job creation with validation
  - [ ] PATCH /jobs/{jobId} job editing (eligible users only)
  - [ ] Photo upload with type/size limits
- [ ] Implement invitations and quotation submission
  - [ ] POST /jobs/{jobId}/invitations expert invitation
  - [ ] PUT /experts/me/quotations quotation submission
- [ ] Add customer quotation comparison
  - [ ] GET /jobs/{jobId} view with quotations
  - [ ] UI for comparing scope, cost, duration, profiles
- [ ] Implement quotation acceptance with transaction and concurrency protection
  - [ ] PATCH /quotations/{quotationId}/accept transactional acceptance
  - [ ] Concurrency protection (at most one booking)
  - [ ] Create booking with validated agreed amount and currency
- [ ] Create booking and status history
  - [ ] POST /bookings or internal booking creation
  - [ ] job_status_history audit trail

**Exit criteria**: A customer can complete the full flow from job request to accepted quotation and booking.

## Phase 4 - Completion, Reviews, and Operations
- [ ] Implement valid job status transitions
  - [ ] Status enum definition and permitted transitions
- [ ] Add review eligibility checks
  - [ ] Only booking's customer can review
  - [ ] Duplicate review prevention
- [ ] Add complaint/report workflow
  - [ ] POST /reports complaint submission
  - [ ] GET /admin/reports list
  - [ ] POST /admin/reports/{reportId}/resolve resolution
- [ ] Implement admin moderation and audit logs
  - [ ] Admin endpoints for users, experts, categories
  - [ ] GET /admin/audit-logs audit event review
- [ ] Add basic operational analytics
  - [ ] Key metrics tracking

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
- Current sprint: Phase 1 - Project Foundation
- Next target: Phase 2 - Expert Profiles and Discovery