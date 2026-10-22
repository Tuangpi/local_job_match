# Implementation Plan for a Coding Agent

## 1. Engineering objective

Build a responsive, Myanmar-first local services marketplace where
customers browse experts or post jobs, experts submit quotations,
customers select an offer, and both parties track work through
completion and review.

Implement in small, testable phases. Do not build future payment or AI
features before the core workflow works end-to-end.

## 2. Recommended milestones

### Phase 0 --- Validate requirements

-   Interview 10--15 potential customers and 10--15 experts.
-   Choose one launch city, a few townships, and three to five
    categories.
-   Recruit initial experts.
-   Decide verification, cancellation, and complaint processes.
-   Confirm the preferred OTP and hosting providers.

**Exit criteria:** launch area and initial supply are defined;
assumptions are recorded.

### Phase 1 --- Project foundation

-   Create application and repository structure.
-   Configure TypeScript, linting, formatting, test runner, CI, and
    environment variables.
-   Set up PostgreSQL and migrations.
-   Implement authentication/session handling and account statuses.
-   Seed categories, cities, and townships.
-   Create shared UI patterns and Burmese/English localization.

**Exit criteria:** users can sign in, update profile basics, and the app
runs in development and staging.

### Phase 2 --- Expert profiles and discovery

-   Implement expert profiles, skills, service areas, and portfolio
    references.
-   Build category/township search with pagination.
-   Implement public profile pages and verification labels.
-   Build admin verification queue.

**Exit criteria:** customer can search and view eligible experts;
private verification documents are inaccessible publicly.

### Phase 3 --- Jobs and quotations

-   Implement job creation, editing, and photo upload.
-   Implement invitations and quotation submission.
-   Add customer quotation comparison.
-   Implement quotation acceptance with transaction and concurrency
    protection.
-   Create booking and status history.
-   Add notifications or a simple notification record.

**Exit criteria:** a customer can complete the full flow from job
request to accepted quotation and booking.

### Phase 4 --- Completion, reviews, and operations

-   Implement valid job status transitions.
-   Add review eligibility checks.
-   Add complaint/report workflow.
-   Implement admin moderation and audit logs.
-   Add basic operational analytics.

**Exit criteria:** completed jobs can be reviewed; invalid transitions
and unauthorized operations are rejected.

### Phase 5 --- Pilot readiness

-   Add end-to-end tests for main customer/expert workflows.
-   Test mobile and lower-bandwidth usage.
-   Test concurrency, upload restrictions, and authorization.
-   Configure backups, monitoring, and recovery.
-   Review policies and legal requirements.
-   Onboard initial users and run a controlled pilot.

**Exit criteria:** launch checklist completed and support process
staffed.

### Phase 6 --- Evidence-led iteration

-   Add project milestones if pilot users need them.
-   Test one monetization model at a time.
-   Add messaging integrations only after checking access and
    permissions.
-   Add geospatial matching only if township filtering is insufficient.
-   Consider payment integration after legal, provider, and operational
    review.

## 3. Suggested delivery estimate

For one developer working consistently, a pilot may take approximately
6--10 weeks. This is an estimate, not a guarantee. External OTP setup,
expert verification operations, payment work, and unexpected
requirements can increase the timeline.

## 4. Coding agent instructions

1.  Read all files in this documentation set before implementation.
2.  Identify ambiguities and list assumptions; do not silently invent
    business policies.
3.  Build one vertical slice at a time, with migrations, API validation,
    UI, tests, and documentation.
4.  Keep route handlers thin and place business rules in services/use
    cases.
5.  Enforce authorization server-side on every private resource.
6.  Use transactions for quotation acceptance and booking creation.
7.  Do not implement payments, escrow, or automated commission
    collection in the MVP.
8.  Do not claim expert credentials are verified unless the admin
    workflow recorded verification.
9.  Use fake seed data only in development; never seed production with
    fabricated reviews.
10. Do not commit secrets. Provide `.env.example` with blank values.
11. Add unit tests for business rules, integration tests for database
    workflows, and end-to-end tests for critical journeys.
12. At the end of each phase, report changed files, migrations, tests
    run, known issues, and next steps.
13. Do not skip failing tests or weaken security checks merely to
    complete a phase.
14. Keep the app usable on mobile and support Burmese and English text.
15. Update the docs when a product or schema decision changes.

## 5. Required test scenarios

### Authentication

-   Invalid OTP is rejected.
-   OTP request limits are enforced.
-   Suspended users cannot perform protected actions.

### Expert discovery

-   Search filters by category and township.
-   Suspended or hidden experts do not appear.
-   Private documents and customer details are never returned in public
    results.

### Job requests

-   Missing required fields are rejected.
-   Customer cannot edit another customer's job.
-   Uploads are limited by type, size, and ownership.

### Quotations and bookings

-   Expert cannot quote a closed job.
-   Customer cannot accept a quotation for another user's job.
-   Expired quotation cannot be accepted.
-   Two concurrent acceptance requests result in at most one booking.
-   Quotation must belong to the booking's job.
-   Price values are validated server-side.

### Reviews and admin

-   Review is blocked before completion.
-   Duplicate review is rejected.
-   Non-admin cannot use admin endpoints.
-   Verification and suspension decisions create audit records.

## 6. Definition of done

A feature is done when: - Acceptance criteria are met. - Input
validation and authorization are implemented. - Relevant tests pass. -
Loading, empty, success, and error states are implemented. -
Burmese/English UI strings are covered where applicable. - Logs do not
leak sensitive information. - Database migrations and documentation are
updated. - The change has been tested on a mobile viewport.
