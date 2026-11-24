-- =============================================================================
-- 004 — Havi közös túra + úti cél szavazás
-- Havonta egy közös túra a Társaság tagjaival, Magyarországon. A következő úti
-- célt mindig a Társaság szavazza meg. A szavazás állása a lezárásig nem látszik
-- (nincs „verseny”, nincs nyomás) — csak a saját szavazatodat látod.
-- =============================================================================

alter type public.event_kind add value if not exists 'tura';

create table public.destination_polls (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null check (char_length(title) between 1 and 200),
  description        text check (char_length(description) <= 2000),
  opens_at           timestamptz not null default now(),
  closes_at          timestamptz not null,
  winning_option_id  uuid,
  event_id           uuid references public.events (id) on delete set null,  -- a kiírt túra
  created_at         timestamptz not null default now(),
  check (closes_at >= opens_at)
);

create table public.destination_options (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references public.destination_polls (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  description  text check (char_length(description) <= 1000),
  created_at   timestamptz not null default now(),
  unique (id, poll_id)
);

alter table public.destination_polls
  add constraint destination_polls_winning_option_fkey
  foreign key (winning_option_id) references public.destination_options (id) on delete set null;

create table public.destination_votes (
  poll_id     uuid not null references public.destination_polls (id) on delete cascade,
  option_id   uuid not null,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (poll_id, user_id),
  -- a választott lehetőség ugyanahhoz a szavazáshoz tartozzon
  foreign key (option_id, poll_id) references public.destination_options (id, poll_id) on delete cascade
);

-- RLS — ENABLE + FORCE
alter table public.destination_polls   enable row level security;
alter table public.destination_options enable row level security;
alter table public.destination_votes   enable row level security;
alter table public.destination_polls   force row level security;
alter table public.destination_options force row level security;
alter table public.destination_votes   force row level security;

create policy destination_polls_select on public.destination_polls
  for select to authenticated using (public.has_member_access() or public.is_admin());
create policy destination_polls_admin_all on public.destination_polls
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy destination_options_select on public.destination_options
  for select to authenticated using (public.has_member_access() or public.is_admin());
create policy destination_options_admin_all on public.destination_options
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Szavazat: csak a sajátodat látod; leadni/módosítani csak RPC-vel lehet.
create policy destination_votes_select_own on public.destination_votes
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- Szavazás (a lezárásig módosítható). Minden aktív tag szavazhat, a próbaidős is.
create or replace function public.cast_destination_vote(p_poll_id uuid, p_option_id uuid)
returns public.destination_votes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_poll public.destination_polls;
  v_row  public.destination_votes;
begin
  if v_uid is null then
    raise exception 'Bejelentkezés szükséges.' using errcode = '28000', hint = 'NOT_AUTHENTICATED';
  end if;
  if not public.has_member_access() then
    raise exception 'Szavazni a Társaság tagjai tudnak.' using errcode = 'P0001', hint = 'NOT_MEMBER';
  end if;
  select * into v_poll from public.destination_polls where id = p_poll_id for update;
  if not found then
    raise exception 'A szavazás nem található.' using errcode = 'P0001', hint = 'POLL_NOT_FOUND';
  end if;
  if now() < v_poll.opens_at or now() >= v_poll.closes_at or v_poll.winning_option_id is not null then
    raise exception 'Ez a szavazás most nem nyitott.' using errcode = 'P0001', hint = 'POLL_CLOSED';
  end if;
  if not exists (select 1 from public.destination_options o where o.id = p_option_id and o.poll_id = p_poll_id) then
    raise exception 'Ez a lehetőség nem ehhez a szavazáshoz tartozik.' using errcode = 'P0001', hint = 'INVALID_OPTION';
  end if;

  insert into public.destination_votes (poll_id, option_id, user_id)
  values (p_poll_id, p_option_id, v_uid)
  on conflict (poll_id, user_id) do update set option_id = excluded.option_id, updated_at = now()
  returning * into v_row;
  return v_row;
end;
$$;

-- Eredmény: csak lezárt szavazásnál (vagy adminnak) — közben nincs állás.
create or replace function public.destination_poll_results(p_poll_id uuid)
returns table (option_id uuid, name text, votes integer, is_winner boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_poll public.destination_polls;
begin
  if not (public.has_member_access() or public.is_admin()) then
    raise exception 'Csak a Társaság tagjai láthatják.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select * into v_poll from public.destination_polls where id = p_poll_id;
  if not found then
    raise exception 'A szavazás nem található.' using errcode = 'P0001', hint = 'POLL_NOT_FOUND';
  end if;
  if not public.is_admin() and now() < v_poll.closes_at and v_poll.winning_option_id is null then
    raise exception 'Az eredmény a szavazás lezárása után látható.' using errcode = 'P0001', hint = 'RESULTS_HIDDEN';
  end if;

  return query
    select o.id, o.name,
           (select count(*) from public.destination_votes v where v.option_id = o.id)::integer,
           o.id = v_poll.winning_option_id
      from public.destination_options o
     where o.poll_id = p_poll_id
     order by 3 desc, o.name;
end;
$$;

-- Lezárás (admin): a győztes a legtöbb szavazatot kapott lehetőség; holtversenynél
-- vagy ha az admin úgy dönt, a győztest paraméterben kell megadni.
create or replace function public.admin_close_destination_poll(p_poll_id uuid, p_option_id uuid default null)
returns public.destination_polls
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_poll   public.destination_polls;
  v_winner uuid := p_option_id;
  v_top    integer;
  v_ties   integer;
begin
  if not public.is_admin() then
    raise exception 'Ehhez admin jogosultság szükséges.' using errcode = '42501', hint = 'FORBIDDEN';
  end if;
  select * into v_poll from public.destination_polls where id = p_poll_id for update;
  if not found then
    raise exception 'A szavazás nem található.' using errcode = 'P0001', hint = 'POLL_NOT_FOUND';
  end if;

  if v_winner is null then
    select max(c), count(*) filter (where c = (select max(c2) from (
             select count(*) as c2 from public.destination_votes v where v.poll_id = p_poll_id group by v.option_id) x))
      into v_top, v_ties
      from (select count(*) as c from public.destination_votes v where v.poll_id = p_poll_id group by v.option_id) t;
    if v_top is null then
      raise exception 'Még nincs szavazat.' using errcode = 'P0001', hint = 'NO_VOTES';
    end if;
    if v_ties > 1 then
      raise exception 'Holtverseny — add meg a győztes lehetőséget.' using errcode = 'P0001', hint = 'TIE';
    end if;
    select v.option_id into v_winner from public.destination_votes v
     where v.poll_id = p_poll_id group by v.option_id order by count(*) desc limit 1;
  elsif not exists (select 1 from public.destination_options o where o.id = v_winner and o.poll_id = p_poll_id) then
    raise exception 'Ez a lehetőség nem ehhez a szavazáshoz tartozik.' using errcode = 'P0001', hint = 'INVALID_OPTION';
  end if;

  update public.destination_polls
     set winning_option_id = v_winner, closes_at = least(closes_at, now())
   where id = p_poll_id
  returning * into v_poll;
  return v_poll;
end;
$$;

-- Jogok
revoke all on public.destination_polls, public.destination_options, public.destination_votes from anon, authenticated;
grant select, insert, update, delete on public.destination_polls to authenticated;
grant select, insert, update, delete on public.destination_options to authenticated;
grant select on public.destination_votes to authenticated;
grant all on public.destination_polls, public.destination_options, public.destination_votes to service_role;

revoke execute on function public.cast_destination_vote(uuid, uuid) from public, anon;
revoke execute on function public.destination_poll_results(uuid) from public, anon;
revoke execute on function public.admin_close_destination_poll(uuid, uuid) from public, anon;
grant execute on function public.cast_destination_vote(uuid, uuid) to authenticated, service_role;
grant execute on function public.destination_poll_results(uuid) to authenticated, service_role;
grant execute on function public.admin_close_destination_poll(uuid, uuid) to authenticated, service_role;
