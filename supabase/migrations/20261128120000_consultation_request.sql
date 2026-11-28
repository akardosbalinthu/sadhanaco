-- =============================================================================
-- 026 — Rövid konzultációkérés (2026. november 28., Acélidegek Mentorprogram)
--   * A weboldal fő gombja („Foglalj konzultációt”) egy rövid űrlapra visz:
--     név, e-mail, telefonszám és egy kérdés („Mi az, amin a legjobban
--     szeretnél változtatni?”). Utána a meglévő foglalóban időpontot választ.
--   * A jelentkezések táblájában ez a 3. változat: nincs kérdőív, mindig foglalhat.
--   * A 15 kérdéses kérdőív (2. változat) változatlanul megmarad.
-- =============================================================================

alter table public.applications drop constraint applications_questionnaire_version_check;
alter table public.applications
  add constraint applications_questionnaire_version_check check (questionnaire_version in (1, 2, 3));

alter table public.applications drop constraint applications_version_complete;
alter table public.applications add constraint applications_version_complete check (
  (questionnaire_version = 1 and pillars is not null and problem is not null and start_when is not null)
  or (questionnaire_version = 2 and answers is not null and start_score is not null)
  or (questionnaire_version = 3 and problem is not null and phone is not null)
);

-- A rövid konzultációkérés mindig foglalhat időpontot.
alter table public.applications drop column qualified;
alter table public.applications
  add column qualified boolean generated always as (
    questionnaire_version = 3 or coalesce(start_when = 'azonnal', false) or coalesce(start_score, 0) >= 8
  ) stored;

create or replace function public.submit_consultation_request(
  p_full_name text,
  p_email text,
  p_phone text,
  p_problem text,
  p_consent boolean
)
returns public.applications
language plpgsql security definer
set search_path = ''
as $$
declare
  v_a public.applications;
  v_version text;
begin
  perform public._require_service_role();
  if not coalesce(p_consent, false) then
    raise exception 'Az adatkezelési hozzájárulás kötelező.' using errcode = 'P0001', hint = 'CONSENT_REQUIRED';
  end if;
  if char_length(btrim(coalesce(p_phone, ''))) < 6 then
    raise exception 'Add meg a telefonszámodat.' using errcode = 'P0001', hint = 'PHONE_REQUIRED';
  end if;
  if char_length(btrim(coalesce(p_problem, ''))) < 3 then
    raise exception 'Írd le röviden, min szeretnél változtatni.' using errcode = 'P0001', hint = 'PROBLEM_REQUIRED';
  end if;
  select health_consent_version into v_version from public.app_settings where id;

  -- A szabad szöveges válaszban egészségi adat is lehet, ezért a hozzájárulás
  -- (GDPR 9. cikk (2) a)) ugyanazzal a jelölőnégyzettel, időbélyeggel rögzül.
  insert into public.applications (
    questionnaire_version, full_name, email, phone, problem,
    health_consent_at, health_consent_version, privacy_consent_at
  ) values (
    3, btrim(p_full_name), lower(btrim(p_email)), btrim(p_phone), btrim(p_problem),
    now(), v_version, now()
  )
  returning * into v_a;

  insert into public.admin_notifications (kind, payload)
  values ('application', jsonb_build_object('application_id', v_a.id, 'qualified', v_a.qualified, 'short', true));
  return v_a;
end;
$$;

revoke execute on function public.submit_consultation_request(text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.submit_consultation_request(text, text, text, text, boolean) to service_role;
