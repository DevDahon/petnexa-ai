create extension if not exists pgcrypto;

create table if not exists public.homes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_members (
  home_id uuid not null references public.homes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  display_name text not null default '',
  joined_at timestamptz not null default now(),
  primary key (home_id, user_id)
);

create table if not exists public.home_invites (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz
);

create table if not exists public.home_pets (
  home_id uuid not null references public.homes(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (home_id, id)
);

create table if not exists public.home_veterinarians (
  home_id uuid not null references public.homes(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (home_id, id)
);

create table if not exists public.home_health_records (
  home_id uuid not null references public.homes(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (home_id, id)
);

create table if not exists public.home_reminders (
  home_id uuid not null references public.homes(id) on delete cascade,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (home_id, id)
);

create index if not exists home_pets_home_updated_idx on public.home_pets(home_id, updated_at);
create index if not exists home_vets_home_updated_idx on public.home_veterinarians(home_id, updated_at);
create index if not exists home_records_home_updated_idx on public.home_health_records(home_id, updated_at);
create index if not exists home_reminders_home_updated_idx on public.home_reminders(home_id, updated_at);
create index if not exists home_invites_code_idx on public.home_invites(code) where revoked_at is null;

alter table public.homes enable row level security;
alter table public.home_members enable row level security;
alter table public.home_invites enable row level security;
alter table public.home_pets enable row level security;
alter table public.home_veterinarians enable row level security;
alter table public.home_health_records enable row level security;
alter table public.home_reminders enable row level security;

create or replace function public.is_home_member(target_home_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.home_members hm
    where hm.home_id = target_home_id
      and hm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_home_member(uuid) from public;
grant execute on function public.is_home_member(uuid) to authenticated;

create policy "members can read homes"
on public.homes for select
to authenticated
using (public.is_home_member(id));

create policy "owners can update homes"
on public.homes for update
to authenticated
using (
  exists (
    select 1 from public.home_members hm
    where hm.home_id = id and hm.user_id = auth.uid() and hm.role = 'owner'
  )
)
with check (
  exists (
    select 1 from public.home_members hm
    where hm.home_id = id and hm.user_id = auth.uid() and hm.role = 'owner'
  )
);

create policy "members can read memberships"
on public.home_members for select
to authenticated
using (public.is_home_member(home_id));

create policy "members can read home invites"
on public.home_invites for select
to authenticated
using (public.is_home_member(home_id));

create policy "members can manage home pets"
on public.home_pets for all
to authenticated
using (public.is_home_member(home_id))
with check (public.is_home_member(home_id));

create policy "members can manage home veterinarians"
on public.home_veterinarians for all
to authenticated
using (public.is_home_member(home_id))
with check (public.is_home_member(home_id));

create policy "members can manage home health records"
on public.home_health_records for all
to authenticated
using (public.is_home_member(home_id))
with check (public.is_home_member(home_id));

create policy "members can manage home reminders"
on public.home_reminders for all
to authenticated
using (public.is_home_member(home_id))
with check (public.is_home_member(home_id));

create or replace function public.create_home_with_member(home_name text, member_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_home_id uuid;
  invite_code text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  invite_code := substring(upper(replace(gen_random_uuid()::text, '-', '')), 1, 8);

  insert into public.homes(name, created_by)
  values (coalesce(nullif(trim(home_name), ''), 'PetNexa Home'), auth.uid())
  returning id into new_home_id;

  insert into public.home_members(home_id, user_id, role, display_name)
  values (new_home_id, auth.uid(), 'owner', coalesce(nullif(trim(member_display_name), ''), 'Pet Parent'));

  insert into public.home_invites(home_id, code, created_by, expires_at)
  values (new_home_id, invite_code, auth.uid(), now() + interval '365 days');

  return jsonb_build_object('homeId', new_home_id, 'inviteCode', invite_code);
end;
$$;

create or replace function public.join_home_by_invite(invite_code text, member_display_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_home_id uuid;
  matched_home_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select hi.home_id, h.name
    into matched_home_id, matched_home_name
  from public.home_invites hi
  join public.homes h on h.id = hi.home_id
  where hi.code = upper(trim(invite_code))
    and hi.revoked_at is null
    and (hi.expires_at is null or hi.expires_at > now())
  limit 1;

  if matched_home_id is null then
    raise exception 'Invalid or expired invite code.';
  end if;

  insert into public.home_members(home_id, user_id, role, display_name)
  values (matched_home_id, auth.uid(), 'member', coalesce(nullif(trim(member_display_name), ''), 'Pet Parent'))
  on conflict (home_id, user_id) do update
    set display_name = excluded.display_name;

  return jsonb_build_object('homeId', matched_home_id, 'homeName', matched_home_name);
end;
$$;

revoke all on function public.create_home_with_member(text, text) from public;
revoke all on function public.join_home_by_invite(text, text) from public;
grant execute on function public.create_home_with_member(text, text) to authenticated;
grant execute on function public.join_home_by_invite(text, text) to authenticated;

insert into storage.buckets (id, name, public)
values ('petnexa-home-assets', 'petnexa-home-assets', false)
on conflict (id) do nothing;

create policy "members can read home assets"
on storage.objects for select
to authenticated
using (
  bucket_id = 'petnexa-home-assets'
  and public.is_home_member((storage.foldername(name))[1]::uuid)
);

create policy "members can upload home assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'petnexa-home-assets'
  and public.is_home_member((storage.foldername(name))[1]::uuid)
);

create policy "members can update home assets"
on storage.objects for update
to authenticated
using (
  bucket_id = 'petnexa-home-assets'
  and public.is_home_member((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'petnexa-home-assets'
  and public.is_home_member((storage.foldername(name))[1]::uuid)
);

create policy "members can delete home assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'petnexa-home-assets'
  and public.is_home_member((storage.foldername(name))[1]::uuid)
);
