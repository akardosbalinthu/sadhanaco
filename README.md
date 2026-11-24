# Sadhana Idegrendszerfejlesztő Társaság

Next.js 15 (App Router, TypeScript strict) + Supabase webalkalmazás — **egy app, két felület**:

- `akardosbalint.hu` — fő weboldal (`src/app/(site)`): bemutatkozás, Nyílt Estek nyilvános jelentkezéssel, podcast, impresszum
- `tarsasag.akardosbalint.hu` — Sadhana Társaság (`src/app/tarsasag`); a middleware az aldomain kéréseit a `/tarsasag` útvonalakra írja át. Helyben: http://localhost:3000/tarsasag
A kötelező érvényű specifikáció: [`CLAUDE.md`](./CLAUDE.md) (a 7. pont felülír mindent).

## Helyi fejlesztés

Előfeltétel: Node 20+, Docker.

```bash
npm install
npm run db:start      # helyi Supabase (Edge Runtime nélkül — nem használjuk)
npx supabase status   # innen másold a kulcsokat
cp .env.example .env.local   # és töltsd ki
npm run db:reset      # migrációk + seed újrafuttatása
npm run db:test       # pgTAP tesztek (RLS, próbaidő, keretek, párhuzamosság)
npm run db:types      # TypeScript típusok generálása a sémából
npm run dev
```

- Helyi levelek (Magic Link): http://127.0.0.1:54324 (Mailpit)
- Supabase Studio: http://127.0.0.1:54323

## Szerkezet

| Hely | Tartalom |
| --- | --- |
| `supabase/migrations/…001_initial_schema.sql` | táblák, típusok, segédfüggvények, ENABLE + FORCE RLS, oszlopszintű jogok |
| `supabase/migrations/…002_rpc_functions.sql` | SECURITY DEFINER RPC-k: `book_event`, `send_free_kind_message`, `book_free_consultation`, `kata_revenue_status`, `admin_record_storno`, `community_authors`, `post_feed` nézet |
| `supabase/seed.sql` | 4 lépcsős tananyag-ív, árkonstansok (`price_catalog`) |
| `supabase/tests/database/` | pgTAP tesztek |
| `src/lib/supabase/` | szerver-, böngésző- és admin kliens, middleware |
| `src/app/belepes`, `src/app/auth/*` | Magic Link belépés |

Az RPC-k hibáit a felület a `hint` mező gépi kódja alapján kezeli
(pl. `TRIAL_NOT_ALLOWED`, `PRIORITY_WINDOW`, `EVENT_FULL`, `QUOTA_EXHAUSTED`).

## Éles környezet

Az éles Supabase projektre (`kqvxosoqmwscymaoqhyj`) migrációt **csak Bálint jóváhagyásával** alkalmazunk.
