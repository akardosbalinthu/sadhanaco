-- =============================================================================
-- 013 — Telefonszám és biztonsági (egészségi) megjegyzés minden jelentkezésnél
--
-- • event_registrations: phone, safety_note, health_consent_at (kifejezett hozzájárulás,
--   GDPR 9. cikk (2) a)), details_purged_at.
-- • set_registration_details: a jelentkezés után rögzíti az adatokat. Tag csak a saját
--   jelentkezéséhez írhat; a külsős foglalásokhoz (Nyílt Est, túravendég) a szerver.
--   A megjegyzés csak hozzájárulással tárolható.
-- • purge_registration_details: az esemény után 30 nappal a telefonszám és a megjegyzés
--   törlődik (napi ütemezés). A jelentkezés maga megmarad.
-- • Láthatóság: a meglévő RLS szerint csak a jelentkező maga és az admin.
-- =============================================================================

alter table public.event_registrations
  add column phone             text check (char_length(phone) between 6 and 30),
  add column safety_note       text check (char_length(safety_note) <= 1000),
  add column health_consent_at timestamptz,
  add column details_purged_at timestamptz,
  add constraint event_registrations_note_needs_consent check (safety_note is null or health_consent_at is not null);

create or replace function public.set_registration_details(
  p_registration_id uuid,
  p_phone           text,
  p_safety_note     text,
  p_consent         boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg public.event_registrations;
  v_phone text := nullif(btrim(p_phone), '');
  v_note  text := nullif(btrim(p_safety_note), '');
begin
  select * into v_reg from public.event_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'A jelentkezés nem található.' using errcode = 'P0001', hint = 'REGISTRATION_NOT_FOUND';
  end if;
  if coalesce(auth.role(), '') <> 'service_role' and v_reg.user_id is distinct from auth.uid() then
    raise exception 'A jelentkezés nem található.' using errcode = 'P0001', hint = 'REGISTRATION_NOT_FOUND';
  end if;
  if v_phone is null or v_phone !~ '^\+?[0-9 ()/-]{6,30}$' then
    raise exception 'Adj meg egy érvényes telefonszámot.' using errcode = 'P0001', hint = 'INVALID_PHONE';
  end if;
  if v_note is null then
    raise exception 'Kérlek, válaszolj a biztonsági kérdésre (a „Nincs” is jó válasz).' using errcode = 'P0001', hint = 'NOTE_REQUIRED';
  end if;
  if not coalesce(p_consent, false) then
    raise exception 'A biztonsági információ kezeléséhez hozzájárulás szükséges.' using errcode = 'P0001', hint = 'CONSENT_REQUIRED';
  end if;
  update public.event_registrations
     set phone = v_phone, safety_note = left(v_note, 1000), health_consent_at = now(), details_purged_at = null
   where id = v_reg.id;
end;
$$;

create or replace function public.purge_registration_details()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.event_registrations r
     set phone = null, safety_note = null, details_purged_at = now()
    from public.events e
   where e.id = r.event_id
     and e.starts_at < now() - interval '30 days'
     and (r.phone is not null or r.safety_note is not null);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

select cron.schedule('purge-registration-details', '41 3 * * *', $$select public.purge_registration_details()$$);

revoke execute on function public.set_registration_details(uuid, text, text, boolean) from public, anon;
grant execute on function public.set_registration_details(uuid, text, text, boolean) to authenticated, service_role;
revoke execute on function public.purge_registration_details() from public, anon, authenticated;
grant execute on function public.purge_registration_details() to service_role;
