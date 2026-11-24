-- =============================================================================
-- 003_scheduled_jobs.sql — adatbázison belüli ütemezett feladatok (pg_cron)
-- A pg_cron UTC-ben fut. A telefonszám-törlésnél ez nem számít (napi egyszer,
-- a 180 napos határ biztonsággal tartható). A Budapest-időhöz kötött feladatok
-- (havi keret-nullázás, pénteki körkérdés) a Vercel Cronon futnak (2. fázis).
-- =============================================================================
create extension if not exists pg_cron with schema pg_catalog;

-- Naponta 02:17 UTC: 180 napnál régebbi címzett-telefonszámok törlése.
select cron.schedule(
  'purge-kind-message-phones',
  '17 2 * * *',
  $$select public.purge_kind_message_phones()$$
);
