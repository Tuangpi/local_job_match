# Product Requirements Document (PRD)

**Product:** Local Job Match\
**Version:** 1.0\
**Status:** Proposed MVP\
**Market:** Myanmar

## 1. Product vision

Make it easier for people and small businesses to find trustworthy local
experts for repairs, maintenance, installations, and projects. Help
experts discover paid work, present their experience, and build a
reputation.

## 2. Problem statement

Customers often rely on personal referrals, social media posts, and
informal messaging to find technicians. They may struggle to compare
availability, experience, prices, and reliability. Skilled workers may
depend on word of mouth and have difficulty finding a consistent stream
of customers.

Local Job Match organizes discovery, job requests, quotations, booking
records, and reviews in one place.

## 3. Target users

### Customers

-   Households needing urgent or scheduled repairs.
-   Property owners and landlords.
-   Small shops and offices needing maintenance.
-   Customers planning solar, installation, or renovation projects.

### Experts

-   Independent technicians and tradespeople.
-   Specialist installation businesses.
-   Small contractor teams.
-   Multi-trade maintenance providers.

### Administrators

-   Operations staff who verify profiles, moderate content, resolve
    reports, manage categories, and assist matching.

## 4. Initial service categories

Start with three to five categories based on local interviews and
available supply. Candidate categories: - Electrical repair and
installation. - Plumbing. - Solar installation and troubleshooting. -
Air-conditioning repair and installation. - Carpentry and general
maintenance. - Painting and renovation.

Do not list work an expert is not qualified or equipped to perform. Make
verification status and self-reported experience clearly
distinguishable.

## 5. Product strategy

The MVP supports two complementary paths:

1.  **Browse and choose:** customer searches experts by category and
    township, reviews profiles, then contacts an expert or requests a
    quotation.
2.  **Post a job:** customer describes a need and may invite suitable
    experts to submit quotations. The customer compares offers and
    chooses one.

Use simple matching rules initially: active account, selected skill,
service area, and profile visibility. Human-assisted matching is
acceptable during the pilot.

## 6. Goals and success metrics

### Product goals

-   Help customers find an appropriate expert.
-   Help experts receive relevant requests.
-   Improve trust through verification and completed-job reviews.
-   Learn which revenue model users will accept.

### Metrics

-   Number of active experts per township/category.
-   Number of valid job requests.
-   Share of requests receiving at least one quotation.
-   Median time to first response.
-   Quotation acceptance rate.
-   Job completion rate.
-   Repeat customer rate.
-   Expert retention.
-   Cancellation and complaint rates.
-   Revenue per completed job, once monetization is tested.

Set numeric targets after collecting pilot baseline data. A proposed
initial operating target might be that 70% of valid requests receive a
response within 24 hours; validate or revise it using actual data.

## 7. Functional requirements

Priority definitions: **P0** required for pilot, **P1** next iteration,
**P2** later.

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-01                   Register/login and      P0
                          verify phone number     

  FR-02                   Maintain customer       P0
                          profile                 

  FR-03                   Create and edit expert  P0
                          profile                 

  FR-04                   Add skills and service  P0
                          townships               

  FR-05                   Browse categories and   P0
                          search experts          

  FR-06                   Display profile, work   P0
                          samples, experience,    
                          and verification state  

  FR-07                   Create job request with P0
                          description, location,  
                          date, budget, and       
                          photos                  

  FR-08                   Invite experts to quote P0

  FR-09                   Submit, view, and       P0
                          compare quotations      

  FR-10                   Accept one quotation    P0
                          and create a booking    

  FR-11                   Track job status and    P0
                          record completion       

  FR-12                   Review an expert after  P0
                          eligible completed      
                          booking                 

  FR-13                   Administer accounts,    P0
                          categories,             
                          verification, reports,  
                          and complaints          

  FR-14                   In-app notifications    P1

  FR-15                   Project milestones and  P1
                          progress notes          

  FR-16                   Messaging inbox within  P1
                          the platform            

  FR-17                   Automated payments,     P2
                          payouts, and commission 
                          collection              

  FR-18                   Geospatial distance     P2
                          ranking and automated   
                          matching                
  -----------------------------------------------------------------------

## 8. User stories and acceptance criteria

### Customer discovery

-   As a customer, I can filter experts by skill and township.
-   Search results only include active, visible experts who offer the
    selected skill and serve the selected township.
-   Public profiles never expose identity documents or private customer
    job information.
