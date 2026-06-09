create policy "owners can delete homes"
on public.homes for delete
to authenticated
using (
  exists (
    select 1
    from public.home_members hm
    where hm.home_id = id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  )
);
