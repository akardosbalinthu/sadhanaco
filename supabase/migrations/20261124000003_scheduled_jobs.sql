-- =============================================================================
-- 003_scheduled_jobs.sql — adatbázison belüli ütemezett feladatok (pg_cron)
-- A pg_cron UTC-ben fut. A Budapest-időhöz kötött feladatokat (hó 1-jei
-- keret-visszaállítás, pénteki kör) ezért óránként hívott, a helyi időt maga
-- ellenőrző, idempotens függvény végzi: így a nyári/téli időszámítás-váltás
-- nem okoz kimaradást vagy dupla futást.
-- =============================================================================
create extension if not exists pg_cron with schema pg_catalog;

-- Naponta 02:17 UTC: 180 napnál régebbi címzett-telefonszámok törlése.
select cron.schedule(
  'purge-kind-message-phones',
  '17 2 * * *',
  $$select public.purge_kind_message_phones()$$
);

-- Óránként: havi keret-visszaállítás, pénteki kör, bevételi figyelmeztetés.
select cron.schedule(
  'run-scheduled-tasks',
  '7 * * * *',
  $$select public.run_scheduled_tasks()$$
);
