-- Hand-written (like 0002/0003/0006): `prisma migrate diff` can't introspect this database
-- because family_members has a cross-schema FK into auth.users.
--
-- Lets a 'savings' transaction optionally point at a SavingsGoal, so contributing
-- savings toward a goal is a side effect of just logging the transaction (in the
-- app or via Telegram) instead of manually re-typing the goal's current_amount.

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "goal_id" UUID;

-- AddForeignKey
-- ON DELETE SET NULL: deleting a goal shouldn't delete the transactions that
-- funded it, just unlink them (mirrors category_id/account_id nullability).
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "savings_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "transactions_goal_id_idx" ON "transactions"("goal_id");

-- =========================================================================
-- Goal contribution tracking — mirrors apply_transaction_balance_delta /
-- sync_account_balance (20260101000001_rls_and_defaults) but targets
-- savings_goals.current_amount instead of accounts.current_balance, and only
-- fires for 'savings' transactions carrying a goal_id. is_completed is
-- recomputed from the new current_amount on every change, both directions.
-- =========================================================================
create or replace function public.apply_goal_delta(
  p_goal_id uuid,
  p_amount numeric,
  p_sign int -- +1 to apply, -1 to reverse
)
returns void
language plpgsql
as $$
begin
  if p_goal_id is null then
    return;
  end if;
  update public.savings_goals
    set current_amount = current_amount + (p_sign * p_amount),
        is_completed = (current_amount + (p_sign * p_amount)) >= target_amount
  where id = p_goal_id;
end;
$$;

create or replace function public.sync_goal_amount()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if not new.is_deleted and new.type = 'savings' and new.goal_id is not null then
      perform public.apply_goal_delta(new.goal_id, new.amount, 1);
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if not old.is_deleted and old.type = 'savings' and old.goal_id is not null then
      perform public.apply_goal_delta(old.goal_id, old.amount, -1);
    end if;
    if not new.is_deleted and new.type = 'savings' and new.goal_id is not null then
      perform public.apply_goal_delta(new.goal_id, new.amount, 1);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if not old.is_deleted and old.type = 'savings' and old.goal_id is not null then
      perform public.apply_goal_delta(old.goal_id, old.amount, -1);
    end if;
    return old;
  end if;
  return null;
end;
$$;

create trigger sync_goal_amount
  after insert or update or delete on "transactions"
  for each row execute function public.sync_goal_amount();
