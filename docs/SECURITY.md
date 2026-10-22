# Security, Privacy, and Operations

## 1. Security objectives

Protect customer and expert accounts, prevent unauthorized job access,
safeguard identity documents and property photos, and maintain
trustworthy records of quotations and completed jobs.

## 2. Authentication and sessions

-   Verify phone numbers using a supported OTP provider.
-   Rate-limit OTP request and verification endpoints by phone, IP, and
    other suitable signals.
-   Do not reveal whether an arbitrary phone number already has an
    account.
-   Store session identifiers securely; use HTTP-only, Secure, SameSite
    cookies where applicable.
-   Rotate/revoke sessions after sensitive account changes and on
    logout.
-   Never log OTP codes, session secrets, or authentication tokens.

## 3. Authorization

Use server-side role and resource ownership checks: - Customers can
manage their own profile and job requests. - Experts can manage their
own profile, skills, service areas, and quotations. - Only participants
can view private booking details. - Only the customer who owns a job can
accept an offer. - Only eligible customers can review a completed
booking. - Admin access is restricted, logged, and reviewed.

Avoid trusting IDs supplied by the browser. Resolve the current user
from the authenticated session.

## 4. Personal data and location

-   Public expert profiles should show service area, not private home
    address.
-   Do not publish customer street address or contact details to all
    experts.
-   Share exact visit details only with authorized participants when
    needed.
-   Store identity and qualification documents in private storage.
-   Use signed, short-lived access URLs where private file viewing is
    required.
-   Define retention, deletion, export, and access policies before
    launch.
-   Collect only data necessary to operate the service.

## 5. File uploads

-   Allow only required image formats and enforce size limits.
-   Verify actual file content rather than trusting filename or browser
    MIME type.
-   Use randomized object keys.
-   Prevent public listing of private uploads.
-   Consider malware scanning and image metadata stripping.
-   Avoid embedding private storage credentials in the frontend.
-   Restrict upload authorization to the relevant user and job/profile.

## 6. Business integrity

-   Perform quotation acceptance and booking creation in one
    transaction.
-   Protect against concurrent acceptance.
-   Validate all price calculations on the server.
-   Enforce one review per booking.
-   Preserve status history and administrative audit events.
-   Do not allow an expert to mark a job completed without the required
    workflow.
-   Apply explicit cancellation, refund, and dispute policies.
-   Make paid promotion transparent and do not let it misrepresent
    verification or quality.

## 7. Abuse prevention and trust

-   Require phone verification for accounts.
-   Manually review expert identity and qualifications appropriate to
    the trade.
-   Clearly label unverified credentials.
-   Provide report/block functionality.
-   Rate-limit invitations and quotation submissions.
-   Moderate fraudulent profiles, spam, threats, and abusive reviews.
-   Establish a human process for disputes and safety complaints.
-   Create a safety escalation policy for hazardous or potentially
    criminal situations.

## 8. Payments and legal readiness

The initial MVP may let customers and experts settle directly. The
platform should still record the agreed quotation and booking status
without falsely representing payment as verified.

Before introducing KBZPay, WavePay, AYA Pay, card payments, escrow, or
automated commission collection: - Confirm current provider APIs,
merchant eligibility, fees, and settlement rules. - Determine how
refunds, failed payments, and disputes work. - Confirm applicable local
business, tax, privacy, consumer protection, and payment obligations. -
Do not store wallet PINs, OTPs, or payment credentials. - Use
provider-approved integrations rather than collecting sensitive payment
credentials directly.

This document is not legal advice; obtain appropriate local review
before launch.

## 9. Operational controls

-   Separate development, staging, and production.
-   Store secrets in environment/secret management, not source control.
-   Enable automated backups and periodically test restoration.
-   Monitor server errors, failed authentication, unusual request
    volume, and storage failures.
-   Use structured logs with request IDs; exclude sensitive payloads.
-   Maintain an incident response contact and basic recovery runbook.
-   Apply database migrations in a controlled release process.
-   Keep dependencies updated and run automated checks in CI.

## 10. Pre-launch security checklist

-   [ ] Authentication and authorization tests pass.
-   [ ] Cross-user resource access tests pass.
-   [ ] Concurrent quotation acceptance test passes.
-   [ ] OTP abuse controls are enabled.
-   [ ] File upload validation and private storage are tested.
-   [ ] Admin actions are audited.
-   [ ] Database backup and restore are tested.
-   [ ] Privacy policy and terms are reviewed.
-   [ ] Cancellation and dispute procedures are documented.
-   [ ] Expert verification rules are documented.
-   [ ] Error monitoring and incident contacts are configured.
