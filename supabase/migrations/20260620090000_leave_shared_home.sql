create or replace function public.leave_home(target_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_role text;
begin
  if auth.uid() is null then
    raise exception 'Sign in before leaving a Fur Home.';
  end if;

  select role
    into member_role
  from public.home_members
  where home_id = target_home_id
    and user_id = auth.uid();

  if member_role is null then
    raise exception 'You are not a member of this Fur Home.';
  end if;

  if member_role = 'owner' then
    raise exception 'Home owners must delete the Home instead of leaving it.';
  end if;

  delete from public.home_members
  where home_id = target_home_id
    and user_id = auth.uid()
    and role <> 'owner';
end;
$$;

revoke all on function public.leave_home(uuid) from public;
grant execute on function public.leave_home(uuid) to authenticated;
