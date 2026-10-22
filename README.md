# Local Job Match

**Product and engineering documentation --- MVP v1.0**

Local Job Match is a Myanmar-first, two-sided marketplace connecting
people who need repairs, maintenance, installations, or larger projects
with independent local experts and service businesses.

## Product decisions

-   **Launch market:** Myanmar.
-   **Initial launch:** One city and a limited number of townships,
    selected after local validation.
-   **Job types:** One-day jobs, installations, and larger projects.
-   **Matching:** Customers browse and choose experts; customers may
    also post requests and compare quotations.
-   **Revenue:** Undecided. Begin with free access during the pilot and
    test monetization after validating completed jobs.
-   **Languages:** Burmese and English.
-   **Payment:** Customer and expert agree on direct payment during the
    pilot. Do not imply platform escrow or automated wallet collection.
-   **Architecture:** Modular monolith, responsive web app/PWA,
    PostgreSQL.

## Documentation index

-   [Product requirements](docs/PRD.md)
-   [Architecture and project structure](docs/ARCHITECTURE.md)
-   [Database schema](docs/DATABASE.md)
-   [REST API specification](docs/API.md)
-   [Security and operations](docs/SECURITY.md)
-   [Phased implementation plan](docs/IMPLEMENTATION_PLAN.md)

## MVP north star

Help customers find a suitable expert, agree on a quotation, complete
the work, and leave a trustworthy review---while helping experts receive
relevant local job opportunities.

## MVP boundaries

### Included

-   Phone-based authentication and account management.
-   Customer and expert profiles.
-   Service categories, cities, and townships.
-   Expert search by skill and service area.
-   Job requests with descriptions, dates, budget ranges, and photos.
-   Expert invitations and quotations.
-   Customer-led quotation acceptance and booking.
-   Job status tracking and reviews.
-   Admin tools for verification, moderation, and complaints.
-   Basic in-app notifications and audit records.

### Deferred

-   Native iOS/Android apps.
-   Automated wallet payments, payouts, and escrow.
-   Real-time GPS tracking.
-   AI matching.
-   Complex bidding/auction mechanics.
-   Multi-company workforce scheduling.
-   Automated dispute adjudication.

## Important product principles

1.  **Trust before scale:** verify expert identity and, where relevant,
    trade qualifications.
2.  **Location-first launch:** concentrate supply and demand in a small
    geographic area.
3.  **Human-assisted operations:** admins may manually help customers
    find experts during the pilot.
4.  **Privacy by default:** public profiles must not expose private
    addresses, identity documents, or full customer job details.
5.  **Server-side enforcement:** authorization and business invariants
    must not depend on frontend checks.
6.  **Measure completed value:** registrations are not success if
    requests do not become completed jobs.

## Working assumptions

-   MMK is the default currency; persist a currency code with monetary
    values.
-   A user account may act as both customer and expert.
-   Customers may compare multiple quotations, but only one quotation
    may be accepted for a job.
-   Large projects reuse the job/quotation/booking foundation and add
    milestones in a later phase.
-   Operational policies and Myanmar legal/payment requirements must be
    reviewed before public launch.
