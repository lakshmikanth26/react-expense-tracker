-- Hand-written (like 0002/0003/0006/0007/0008/0009/0010): `prisma migrate diff` can't
-- introspect this database because family_members has a cross-schema FK into auth.users.
--
-- Adds a "Loans" feature, separate from Savings Goals (savings_goals/goal_id).
-- Savings Goals model progress toward a target as a simple additive sum (current_amount
-- += full transaction amount), which is correct for savings and was recently widened to
-- also work for "payoff" style goals fed by expense transactions (see 0010). That additive
-- model is WRONG for an amortizing loan (e.g. a home loan EMI): each payment splits into an
-- interest component (a cost — does not reduce what's owed) and a principal component (the
-- only part that reduces the balance). Naively adding the full EMI to a "paid off" tally
-- overstates progress. Loans get their own table and their own path-dependent, ordered
-- amortization trigger instead of the simple signed-delta trigger goals use.

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "principal_amount" DECIMAL(12,2) NOT NULL,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "emi_amount" DECIMAL(12,2) NOT NULL,
    "current_balance" DECIMAL(12,2) NOT NULL,
    "start_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loans_family_id_idx" ON "loans"("family_id");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraints
-- principal_amount is a balance anchor ("amount owed as of start_date"), not necessarily
-- the original loan amount — so it must be positive but has no upper relationship to
-- current_balance enforced (current_balance is recomputed from it, see trigger below).
alter table "loans" add constraint "loans_principal_amount_positive" check ("principal_amount" > 0);
alter table "loans" add constraint "loans_interest_rate_non_negative" check ("interest_rate" >= 0);
alter table "loans" add constraint "loans_emi_amount_positive" check ("emi_amount" > 0);
alter table "loans" add constraint "loans_current_balance_non_negative" check ("current_balance" >= 0);

-- updated_at bookkeeping — reuse the existing trigger function (see 0001), don't redefine it.
create trigger set_updated_at before update on "loans" for each row execute function public.set_updated_at();

-- =========================================================================
-- Link payments to a loan, same shape as goal_id (0007/0009): nullable FK on
-- transactions and recurring_transactions, ON DELETE SET NULL so deleting a loan
-- unlinks its payment history instead of destroying it.
-- =========================================================================

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "loan_id" UUID;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "transactions_loan_id_idx" ON "transactions"("loan_id");

-- AlterTable
ALTER TABLE "recurring_transactions" ADD COLUMN "loan_id" UUID;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "recurring_transactions_loan_id_idx" ON "recurring_transactions"("loan_id");
-- Note: recurring_transactions.loan_id needs no recompute trigger of its own — it only
-- exists so generateDueRecurringTransactions() can pass loan_id through onto the real
-- transactions row it creates, which then fires the trigger below.

-- =========================================================================
-- RLS: family-scoped, same current_family_ids() pattern as every other table
-- (savings_goals, insurances, ...).
-- =========================================================================
alter table "loans" enable row level security;

create policy "loans_select" on "loans" for select using (family_id in (select public.current_family_ids()));
create policy "loans_insert" on "loans" for insert with check (family_id in (select public.current_family_ids()));
create policy "loans_update" on "loans" for update using (family_id in (select public.current_family_ids()));
create policy "loans_delete" on "loans" for delete using (family_id in (select public.current_family_ids()));

grant select, insert, update, delete on "loans" to authenticated;

-- =========================================================================
-- Balance recomputation — deliberately NOT a simple signed-delta trigger like
-- apply_goal_delta/sync_goal_amount (0007/0010). Amortization is path- and
-- order-dependent (the interest/principal split for a given payment depends on
-- the balance every payment before it left behind), so instead of applying one
-- payment's delta in isolation, recompute_loan_balance() replays the full,
-- date-ordered payment history for a loan from its start_date every time any
-- payment linked to it is inserted, updated, or deleted.
-- =========================================================================
create or replace function public.recompute_loan_balance(p_loan_id uuid)
returns void
language plpgsql
as $$
declare
  v_principal numeric;
  v_rate numeric;
  v_start_date date;
  v_balance numeric;
  v_monthly_rate numeric;
  v_interest_component numeric;
  v_principal_component numeric;
  r record;
begin
  select principal_amount, interest_rate, start_date
    into v_principal, v_rate, v_start_date
  from public.loans
  where id = p_loan_id;

  if not found then
    return;
  end if;

  v_balance := v_principal;
  v_monthly_rate := v_rate / 12 / 100;

  for r in
    select amount
    from public.transactions
    where loan_id = p_loan_id
      and is_deleted = false
      and transaction_date >= v_start_date
    order by transaction_date asc, created_at asc
  loop
    v_interest_component := v_balance * v_monthly_rate;
    v_principal_component := r.amount - v_interest_component;
    v_balance := greatest(v_balance - v_principal_component, 0);
  end loop;

  update public.loans
    set current_balance = v_balance,
        is_closed = (v_balance <= 0.01)
  where id = p_loan_id;
end;
$$;

create or replace function public.sync_loan_balance()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.loan_id is not null then
      perform public.recompute_loan_balance(new.loan_id);
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if new.loan_id is not null then
      perform public.recompute_loan_balance(new.loan_id);
    end if;
    if old.loan_id is not null and old.loan_id is distinct from new.loan_id then
      perform public.recompute_loan_balance(old.loan_id);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.loan_id is not null then
      perform public.recompute_loan_balance(old.loan_id);
    end if;
    return old;
  end if;
  return null;
end;
$$;

-- WHEN guard: a no-op (doesn't even invoke the function) for the vast majority of
-- transaction writes that have nothing to do with a loan. Split into one trigger per
-- operation (rather than a single combined "insert or update or delete" trigger, as
-- sync_goal_amount uses) because Postgres rejects a WHEN clause referencing OLD on an
-- INSERT trigger / NEW on a DELETE trigger even when the trigger is also declared for
-- other operations where that row would exist.
create trigger sync_loan_balance_insert
  after insert on "transactions"
  for each row
  when (new.loan_id is not null)
  execute function public.sync_loan_balance();

create trigger sync_loan_balance_update
  after update on "transactions"
  for each row
  when (old.loan_id is not null or new.loan_id is not null)
  execute function public.sync_loan_balance();

create trigger sync_loan_balance_delete
  after delete on "transactions"
  for each row
  when (old.loan_id is not null)
  execute function public.sync_loan_balance();
