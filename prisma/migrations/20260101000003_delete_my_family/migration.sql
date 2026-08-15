-- Settings > Data > "Delete account/data". There is deliberately no direct DELETE
-- policy on "families" (see 0002_rls_and_defaults) — a stray client-side
-- `.delete()` should never be able to remove a family. Deletion is only possible
-- through this SECURITY DEFINER RPC, which still checks the caller actually
-- belongs to the family (via current_family_ids()) before doing anything.
create or replace function public.delete_my_family(p_family_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_family_id is null or p_family_id not in (select public.current_family_ids()) then
    raise exception 'You do not have permission to delete this family.';
  end if;

  -- All other tables reference families with ON DELETE CASCADE (see 0000_init),
  -- so this single delete removes every category/account/transaction/budget/
  -- goal/recurring-transaction/member row that belonged to it.
  delete from public.families where id = p_family_id;
end;
$$;

grant execute on function public.delete_my_family(uuid) to authenticated;
