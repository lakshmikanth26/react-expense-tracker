-- Hand-written (like 0002/0003/0006/0007/0009): `prisma migrate diff` can't introspect this
-- database because family_members has a cross-schema FK into auth.users.
--
-- Widens the goal-contribution trigger from 0007 so an 'expense' transaction can also
-- count toward a linked savings_goals.current_amount, not just 'savings' transactions.
-- This lets a goal represent a payoff target (e.g. a home loan's outstanding balance)
-- fed by expense-type EMI payments, using the exact same progress-toward-target model
-- that savings goals already use — both directions still ADD to current_amount on
-- insert and correctly reverse/reapply on update/delete, unchanged from 0007's logic.
--
-- apply_goal_delta() itself has no type check (it just applies a signed delta to
-- whichever goal_id it's given), so only the type gate inside sync_goal_amount()
-- needs widening here.

create or replace function public.sync_goal_amount()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if not new.is_deleted and new.type in ('savings', 'expense') and new.goal_id is not null then
      perform public.apply_goal_delta(new.goal_id, new.amount, 1);
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if not old.is_deleted and old.type in ('savings', 'expense') and old.goal_id is not null then
      perform public.apply_goal_delta(old.goal_id, old.amount, -1);
    end if;
    if not new.is_deleted and new.type in ('savings', 'expense') and new.goal_id is not null then
      perform public.apply_goal_delta(new.goal_id, new.amount, 1);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if not old.is_deleted and old.type in ('savings', 'expense') and old.goal_id is not null then
      perform public.apply_goal_delta(old.goal_id, old.amount, -1);
    end if;
    return old;
  end if;
  return null;
end;
$$;
