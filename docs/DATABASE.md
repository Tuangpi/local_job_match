# Database Design

## 1. Conventions

-   PostgreSQL with UUID primary keys.
-   `TIMESTAMPTZ` for instants; store and display in a defined timezone
    policy.
-   Persist currency code with monetary values.
-   Store money as integer units, never floating-point values.
-   Add `created_at` and `updated_at` where appropriate.
-   Use foreign keys, uniqueness constraints, check constraints, and
    indexes.
-   Soft-delete or deactivate records when history must be retained.
-   Keep private documents in object storage; database stores opaque
    storage keys and metadata.

## 2. Entity relationships

``` mermaid
erDiagram
    USERS ||--o| EXPERT_PROFILES : has
    USERS ||--o{ JOB_REQUESTS : creates
    CATEGORIES ||--o{ EXPERT_SKILLS : includes
    EXPERT_PROFILES ||--o{ EXPERT_SKILLS : offers
    EXPERT_PROFILES ||--o{ EXPERT_AREAS : serves
    JOB_REQUESTS ||--o{ JOB_PHOTOS : includes
    JOB_REQUESTS ||--o{ QUOTATIONS : receives
    EXPERT_PROFILES ||--o{ QUOTATIONS : submits
    JOB_REQUESTS ||--o| BOOKINGS : creates
    QUOTATIONS ||--o| BOOKINGS : accepted_as
    BOOKINGS ||--o{ JOB_STATUS_HISTORY : records
    BOOKINGS ||--o| REVIEWS : receives
    BOOKINGS ||--o{ PROJECT_MILESTONES : contains
```

## 3. Main tables

  -----------------------------------------------------------------------
  Table                               Purpose
  ----------------------------------- -----------------------------------
  `users`                             Identity, phone, preferred
                                      language, account status

  `expert_profiles`                   Public expert information and
                                      verification status

  `expert_portfolio_items`            Work sample photos and captions

  `categories`                        Hierarchical service categories

  `expert_skills`                     Expert/category mapping and
                                      experience

  `cities`, `townships`               Curated service location taxonomy

  `expert_areas`                      Townships an expert serves

  `expert_verification_documents`     Private verification metadata and
                                      status

  `job_requests`                      Customer job details and lifecycle

  `job_photos`                        Job image references

  `job_invitations`                   Experts invited to quote

  `quotations`                        Expert offers with price, scope,
                                      validity

  `bookings`                          Confirmed work and agreed amount

  `job_status_history`                Actor and transition audit trail

  `project_milestones`                Later-phase project tracking

  `reviews`                           Completed-job feedback

  `notifications`                     In-app alerts

  `reports`                           Complaints and moderation cases

  `admin_audit_logs`                  Sensitive administrative actions
  -----------------------------------------------------------------------

## 4. Starter PostgreSQL schema

The following is a foundation, not a complete production migration.
Extend it with invitation, portfolio, verification, notification,
report, and audit tables before launch.

``` sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE account_status AS ENUM
  ('active', 'suspended', 'pending', 'deleted');
CREATE TYPE verification_status AS ENUM
  ('unverified', 'pending', 'verified', 'rejected');
CREATE TYPE job_type AS ENUM
  ('one_day', 'installation', 'project');
CREATE TYPE job_status AS ENUM
  ('draft', 'open', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE quotation_status AS ENUM
  ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  preferred_language VARCHAR(5) NOT NULL DEFAULT 'my',
  status account_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en VARCHAR(120) NOT NULL UNIQUE,
  name_my VARCHAR(120)
);

CREATE TABLE townships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id),
  name_en VARCHAR(120) NOT NULL,
  name_my VARCHAR(120),
  UNIQUE (city_id, name_en)
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name_en VARCHAR(120) NOT NULL,
  name_my VARCHAR(120),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE expert_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  bio TEXT,
  experience_years SMALLINT CHECK (experience_years >= 0),
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expert_skills (
  expert_id UUID NOT NULL REFERENCES expert_profiles(user_id),
  category_id UUID NOT NULL REFERENCES categories(id),
  experience_years SMALLINT CHECK (experience_years >= 0),
  PRIMARY KEY (expert_id, category_id)
);

CREATE TABLE expert_areas (
  expert_id UUID NOT NULL REFERENCES expert_profiles(user_id),
  township_id UUID NOT NULL REFERENCES townships(id),
  PRIMARY KEY (expert_id, township_id)
);

CREATE TABLE job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  township_id UUID NOT NULL REFERENCES townships(id),
  job_type job_type NOT NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  budget_min BIGINT CHECK (budget_min >= 0),
  budget_max BIGINT CHECK (budget_max >= budget_min),
  currency CHAR(3) NOT NULL DEFAULT 'MMK',
  preferred_date DATE,
  status job_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_requests(id),
  expert_id UUID NOT NULL REFERENCES expert_profiles(user_id),
  labor_amount BIGINT NOT NULL CHECK (labor_amount >= 0),
  materials_amount BIGINT NOT NULL DEFAULT 0 CHECK (materials_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'MMK',
  scope TEXT NOT NULL,
  estimated_days SMALLINT CHECK (estimated_days > 0),
  valid_until TIMESTAMPTZ,
  status quotation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, expert_id, id)
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL UNIQUE REFERENCES job_requests(id),
  quotation_id UUID NOT NULL UNIQUE REFERENCES quotations(id),
  scheduled_at TIMESTAMPTZ,
  status job_status NOT NULL DEFAULT 'in_progress',
  agreed_amount BIGINT NOT NULL CHECK (agreed_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'MMK',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE job_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  actor_id UUID NOT NULL REFERENCES users(id),
  old_status job_status,
  new_status job_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  title VARCHAR(160) NOT NULL,
  description TEXT,
  amount BIGINT CHECK (amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'MMK',
  due_at TIMESTAMPTZ,
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_location_category_status
  ON job_requests (township_id, category_id, status);
CREATE INDEX idx_quotations_job_status
  ON quotations (job_id, status);
CREATE INDEX idx_expert_areas_township
  ON expert_areas (township_id, expert_id);
CREATE INDEX idx_jobs_customer_created
  ON job_requests (customer_id, created_at DESC);
```

## 5. Required constraints and transactional rules

The starter schema needs additional production safeguards:

1.  A booking's quotation must belong to the same job as the booking.
2.  The quotation must belong to the expert selected for the job.
3.  Only the job owner may accept a quotation.
4.  The job must be open and the quotation pending/not expired at
    acceptance.
5.  Only one quotation may be accepted for a job.
6.  The reviewer's user ID must equal the booking's customer ID.
7.  The booking and job status transitions must be permitted.
8.  The job and quotation must be updated in one transaction during
    acceptance.
9.  Concurrent accept requests must be serialized or protected with row
    locks/conditional updates.
10. Monetary totals must be computed and validated on the server.

Do not rely on a frontend-only check. Use transactions and, where
useful, composite foreign keys or database triggers to enforce
cross-record invariants.

## 6. Schema additions before launch

-   `job_invitations(job_id, expert_id, invited_by, status, created_at)`
    with unique `(job_id, expert_id)`.
-   `expert_portfolio_items(id, expert_id, storage_key, caption, created_at)`.
-   `expert_verification_documents(id, expert_id, document_type, private_storage_key, status, reviewed_by, reviewed_at)`.
-   `notifications(id, user_id, type, payload_json, read_at, created_at)`.
-   `reports(id, reporter_id, booking_id, reason, description, status, assigned_admin_id, resolution, created_at, resolved_at)`.
-   `admin_audit_logs(id, admin_id, action, target_type, target_id, metadata_json, created_at)`.

Keep storage keys opaque. Do not persist public URLs for private
identity documents.
