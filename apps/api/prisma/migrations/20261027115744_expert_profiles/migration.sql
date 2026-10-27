-- CreateTable
CREATE TABLE "expert_portfolio_items" (
    "id" UUID NOT NULL,
    "expert_id" UUID NOT NULL,
    "storage_key" TEXT NOT NULL,
    "caption" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_portfolio_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expert_portfolio_items" ADD CONSTRAINT "expert_portfolio_items_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "expert_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
