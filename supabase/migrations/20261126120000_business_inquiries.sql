-- =============================================================================
-- 022 — Céges ajánlatkérések (2026. november 26.)
--   A „Cégeknek” oldal űrlapja. Csak érdeklődés: szerződés és számla a KATA szerint
--   2027-től (Bálint döntése). Admin olvassa; a weboldal service role-lal, RPC-n át ír.
--   Megőrzés: 1 év, utána automatikus törlés.
-- =============================================================================

alter table public.admin_notifications drop constraint admin_notifications_kind_check;
alter table public.admin_notifications add constraint admin_notifications_kind_check check (kind in (
  'chargeback', 'revenue_warning', 'payment_failed', 'progression_request', 'overbooking', 'other',
  'application', 'consultation_booked', 'weekly_report', 'business_inquiry'));

create type public.business_inquiry_status as enum ('uj', 'folyamatban', 'ajanlat_kiment', 'megnyert', 'nem_lett');

create table public.business_inquiries (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  company_name       text not null check (char_length(btrim(company_name)) between 2 and 200),
  hq_city            text not null check (char_length(btrim(hq_city)) between 2 and 120),
  company_size       integer not null check (company_size between 1 and 1000000),
  participants       integer check (participants between 1 and 100000),
  contact_name       text not null check (char_length(btrim(contact_name)) between 2 and 120),
  contact_role       text check (contact_role is null or char_length(contact_role) <= 120),
  email              text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone              text check (phone is null or char_length(phone) <= 40),
  goal               text not null check (char_length(btrim(goal)) between 3 and 4000),
  formats            text[] not null check (cardinality(formats) between 1 and 5
                       and formats <@ array['treningnap', 'tobbalkalmas', 'eloadas', 'vezetoi_egyeni', 'egyeb']),
  locations          text[] not null check (cardinality(locations) between 1 and 3
                       and locations <@ array['nalunk', 'kulso', 'online']),
  timing             text not null check (timing in ('1_honapon_belul', '1_3_honap', '3_6_honap', 'kesobb', 'nem_tudom')),
  budget             text check (budget is null or budget in ('500e_alatt', '500e_1_5m', '1_5m_felett', 'meg_nincs')),
  privacy_consent_at timestamptz not null,
  status             public.business_inquiry_status not null default 'uj',
  admin_note         text check (admin_note is null or char_length(admin_note) <= 4000)
);
create index business_inquiries_created_idx on public.business_inquiries (created_at desc);

alter table public.business_inquiries enable row level security;
alter table public.business_inquiries force row level security;
create policy business_inquiries_admin on public.business_inquiries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.business_inquiries to authenticated;
grant all on public.business_inquiries to service_role;

create or replace function public.submit_business_inquiry(
  p_company_name text,
  p_hq_city text,
  p_company_size integer,
  p_participants integer,
  p_contact_name text,
  p_contact_role text,
  p_email text,
  p_phone text,
  p_goal text,
  p_formats text[],
  p_locations text[],
  p_timing text,
  p_budget text,
  p_privacy_consent boolean
)
returns public.business_inquiries
language plpgsql security definer
set search_path = ''
as $$
declare
  v_i public.business_inquiries;
begin
  perform public._require_service_role();
  if not coalesce(p_privacy_consent, false) then
    raise exception 'Az adatkezelési tájékoztató elfogadása kötelező.' using errcode = 'P0001', hint = 'PRIVACY_CONSENT_REQUIRED';
  end if;
  insert into public.business_inquiries (
    company_name, hq_city, company_size, participants, contact_name, contact_role, email, phone,
    goal, formats, locations, timing, budget, privacy_consent_at
  ) values (
    btrim(p_company_name), btrim(p_hq_city), p_company_size, p_participants, btrim(p_contact_name),
    nullif(btrim(p_contact_role), ''), lower(btrim(p_email)), nullif(btrim(p_phone), ''),
    btrim(p_goal), p_formats, p_locations, p_timing, nullif(p_budget, ''), now()
  )
  returning * into v_i;
  insert into public.admin_notifications (kind, payload)
  values ('business_inquiry', jsonb_build_object('inquiry_id', v_i.id, 'company', v_i.company_name));
  return v_i;
end;
$$;

-- 1 év után automatikus törlés.
create or replace function public.purge_old_business_inquiries()
returns integer
language sql security definer
set search_path = ''
as $$
  with del as (
    delete from public.business_inquiries where created_at < now() - interval '1 year' returning 1
  )
  select count(*)::integer from del
$$;
select cron.schedule('purge-old-business-inquiries', '53 3 * * *', $$select public.purge_old_business_inquiries()$$);

revoke execute on function public.submit_business_inquiry(text, text, integer, integer, text, text, text, text, text, text[], text[], text, text, boolean) from public, anon, authenticated;
revoke execute on function public.purge_old_business_inquiries() from public, anon, authenticated;
grant execute on function public.submit_business_inquiry(text, text, integer, integer, text, text, text, text, text, text[], text[], text, text, boolean) to service_role;
grant execute on function public.purge_old_business_inquiries() to service_role;