-   Empty results offer a clear next step, such as widening the area or
    posting a job.

### Job request

-   As a customer, I can describe the issue and attach photos.
-   A job requires category, title, description, and township.
-   Budget and preferred date are optional unless a future product
    policy makes them mandatory.
-   The API validates file type, file size, ownership, and upload
    completion.
-   The customer can view and edit an open request they own.

### Quotations

-   An expert can submit a quotation only if allowed by
    category/invitation rules and the job remains open.
-   A quotation includes labor amount, materials amount, currency,
    scope, estimated duration, and optional expiry.
-   The customer can view quotations for their own job.
-   The customer can accept only one valid quotation.
-   Acceptance is atomic: concurrent requests must not create two
    bookings.
-   The selected quotation must belong to the same job and selected
    expert.

### Booking

-   The customer and selected expert can view the booking.
-   Only authorized participants can update permitted status
    transitions.
-   Every transition records actor, timestamp, and previous/new status.
-   A completed booking cannot be silently reopened; reopening requires
    a defined admin workflow.
-   A booking cannot be created for a cancelled job or invalid
    quotation.

### Reviews

-   Only the customer associated with a completed booking can review the
    expert.
-   At most one review exists per booking.
-   Rating is an integer from 1 to 5.
-   Users cannot edit or delete reviews to manipulate ratings; use a
    moderation process for abusive content.

### Admin

-   Admin endpoints require server-side admin authorization.
-   Verification decisions record the administrator and timestamp.
-   Suspended users cannot create quotations or bookings.
-   Reports have a status, owner, and resolution record.

## 9. Core workflows

### A. Browse expert

1.  Customer selects service category and township.
2.  Platform returns active experts matching the skill and service area.
3.  Customer views profile, work samples, reviews, and verification
    status.
4.  Customer contacts expert or creates a job request/invitation.
5.  Customer and expert agree on scope, schedule, and price through a
    quotation.
6.  Customer accepts the quotation; a booking is created.
7.  Work is performed and status updated.
8.  Customer reviews expert after completion.

### B. Post job and compare offers

1.  Customer creates a job with category, township, title, description,
    optional budget/date, and photos.
2.  Platform validates request and publishes it to eligible
    invited/visible experts.
3.  Experts submit quotations.
4.  Customer compares scope, total cost, duration, and expert profile.
5.  Customer accepts one quotation.
6.  System creates booking in a database transaction and closes or marks
    the job as assigned.
7.  Parties complete the job and customer may review.

### C. Larger project

1.  Customer posts scope, target timeline, location, and optional budget
    range.
2.  Expert submits a quotation with scope, exclusions, labor/material
    amounts, and estimated duration.
3.  Customer accepts offer and confirms the booking.
4.  Project milestones are recorded in a later phase.
5.  Each milestone tracks status and notes; the platform does not claim
    to hold milestone funds unless escrow is implemented legally and
    technically.
6.  Job closes after agreed work is complete.

### D. Complaint/cancellation

1.  Participant reports a problem against a booking.
2.  Platform records the report and preserves relevant records.
3.  Admin reviews the request, quotation, status history, and submitted
    evidence.
4.  Admin records resolution or escalation.
5.  Relevant participants are notified.

## 10. Non-functional requirements

-   Mobile-first responsive design.
-   Burmese and English localization.
-   Lightweight pages and compressed images for lower-bandwidth
    connections.
-   Paginated lists and database indexes for common searches.
-   Server-side authorization for every private resource.
-   Transactional state changes for booking/quotation acceptance.
-   Automated database backups and a tested restore process.
-   Error monitoring and structured logs.
-   Accessible forms, labels, and clear validation errors.
-   Data retention/deletion rules appropriate to local legal
    requirements.

## 11. Out of scope for initial MVP

-   Native mobile applications.
-   Escrow, wallet balances, or automatic payouts.
-   AI-based expert matching.
-   Live GPS tracking.
-   Guaranteed pricing or insurance claims.
-   Complex contractor payroll and workforce scheduling.
-   Automated legal dispute resolution.

## 12. Monetization hypothesis

Do not commit to a revenue model before observing actual usage.

Potential options: - Commission on completed jobs. - Paid qualified
leads. - Expert subscriptions. - Featured profiles. - Business plans for
contractors.

Pilot with free access, then test one model at a time. Commission
requires a reliable way to observe and collect payment for
platform-originated jobs; paid leads require clear quality standards and
fair handling of non-converting leads.
