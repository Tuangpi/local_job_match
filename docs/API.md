# REST API Specification

Base path: `/api/v1`\
Content type: `application/json` unless uploading through a signed
storage URL.

## 1. Conventions

-   Use authenticated sessions or another secure token/session strategy.
-   All private routes must authorize the current user against the
    resource.
-   Validate request bodies and query parameters server-side.
-   Use pagination, for example `?cursor=...&limit=20`, with a maximum
    limit.
-   Return stable machine-readable error codes.
-   Use idempotency keys for operations where retries could create
    duplicate effects.
-   Never accept `userId`, `customerId`, or `expertId` from the client
    as proof of identity; derive the acting user from the session.
-   Store and return ISO 8601 timestamps with timezone.
-   Use integer monetary amounts and explicit currency codes.

## 2. Authentication

  Method   Endpoint              Purpose
  -------- --------------------- ----------------------------------------
  POST     `/auth/otp/request`   Request phone OTP
  POST     `/auth/otp/verify`    Verify OTP and establish session
  POST     `/auth/logout`        End current session
  GET      `/users/me`           Get current user
  PATCH    `/users/me`           Update profile and language preference

OTP provider choice, delivery availability, and cost must be confirmed
before implementation. Apply rate limits to requests and verification
attempts.

## 3. Catalog and discovery

  Method   Endpoint                                   Purpose
  -------- ------------------------------------------ --------------------------------
  GET      `/categories`                              List active categories
  GET      `/locations/cities`                        List supported cities
  GET      `/locations/townships?cityId=...`          List townships
  GET      `/experts?categoryId=...&townshipId=...`   Search experts
  GET      `/experts/{expertId}`                      Public expert profile
  POST     `/experts/me/profile`                      Create expert profile
  PATCH    `/experts/me/profile`                      Update expert profile
  PUT      `/experts/me/skills`                       Replace expert skills
  PUT      `/experts/me/areas`                        Replace service areas
  POST     `/experts/me/verification`                 Submit verification for review

Expert search returns only active, visible profiles matching the
requested category and service area. Pagination and sort options must be
validated against an allowlist.

## 4. Jobs and invitations

  -----------------------------------------------------------------------------
  Method                  Endpoint                      Purpose
  ----------------------- ----------------------------- -----------------------
  POST                    `/jobs`                       Create job request

  GET                     `/jobs/mine`                  List jobs relevant to
                                                        current user

  GET                     `/jobs/{jobId}`               View authorized job

  PATCH                   `/jobs/{jobId}`               Edit an eligible open
                                                        job

  POST                    `/jobs/{jobId}/publish`       Publish a draft job if
                                                        drafts are used

  POST                    `/jobs/{jobId}/invitations`   Invite expert(s) to
                                                        quote

  GET                     `/jobs/{jobId}/invitations`   List invitations for
                                                        authorized participants
  -----------------------------------------------------------------------------

### Example create-job request

``` json
{
  "categoryId": "uuid",
  "townshipId": "uuid",
  "jobType": "one_day",
  "title": "Repair leaking kitchen pipe",
  "description": "Water is leaking beneath the kitchen sink.",
  "budgetMin": 20000,
  "budgetMax": 60000,
  "currency": "MMK",
  "preferredDate": "2026-10-24"
}
```

The identifiers and values above are illustrative. Validate that
category and township exist and are active.

## 5. Quotations and bookings

  --------------------------------------------------------------------------------------
  Method                  Endpoint                               Purpose
  ----------------------- -------------------------------------- -----------------------
  POST                    `/jobs/{jobId}/quotations`             Submit a quotation

  GET                     `/jobs/{jobId}/quotations`             List quotations for job
                                                                 owner/authorized
                                                                 experts

  GET                     `/quotations/{quotationId}`            View authorized
                                                                 quotation

  PATCH                   `/quotations/{quotationId}`            Update an eligible
                                                                 pending quotation

  POST                    `/quotations/{quotationId}/accept`     Accept quotation and
                                                                 create booking

  POST                    `/quotations/{quotationId}/reject`     Reject quotation

  POST                    `/quotations/{quotationId}/withdraw`   Withdraw own pending
                                                                 quotation

  GET                     `/bookings/{bookingId}`                View booking

  POST                    `/bookings/{bookingId}/status`         Request permitted
                                                                 status transition

  POST                    `/bookings/{bookingId}/cancel`         Request cancellation
                                                                 under policy

  POST                    `/bookings/{bookingId}/reviews`        Submit eligible review

  POST                    `/bookings/{bookingId}/reports`        Report issue
  --------------------------------------------------------------------------------------

### Example quotation

``` json
{
  "laborAmount": 30000,
  "materialsAmount": 15000,
  "currency": "MMK",
  "scope": "Replace damaged pipe section and test for leaks.",
  "estimatedDays": 1,
  "validUntil": "2026-10-24T12:00:00+06:30"
}
```

### Accept quotation transaction

1.  Authenticate the customer.
2.  Lock or conditionally update the job row.
3.  Verify the customer owns the job.
4.  Verify the job is open and has no booking.
5.  Verify quotation belongs to that job and is pending/not expired.
6.  Create booking with validated agreed amount and currency.
7.  Mark selected quotation accepted and other eligible offers
    rejected/closed as policy dictates.
8.  Change job status.
9.  Insert status history and notification records.
10. Commit transaction; on any failure, roll back all changes.

Use an idempotency key or conditional unique constraints to handle
retries safely.

## 6. Reviews, reports, and administration

  ---------------------------------------------------------------------------------------------------
  Method                  Endpoint                                            Purpose
  ----------------------- --------------------------------------------------- -----------------------
  GET                     `/experts/{expertId}/reviews`                       Public review list

  GET                     `/admin/experts/pending-verification`               Review queue

  POST                    `/admin/experts/{expertId}/verification-decision`   Approve/reject
                                                                              verification

  PATCH                   `/admin/users/{userId}/status`                      Suspend/reactivate
                                                                              account

  CRUD                    `/admin/categories`                                 Manage categories

  CRUD                    `/admin/locations`                                  Manage supported areas

  GET                     `/admin/reports`                                    List reports

  POST                    `/admin/reports/{reportId}/resolve`                 Record resolution

  GET                     `/admin/audit-logs`                                 Review authorized audit
                                                                              events
  ---------------------------------------------------------------------------------------------------

Admin routes require server-side admin role checks. Do not expose
verification documents through the public profile API.

## 7. Response and error format

Success:

``` json
{
  "data": {
    "id": "uuid",
    "status": "open"
  }
}
```

Error:

``` json
{
  "error": {
    "code": "QUOTATION_EXPIRED",
    "message": "This quotation is no longer valid."
  }
}
```

Use appropriate HTTP status codes: `400` invalid input, `401`
unauthenticated, `403` unauthorized, `404` not found, `409` conflicting
state, `422` business validation failure, and `429` rate limited.

## 8. API acceptance checklist

-   Unauthorized users cannot read private job data.
-   Customer cannot accept a quotation for another customer's job.
-   Expert cannot quote on a closed job.
-   Concurrent quotation acceptance cannot create multiple bookings.
-   Repeated create requests with the same idempotency key do not
    duplicate records.
-   Pagination has stable ordering.
-   All filters are validated and parameterized.
-   Uploaded files are checked for ownership and type.
-   Error responses do not leak database internals or secrets.
