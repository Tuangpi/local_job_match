-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('active', 'suspended', 'pending', 'deleted');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('one_day', 'installation', 'project');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled', 'disputed');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "preferred_language" VARCHAR(5) NOT NULL DEFAULT 'my',
    "status" "AccountStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL,
    "name_en" VARCHAR(120) NOT NULL,
    "name_my" VARCHAR(120),

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "townships" (
    "id" UUID NOT NULL,
    "city_id" UUID NOT NULL,
    "name_en" VARCHAR(120) NOT NULL,
    "name_my" VARCHAR(120),

    CONSTRAINT "townships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "slug" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(120) NOT NULL,
    "name_my" VARCHAR(120),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_profiles" (
    "user_id" UUID NOT NULL,
    "bio" TEXT,
    "experience_years" SMALLINT,
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'unverified',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "expert_skills" (
    "expert_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "experience_years" SMALLINT,

    CONSTRAINT "expert_skills_pkey" PRIMARY KEY ("expert_id","category_id")
);

-- CreateTable
CREATE TABLE "expert_areas" (
    "expert_id" UUID NOT NULL,
    "township_id" UUID NOT NULL,

    CONSTRAINT "expert_areas_pkey" PRIMARY KEY ("expert_id","township_id")
);

-- CreateTable
CREATE TABLE "job_requests" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "township_id" UUID NOT NULL,
    "job_type" "JobType" NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "budget_min" BIGINT,
    "budget_max" BIGINT,
    "currency" CHAR(3) NOT NULL DEFAULT 'MMK',
    "preferred_date" DATE,
    "status" "JobStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "job_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_photos" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "expert_id" UUID NOT NULL,
    "labor_amount" BIGINT NOT NULL,
    "materials_amount" BIGINT NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'MMK',
    "scope" TEXT NOT NULL,
    "estimated_days" SMALLINT,
    "valid_until" TIMESTAMPTZ(6),
    "status" "QuotationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "quotation_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "status" "JobStatus" NOT NULL DEFAULT 'in_progress',
    "agreed_amount" BIGINT NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'MMK',
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_status_history" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "old_status" "JobStatus",
    "new_status" "JobStatus" NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "amount" BIGINT,
    "currency" CHAR(3) NOT NULL DEFAULT 'MMK',
    "due_at" TIMESTAMPTZ(6),
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_en_key" ON "cities"("name_en");

-- CreateIndex
CREATE UNIQUE INDEX "townships_city_id_name_en_key" ON "townships"("city_id", "name_en");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "idx_jobs_location_category_status" ON "job_requests"("township_id", "category_id", "status");

-- CreateIndex
CREATE INDEX "idx_jobs_customer_created" ON "job_requests"("customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_quotations_job_status" ON "quotations"("job_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_job_id_expert_id_id_key" ON "quotations"("job_id", "expert_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_job_id_key" ON "bookings"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_quotation_id_key" ON "bookings"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_booking_id_key" ON "reviews"("booking_id");

-- AddForeignKey
ALTER TABLE "townships" ADD CONSTRAINT "townships_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_profiles" ADD CONSTRAINT "expert_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_skills" ADD CONSTRAINT "expert_skills_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "expert_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_skills" ADD CONSTRAINT "expert_skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_areas" ADD CONSTRAINT "expert_areas_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "expert_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_areas" ADD CONSTRAINT "expert_areas_township_id_fkey" FOREIGN KEY ("township_id") REFERENCES "townships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_requests" ADD CONSTRAINT "job_requests_township_id_fkey" FOREIGN KEY ("township_id") REFERENCES "townships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_photos" ADD CONSTRAINT "job_photos_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "expert_profiles"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
