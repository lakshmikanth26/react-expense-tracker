-- Development seed data — "The Demo Family" with two members, a few months of
-- realistic transactions, and a couple of budgets/goals so every screen has
-- something meaningful to show. NOT applied automatically and NOT part of the
-- Prisma migrations; run it by hand against a LOCAL/DEV Supabase project only:
--
--   psql "$DIRECT_URL" -f supabase/seed.sql
--
-- Never run this against a production project — it inserts a demo login
-- (demo@familyfinance.app / demopassword123) directly into auth.users.

do $$
declare
  v_user_id uuid := '00000000-0000-0000-0000-000000000001';
  v_family_id uuid;
  v_member_alex uuid;
  v_member_sam uuid;
  v_acct_cash uuid;
  v_acct_bank uuid;
  v_acct_credit uuid;
  v_acct_upi uuid;
  v_cat_food uuid;
  v_cat_groceries uuid;
  v_cat_transport uuid;
  v_cat_fuel uuid;
  v_cat_shopping uuid;
  v_cat_bills uuid;
  v_cat_entertainment uuid;
  v_cat_salary uuid;
  v_month date;
  v_day int;
begin
  if exists (select 1 from auth.users where id = v_user_id) then
    raise notice 'Demo user already exists, skipping seed.';
    return;
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  ) values (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'demo@familyfinance.app', crypt('demopassword123', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{}'
  );

  -- Run the same RPC the app calls, in a session impersonating the demo user,
  -- so seed data goes through exactly the same path (and RLS) as production.
  perform set_config('request.jwt.claim.sub', v_user_id::text, true);
  set local role authenticated;

  select id into v_family_id from public.create_family_with_defaults('The Demo Family', 'Alex');

  insert into public.family_members (family_id, name) values (v_family_id, 'Sam') returning id into v_member_sam;
  select id into v_member_alex from public.family_members where family_id = v_family_id and name = 'Alex';

  select id into v_acct_cash from public.accounts where family_id = v_family_id and name = 'Cash';
  select id into v_acct_bank from public.accounts where family_id = v_family_id and name = 'Bank Account';
  select id into v_acct_credit from public.accounts where family_id = v_family_id and name = 'Credit Card';
  select id into v_acct_upi from public.accounts where family_id = v_family_id and name = 'UPI';

  select id into v_cat_food from public.categories where family_id = v_family_id and name = 'Food';
  select id into v_cat_groceries from public.categories where family_id = v_family_id and name = 'Groceries';
  select id into v_cat_transport from public.categories where family_id = v_family_id and name = 'Transport';
  select id into v_cat_fuel from public.categories where family_id = v_family_id and name = 'Fuel';
  select id into v_cat_shopping from public.categories where family_id = v_family_id and name = 'Shopping';
  select id into v_cat_bills from public.categories where family_id = v_family_id and name = 'Bills';
  select id into v_cat_entertainment from public.categories where family_id = v_family_id and name = 'Entertainment';
  select id into v_cat_salary from public.categories where family_id = v_family_id and name = 'Salary';

  reset role;
  perform set_config('request.jwt.claim.sub', v_user_id::text, true);
  set local role authenticated;

  -- Opening balances: move real money into the debit-linked accounts before the
  -- first month's expenses hit them, so UPI/Cash don't dip into an unrealistic
  -- negative balance (unlike the credit card, which is expected to run negative).
  insert into public.transactions (family_id, member_id, account_id, transfer_to_account_id, type, amount, transaction_date, description)
  values
    (v_family_id, v_member_alex, v_acct_bank, v_acct_upi, 'transfer', 40000, date_trunc('month', current_date) - interval '2 months', 'Opening balance'),
    (v_family_id, v_member_alex, v_acct_bank, v_acct_cash, 'transfer', 10000, date_trunc('month', current_date) - interval '2 months', 'Opening balance');

  -- Three months of recurring salary + a spread of everyday expenses.
  for i in 0..2 loop
    v_month := date_trunc('month', current_date) - (i || ' months')::interval;

    insert into public.transactions (family_id, member_id, category_id, account_id, type, amount, transaction_date, description)
    values (v_family_id, v_member_alex, v_cat_salary, v_acct_bank, 'income', 136000, v_month + 0, 'Monthly salary');

    insert into public.transactions (family_id, member_id, category_id, account_id, type, amount, transaction_date, description, merchant)
    values
      (v_family_id, v_member_alex, v_cat_bills, v_acct_bank, 'expense', 25000, v_month + 0, 'House rent', 'Landlord'),
      (v_family_id, v_member_sam, v_cat_groceries, v_acct_upi, 'expense', 2450, v_month + 2, 'Weekly groceries', 'BigBasket'),
      (v_family_id, v_member_alex, v_cat_fuel, v_acct_credit, 'expense', 1500, v_month + 3, 'Petrol', 'Shell'),
      (v_family_id, v_member_alex, v_cat_food, v_acct_upi, 'expense', 350, v_month + 4, 'Lunch with team', 'Cafe Coffee Day'),
      (v_family_id, v_member_sam, v_cat_shopping, v_acct_credit, 'expense', 3200, v_month + 6, 'New shoes', 'Amazon'),
      (v_family_id, v_member_alex, v_cat_entertainment, v_acct_upi, 'expense', 649, v_month + 9, 'Netflix', 'Netflix'),
      (v_family_id, v_member_sam, v_cat_transport, v_acct_cash, 'expense', 220, v_month + 10, 'Auto rickshaw', null),
      (v_family_id, v_member_alex, v_cat_groceries, v_acct_upi, 'expense', 2800, v_month + 12, 'Groceries', 'DMart'),
      (v_family_id, v_member_sam, v_cat_food, v_acct_cash, 'expense', 500, v_month + 14, 'Dinner out', 'Domino''s'),
      (v_family_id, v_member_alex, v_cat_fuel, v_acct_credit, 'expense', 1600, v_month + 17, 'Petrol', 'Shell'),
      (v_family_id, v_member_sam, v_cat_shopping, v_acct_credit, 'expense', 4200, v_month + 19, 'Clothes', 'Myntra'),
      (v_family_id, v_member_alex, v_cat_bills, v_acct_bank, 'expense', 1800, v_month + 20, 'Electricity bill', 'State Electricity Board'),
      (v_family_id, v_member_alex, v_cat_food, v_acct_upi, 'expense', 420, v_month + 22, 'Lunch', 'Swiggy'),
      (v_family_id, v_member_sam, v_cat_groceries, v_acct_upi, 'expense', 1950, v_month + 25, 'Groceries', 'BigBasket'),
      (v_family_id, v_member_alex, v_cat_transport, v_acct_cash, 'expense', 180, v_month + 27, 'Cab', 'Ola');

    insert into public.transactions (family_id, member_id, account_id, transfer_to_account_id, type, amount, transaction_date, description)
    values (v_family_id, v_member_alex, v_acct_bank, v_acct_cash, 'transfer', 5000, v_month + 1, 'Cash withdrawal');
  end loop;

  insert into public.budgets (family_id, category_id, month, amount) values
    (v_family_id, null, date_trunc('month', current_date), 90000),
    (v_family_id, v_cat_food, date_trunc('month', current_date), 8000),
    (v_family_id, v_cat_groceries, date_trunc('month', current_date), 10000),
    (v_family_id, v_cat_shopping, date_trunc('month', current_date), 6000);

  insert into public.savings_goals (family_id, name, icon, target_amount, current_amount, target_date) values
    (v_family_id, 'Emergency Fund', '🛟', 300000, 180000, current_date + interval '6 months'),
    (v_family_id, 'Vacation', '✈️', 80000, 22000, current_date + interval '4 months');

  insert into public.recurring_transactions (
    family_id, member_id, category_id, account_id, type, amount, description,
    frequency, start_date, day_of_month, next_run_date
  ) values
    (v_family_id, v_member_alex, v_cat_salary, v_acct_bank, 'income', 136000, 'Monthly salary', 'monthly', date_trunc('month', current_date), 1, date_trunc('month', current_date) + interval '1 month'),
    (v_family_id, v_member_alex, v_cat_bills, v_acct_bank, 'expense', 25000, 'House rent', 'monthly', date_trunc('month', current_date), 1, date_trunc('month', current_date) + interval '1 month'),
    (v_family_id, v_member_alex, v_cat_entertainment, v_acct_upi, 'expense', 649, 'Netflix', 'monthly', date_trunc('month', current_date), 10, date_trunc('month', current_date) + interval '1 month' + interval '9 days');

  reset role;

  raise notice 'Seeded demo family % — sign in as demo@familyfinance.app / demopassword123', v_family_id;
end;
$$;
