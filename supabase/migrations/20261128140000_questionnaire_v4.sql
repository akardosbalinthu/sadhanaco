-- =============================================================================
-- 027 — Kérdőív 4. változat (2026. november 28., Acélidegek Mentorprogram)
--   * A jelentkezés újra a kérdőívvel indul (a 3. változatú rövid űrlap helyett).
--   * 14 kérdés, 1–10-es skála: megnyugvás, alvás, kikapcsolás, reakciók,
--     figyelem, döntés nyomás alatt + szándék. A 14. kérdés a kezdés (8–10: foglalhat).
--   * Kötelező: telefonszám és a „Mi az, amin a legjobban szeretnél változtatni?” válasz.
--   * A korábbi (1–3. változatú) jelentkezések változatlanok.
-- =============================================================================

alter table public.applications drop constraint applications_questionnaire_version_check;
alter table public.applications
  add constraint applications_questionnaire_version_check check (questionnaire_version in (1, 2, 3, 4));

alter table public.applications drop constraint applications_version_complete;
alter table public.applications add constraint applications_version_complete check (
  (questionnaire_version = 1 and pillars is not null and problem is not null and start_when is not null)
  or (questionnaire_version = 2 and answers is not null and start_score is not null)
  or (questionnaire_version = 3 and problem is not null and phone is not null)
  or (questionnaire_version = 4 and answers is not null and start_score is not null and problem is not null and phone is not null)
);

create or replace function public.submit_application_v4(
  p_full_name text,
  p_email text,
  p_phone text,
  p_answers jsonb,
  p_problem text,
  p_health_consent boolean,
  p_privacy_consent boolean
)
returns public.applications
language plpgsql security definer
set search_path = ''
as $$
declare
  v_a public.applications;
  v_version text;
  v_i integer;
  v_v jsonb;
begin
  perform public._require_service_role();
  if not coalesce(p_health_consent, false) then
    raise exception 'Az egészségügyi adatok kezeléséhez kifejezett hozzájárulás kell.' using errcode = 'P0001', hint = 'HEALTH_CONSENT_REQUIRED';
  end if;
  if not coalesce(p_privacy_consent, false) then
    raise exception 'Az adatkezelési tájékoztató elfogadása kötelező.' using errcode = 'P0001', hint = 'PRIVACY_CONSENT_REQUIRED';
  end if;
  if char_length(btrim(coalesce(p_phone, ''))) < 6 then
    raise exception 'Add meg a telefonszámodat.' using errcode = 'P0001', hint = 'PHONE_REQUIRED';
  end if;
  if char_length(btrim(coalesce(p_problem, ''))) < 3 then
    raise exception 'Írd le röviden, min szeretnél változtatni.' using errcode = 'P0001', hint = 'PROBLEM_REQUIRED';
  end if;
  if jsonb_typeof(p_answers) <> 'object' or (select count(*) from jsonb_object_keys(p_answers)) <> 14 then
    raise exception 'Hiányos kérdőív.' using errcode = 'P0001', hint = 'INVALID_ANSWERS';
  end if;
  for v_i in 1..14 loop
    v_v := p_answers -> ('q' || v_i);
    if v_v is null or jsonb_typeof(v_v) <> 'number' or (v_v::text)::numeric not between 1 and 10
       or (v_v::text)::numeric <> trunc((v_v::text)::numeric) then
      raise exception 'Hiányos kérdőív.' using errcode = 'P0001', hint = 'INVALID_ANSWERS';
    end if;
  end loop;
  select health_consent_version into v_version from public.app_settings where id;

  insert into public.applications (
    questionnaire_version, full_name, email, phone, answers, start_score, problem,
    health_consent_at, health_consent_version, privacy_consent_at
  ) values (
    4, btrim(p_full_name), lower(btrim(p_email)), btrim(p_phone), p_answers,
    (p_answers ->> 'q14')::smallint, btrim(p_problem),
    now(), v_version, now()
  )
  returning * into v_a;

  insert into public.admin_notifications (kind, payload)
  values ('application', jsonb_build_object('application_id', v_a.id, 'qualified', v_a.qualified));
  return v_a;
end;
$$;

revoke execute on function public.submit_application_v4(text, text, text, jsonb, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.submit_application_v4(text, text, text, jsonb, text, boolean, boolean) to service_role;
