-- Hand-written (like 0002/0003/0006/0007/0008): `prisma migrate diff` can't introspect this
-- database because family_members has a cross-schema FK into auth.users.
--
-- Lets a recurring 'savings' definition point at a SavingsGoal too, same as one-off
-- savings transactions (0007) — each transaction generateDueRecurringTransactions
-- creates just carries this goal_id through, so the existing sync_goal_amount trigger
-- (0007) updates the goal automatically without any new trigger logic here.

-- AlterTable
ALTER TABLE "recurring_transactions" ADD COLUMN "goal_id" UUID;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "savings_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "recurring_transactions_goal_id_idx" ON "recurring_transactions"("goal_id");
