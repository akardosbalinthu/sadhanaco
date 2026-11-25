# Élesítés — akardosbalint.hu + tarsasag.akardosbalint.hu

Vercel: csapat `akardosbalint1`, projekt **`akardosbalint`** (`prj_0zrZ01CMABrSU2OGOAcJcOO4Zsnw`),
függvényrégió `dub1` (Dublin — a Supabase `eu-west-1` mellett).

## 0. Előnézet (ideiglenes)

Amíg a kód nincs a GitHubon, az oldal közvetlen (Git nélküli) Vercel-telepítéssel látható:
**https://akardosbalint-akardosbalint1.vercel.app** (a Társaság: `/tarsasag`). A `*.vercel.app` címeket a
Vercel Deployment Protection védi: csak bejelentkezett csapattag látja.

Ehhez ideiglenesen: `NEXT_PUBLIC_SITE_URL=https://akardosbalint-akardosbalint1.vercel.app` és
`NEXT_PUBLIC_TARSASAG_URL=https://akardosbalint-akardosbalint1.vercel.app/tarsasag` (production).
**Élesítéskor vissza kell állítani:** `https://akardosbalint.hu` és `https://tarsasag.akardosbalint.hu`.

## 1. DNS (a domain szolgáltatójánál) — csak hozzáadás, a Zoho MX-rekordokhoz nem nyúlunk

| Típus | Név | Érték |
| --- | --- | --- |
| TXT | `_vercel` | `vc-domain-verify=akardosbalint.hu,1c4bfb576e43a6181193` |
| TXT | `_vercel` | `vc-domain-verify=tarsasag.akardosbalint.hu,0adccac7c57545a40674` |
| TXT | `_vercel` | `vc-domain-verify=www.akardosbalint.hu,5608bd3b49c746226f06` |
| A | `@` | `216.198.79.1` (ha még nincs) |
| CNAME | `tarsasag` | a Vercel által a domain beállításainál kiírt cél |
| CNAME | `www` | a Vercel által a domain beállításainál kiírt cél |

A `www` 308-cal átirányít az `akardosbalint.hu`-ra.

## 2. Git-kapcsolat

A Vercel-fiókhoz még nincs GitHub Login Connection, ezért a projekt Git nélkül jött létre.
Vercel → Account Settings → Authentication → GitHub, majd a projektben Settings → Git →
`akardosbalinthu/sadhanaco`. (A kód feltöltéséhez a Claude GitHub App is kell a repón.)

## 3. Környezeti változók

Már beállítva: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TARSASAG_URL`, `ONLINE_PAYMENTS_ENABLED=false`,
`RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publikus),
`RESEND_API_KEY` (csak küldés, csak az akardosbalint.hu domainről), `INTERNAL_API_SECRET`, `CRON_SECRET`.

Hiányzik (titkok — ezeket semmilyen integráción keresztül nem lehet kiolvasni, a Vercel felületén add meg):
`SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API keys → secret / service_role),
`STRIPE_SECRET_KEY` (Stripe → Developers → API keys). `STRIPE_WEBHOOK_SECRET` a 2. fázisban,
a webhook-végpont létrehozásakor keletkezik.
Opcionális: `NEXT_PUBLIC_PODCAST_SPOTIFY_URL`, `NEXT_PUBLIC_PODCAST_APPLE_URL`.

## 4. Supabase (éles: `kqvxosoqmwscymaoqhyj`)

**Kész (2026-11-24, Bálint jóváhagyásával):** mind a 6 migráció és a seed (4 lépcső, 16 ár) fent van;
28 tábla, mindegyiken ENABLE + FORCE RLS és legalább egy policy; a pg_cron két feladata ütemezve.
Az 5. migrációt (`20261124150000_kind_messages_xp_compass`) Bálint az SQL Editorban futtatta, a
migrációs előzménybe utólag bejegyezve. A 6. (`20261124170000_leaderboard`) az MCP-n keresztül ment fel; a verziószámát az előzményben a helyi fájlhoz igazítottuk, hogy a sorrend (005 → 006) megmaradjon. A helyi migrációs fájlnevek az éles verziószámokat viselik,
így a későbbi `supabase db push` csak az újakat viszi fel. A Supabase biztonsági tanácsadó csak a
szándékosan a kliensnek engedett RPC-ket jelzi (mindegyik saját jogosultság-ellenőrzéssel).

Hátralévő (Supabase Dashboard):

3. Auth → URL Configuration: Site URL `https://tarsasag.akardosbalint.hu`, Redirect URL
   `https://tarsasag.akardosbalint.hu/auth/confirm`
4. Auth → Emails → SMTP: Resend (`smtp.resend.com`, feladó `balint@akardosbalint.hu`);
   a Magic Link sablon: `supabase/templates/magic_link.html`
