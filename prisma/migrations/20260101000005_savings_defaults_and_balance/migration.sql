-- Wires up the 'savings' transaction/category type added in the previous migration:
-- 1. Balance impact: a savings entry debits its account exactly like an expense does
--    (money leaves the spending account) — it's simply categorized separately so it
--    never gets counted as discretionary spending.
-- 2. New families now also get a default set of savings categories, alongside the
--    existing expense/income ones.

create or replace function public.apply_transaction_balance_delta(
  p_account_id uuid,
  p_transfer_to_account_id uuid,
  p_type "transaction_type",
  p_amount numeric,
  p_sign int -- +1 to apply, -1 to reverse
)
returns void
language plpgsql
as $$
begin
  if p_type = 'expense' or p_type = 'savings' then
    update public.accounts set current_balance = current_balance - (p_sign * p_amount) where id = p_account_id;
  elsif p_type = 'income' then
    update public.accounts set current_balance = current_balance + (p_sign * p_amount) where id = p_account_id;
  elsif p_type = 'transfer' then
    update public.accounts set current_balance = current_balance - (p_sign * p_amount) where id = p_account_id;
    update public.accounts set current_balance = current_balance + (p_sign * p_amount) where id = p_transfer_to_account_id;
  end if;
end;
$$;

create or replace function public.create_family_with_defaults(
  p_family_name text,
  p_member_name text,
  p_currency text default 'INR'
)
returns public.families
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family public.families;
  v_expense_categories text[][] := array[
    array['Food', '🍔'], array['Groceries', '🛒'], array['Home', '🏠'],
    array['Utilities', '💡'], array['Transport', '🚗'], array['Fuel', '⛽'],
    array['Medical', '🏥'], array['Medicine', '💊'], array['Shopping', '🛍️'],
    array['Clothing', '👕'], array['Mobile', '📱'], array['Internet', '🌐'],
    array['Entertainment', '🎬'], array['Travel', '✈️'], array['Education', '🎓'],
    array['Children', '👶'], array['Pets', '🐶'], array['Bills', '💳'],
    array['Loan', '🏦'], array['Subscriptions', '📦'], array['Gifts', '🎁'],
    array['Investments', '💰'], array['Other', '📋']
  ];
  v_income_categories text[][] := array[
    array['Salary', '💼'], array['Bonus', '💰'], array['Interest', '🏦'],
    array['Investment', '📈'], array['Gift', '🎁'], array['Other', '💵']
  ];
  v_savings_categories text[][] := array[
    array['Fixed Deposit', '🏦'], array['Mutual Funds', '📈'], array['Stocks', '📊'],
    array['PPF/EPF', '🏛️'], array['Gold', '🪙'], array['Emergency Fund', '🛟'],
    array['Other', '💰']
  ];
  v_accounts text[][] := array[
    array['Cash', 'cash'], array['Bank Account', 'bank'],
    array['Credit Card', 'credit_card'], array['UPI', 'upi']
  ];
  v_row text[];
begin
  if exists (select 1 from public.family_members where user_id = auth.uid()) then
    raise exception 'You already belong to a family.';
  end if;

  insert into public.families (name, currency) values (p_family_name, p_currency)
  returning * into v_family;

  insert into public.family_members (family_id, user_id, name, is_active)
  values (v_family.id, auth.uid(), p_member_name, true);

  insert into public.profiles (user_id, full_name)
  values (auth.uid(), p_member_name)
  on conflict (user_id) do nothing;

  foreach v_row slice 1 in array v_expense_categories loop
    insert into public.categories (family_id, name, type, icon, is_default)
    values (v_family.id, v_row[1], 'expense', v_row[2], true);
  end loop;

  foreach v_row slice 1 in array v_income_categories loop
    insert into public.categories (family_id, name, type, icon, is_default)
    values (v_family.id, v_row[1], 'income', v_row[2], true);
  end loop;

  foreach v_row slice 1 in array v_savings_categories loop
    insert into public.categories (family_id, name, type, icon, is_default)
    values (v_family.id, v_row[1], 'savings', v_row[2], true);
  end loop;

  foreach v_row slice 1 in array v_accounts loop
    insert into public.accounts (family_id, name, type, opening_balance, current_balance)
    values (v_family.id, v_row[1], v_row[2]::public.account_type, 0, 0);
  end loop;

  return v_family;
end;
$$;
