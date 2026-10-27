-- CreateTable
CREATE TABLE "job_invitations" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "expert_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_invitations_job_id_expert_id_key" ON "job_invitations"("job_id", "expert_id");

-- AddForeignKey
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "expert_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_invitations" ADD CONSTRAINT "job_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