5. Database → Extensions: `pg_cron` (a 003-as migráció ütemezi a feladatokat)
6. **Superadmin beállítása** (SQL Editor, egyszer — a cím személyes adat, ezért nincs a migrációban):
   `update public.app_settings set superadmin_emails = array['<a te e-mail-címed>'];`
   Ha a fiók már létezik: `update public.profiles set role = 'superadmin' where email = '<cím>';`

## 5. Stripe — a fizetés élesítése

A kód kész és tesztelt (`npm run test:webhook` — 8 életút a helyi adatbázison). Élesítés sorrendben:

1. **Titkos kulcsok a Vercelben** (akardosbalint projekt → Settings → Environment Variables, Production):
   `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`.
2. **Saját domain** (1. pont): a `*.vercel.app` címeket a Vercel bejelentkezéssel védi, ezért a Stripe nem
   tudja elérni a webhookot. Domain nélkül: Vercel → Settings → Deployment Protection → kivétel a
   `/api/webhooks/stripe` útvonalra (vagy Protection Bypass).
3. **Webhook-végpont a Stripe-ban** (Developers → Webhooks → Add endpoint):
   URL `https://akardosbalint.hu/api/webhooks/stripe`, események:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`,
   `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`,
   `charge.dispute.created`. A kapott aláíró kulcs → Vercel: `STRIPE_WEBHOOK_SECRET`.
4. **Ügyfélportál** (Settings → Billing → Customer portal): lemondás „a számlázási időszak végén”,
   kártyacsere engedélyezve, csomagváltás a négy tagsági ár között, arányosítás azonnali számlázással
   („Prorate and invoice immediately”). Visszatérítés kikapcsolva.
5. **Sikertelen terhelés**: lásd `docs/stripe-katalogus.md` (10 nap, 5 újrapróbálkozás, utána lemondás).
6. **Bekapcsolás**: Vercel → `ONLINE_PAYMENTS_ENABLED=true`, majd új telepítés. Ettől kezdve a csatlakozás
   gombok a fizetésre visznek (addig értesítéskérő e-mailt nyitnak).

Megjegyzés: a Stripe-fiók **éles módban** van — a próbavásárlás valódi terhelés. Az első vásárlás után a
tagság az adminban lezárható.

## 5b. Stripe — egyéb



Sikertelen terhelés: lásd `docs/stripe-katalogus.md`. Webhook-végpont: 2. fázis.

## 6. Bunny Stream — a leckék hang- és videóanyagai

1. A bunny.net felületén hozz létre egy **Stream Library**-t (régió: Európa).
2. A könyvtár *Security* beállításainál kapcsold be az **Embed view token authentication**-t,
   és az **Allowed referrers** közé vedd fel: `tarsasag.akardosbalint.hu`, `akardosbalint.hu`.
3. A Vercel környezeti változói közé:
   - `BUNNY_STREAM_LIBRARY_ID` — a könyvtár azonosítója (szám),
   - `BUNNY_TOKEN_AUTH_KEY` — a *Token Authentication Key* a Security oldalról.
4. A hanganyagokat is ide töltsd fel videóként (MP4, egy nyugodt állóképpel) — egy lejátszó kezel mindent.
5. A feltöltött videó azonosítóját (Video GUID) az admin **Tananyag** oldalán, a leckénél a
   „Bunny videó-azonosító” mezőbe írd. A tagok 3 óráig érvényes, aláírt linket kapnak.

## 7. LiveKit — élő alkalmak (közös meditáció, Q&A) a Társaság felületén

1. Regisztrálj a **LiveKit Cloud**-on (cloud.livekit.io), és hozz létre egy projektet (régió: **EU**).
2. A projekt *Settings → Keys* oldalán hozz létre egy API-kulcsot.
3. A Vercel környezeti változói közé (Production; a kulcsot és a titkot **Sensitive**-ként):
   - `LIVEKIT_URL` — a projekt WebSocket-címe (`wss://<projekt>.livekit.cloud`),
   - `LIVEKIT_API_KEY` — az API key,
   - `LIVEKIT_API_SECRET` — az API secret.
4. Mentés után indíts új élesítést (Redeploy), hogy a változók életbe lépjenek.
5. Az adminban hozz létre egy eseményt „Online” jelöléssel (pl. heti közös meditáció). Az esemény
   részleteinél a **Belépés házigazdaként** gombbal bármikor beléphetsz hangpróbára; a tagoknak a
   kezdés előtt 15 perccel nyílik. A belépés jelenlétnek számít (XP).
6. Felvétel: az alkalom után töltsd fel a felvételt a Bunny Streamre, és az esemény részleteinél
   írd be a videó-azonosítót — a tagok az Események oldal „Felvételek” részén érik el.

## 8. Értesítő levelek

Minden új közzétett eseményről, admin-bejegyzésről és túra-szavazásról levél megy a tagoknak
(tételenként egyszer). A tag az Adataim oldalon vagy a levél alján lévő linkkel leiratkozhat.
A Resend ingyenes csomagja napi 100 levelet enged — ha a taglétszám ennél nagyobb, válts fizetős csomagra.

