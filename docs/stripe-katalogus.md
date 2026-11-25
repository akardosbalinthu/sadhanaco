# Stripe-katalógus (éles mód, `akardosbalint.hu` fiók)

Létrehozva: 2026-11-24. Minden termék metaadata: `app=sadhana_tarsasag`, `code=…`.
Az árakat a kód **`lookup_key`** alapján keresi (= `price_catalog.code`), így árváltozáskor
új árat kell létrehozni ugyanazzal a `lookup_key`-jel (`transfer_lookup_key: true`), kódmódosítás nélkül.
A Stripe-ban a HUF kéttizedes: `unit_amount 994000` = 9 940 Ft.

| Termék | Product ID | lookup_key | Ár |
| --- | --- | --- | --- |
| A Társaság Tagja | `prod_VgbrLOKdZgQqyM` | `tarsasagi_havi` | 9 940 Ft / hó (7 napos próba a checkoutnál) |
| | | `tarsasagi_eves` | 99 400 Ft / év |
| A Belső Kör Tagja | `prod_VgbtwmiPVKTIme` | `belso_kor_havi` | 27 940 Ft / hó |
| | | `belso_kor_eves` | 279 400 Ft / év |
| II. Modul + IP 2 (gyorsított) | `prod_VgbwbICFQliZfC` | `gyorsitott_m2_ip2` | 54 940 Ft |
| IP 3 (gyorsított) | `prod_VgbwI6pIJhOfRS` | `gyorsitott_ip3` | 44 940 Ft |
| II. Modul + IP 2 + IP 3 csomag | `prod_VgbwymkGkEr3BR` | `gyorsitott_m2_ip3_csomag` | 89 940 Ft |
| Nyílt Meditációs Est | `prod_VgbwHLurwdeqiB` | `nyilt_est_tarsasagi` | 3 200 Ft (Társasági Tag) |
| | | `nyilt_est_kulsos` | 4 940 Ft (külsős, bejelentkezés nélkül a weboldalon) |
| Élő Gyakorlónap | `prod_VgbwzJ9WLwj3sm` | `gyakorlonap_tarsasagi` | 6 460 Ft |
| 1-on-1 konzultáció | `prod_VgbwTM5LbEZbJp` | `konzultacio_tarsasagi` | 15 000 Ft |
| | | `konzultacio_belso_kor` | 13 000 Ft |
| Kedves Üzenet (kereten felüli) | `prod_VgbwF1NbmherdR` | `kedves_uzenet_extra` | szabad összeg, min. 1 000 Ft (javasolt: 3 000 Ft) |
| Szabadság Elvonulás (önköltség) | `prod_VgbwyB3bE8BEvE` | — | eseményenként `price_data`-val |

Minden díj **szolgáltatási díj** (alanyi adómentes, AAM számlával) — adomány nincs.
Alapítói kupon nincs. A próbaidő nem az áron, hanem a checkout-munkameneten
(`subscription_data.trial_period_days = 7`) állítódik be, csak a `tarsasagi_havi` árhoz.

A díjmentes tételek (Belső Kör: Nyílt Est, Gyakorlónap, Elvonulás) nem mennek át a Stripe-on.
A fiókban lévő korábbi termékekhez (pl. „Elsőbbségi Kedves Üzenet”, „IMI Tréning”) nem nyúltunk.

## Takarítás (2026-11-24)

A fiók nem Társasági termékei a Stripe-ban nem törölhetők véglegesen (áraik vannak), ezért archiválva lettek:
IMI Tréning 1. Jelenlét modul, Csoportos Integrációs Program 1, Egyéni IP 1 – Kiegészítő csomag,
Személyes Kalibráció. Bálint döntése alapján **megmaradt**: Okoskonyha Alaptagság (aktív előfizetők)
és Elsőbbségi Kedves Üzenet (élő fizetési link). Az archivált termékek a Dashboardon visszaállíthatók.

## Sikertelen terhelés — Dashboard-beállítás (Billing → Revenue recovery → Retries)

Döntés: sikertelen megújításkor azonnali e-mail a tagnak, a hozzáférés **10 napig** megmarad, ezalatt
összesen 5 újrapróbálkozás, utána megszűnik. A Stripe pontosan ezt nem tudja: az egyéni ütemezés
legfeljebb 3 újrapróbálkozást enged, a Smart Retries pedig 1 / 2 / 3 hetes vagy 1 / 2 hónapos ablakot.
Javasolt beállítás:

- **Smart Retries: 5 újrapróbálkozás, 2 hetes ablak**
- **Ha minden újrapróbálkozás sikertelen: Cancel the subscription**

A 10 napos határt az adatbázis tartja be (`app_settings.past_due_grace_days = 10`): a 10. nap után a
hozzáférés szünetel. Ha egy későbbi újrapróbálkozás (10–14. nap) mégis sikerül, a hozzáférés automatikusan
visszaáll, a haladás megmarad. A tagság (és vele a 7.4 szerinti „elölről kezdés”) csak akkor szűnik meg,
amikor a Stripe lezárja az előfizetést.

## Webhook és ügyfélportál (2026-11-25)

- **Webhook-végpont:** `we_1UfUsSKKK49wrBvLak7FSM3z` → `https://tarsasag.akardosbalint.hu/api/webhooks/stripe`,
  API-verzió `2026-11-18.endive`, 7 esemény (lásd `docs/telepites.md` 5. pont). Aláíró kulcs: Vercel `STRIPE_WEBHOOK_SECRET`.
- **Ügyfélportál:** `bpc_1UfUzUKKK49wrBvLHCRNpz8n` („A Társaság — tagság”), Vercel `STRIPE_PORTAL_CONFIGURATION_ID`.
  Kártyacsere; lemondás a számlázási időszak végén, visszatérítés nélkül, okkal; váltás a négy tagsági ár között —
  felfelé azonnal, időarányos számlával (`always_invoice`), lefelé és rövidebb időszakra a következő időszaktól;
  próbaidő alatti váltásnál a próba véget ér; mennyiség nem módosítható; számlatörténet és ügyféladat-módosítás
  kikapcsolva (a hivatalos számla a kézi AAM-számla, a belépési azonosító az e-mail-cím).
  A fiók első portál-beállításaként a Stripe alapértelmezettnek jelölte; más előfizetésnél csak kártyacsere és lemondás érhető el.
- A két tagsági termék neve 2026-11-25-én a 7.16 szerinti csomagnevekre változott (a Checkout és a portál ezt mutatja).
