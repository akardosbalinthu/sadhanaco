# Az Idegrendszeri Iránytű — modell és kérdőív

Önismereti eszköz, **nem pszichológiai diagnózis**. Azt mutatja meg, milyen természetes
hangolásból indul valaki A Társaságban. A rend végleges (CLAUDE.md 7.13); csak a superadmin
javíthatja hiba esetén (`superadmin_set_order`).

## A modell

A négy rend ugyanannak a négy kérdésnek négy tipikus válasza. Mindegyik kérdés a CLAUDE.md
1. pontjában rögzített módszertani alapokra épül:

| Dimenzió | Háttér | Mit kérdezünk |
| --- | --- | --- |
| Stresszválasz | polyvagális elmélet (Porges): mobilizáció, visszahúzódás/befagyás, megnyugtatás-keresés, megfeszülés | mi történik benned először feszült helyzetben |
| Interocepció | a testi jelzések érzékelése (Craig), szenzoros feldolgozási érzékenység (Aron) | hogyan és mikor veszed észre a tested jelzéseit |
| Elkalandozó elme | Default Mode Network (Raichle): miről szól a „háttérzaj” | mivel foglalkozik a figyelmed, ha elkalandozik |
| Szabályozás | ko-reguláció, struktúra, ingercsökkentés, mozgás; a tolerancia­ablak (Siegel) | mi tölt vissza, mi merít ki, mit vársz a gyakorlástól |
| Légzés | légzésmintázat stresszben; rezonancia-légzés és HRV (Lehrer) | mi történik a légzéseddel, amikor feszült vagy |

### A négy rend profilja

| | Tündék | Kertőrzők | Törpök | Vándorok |
| --- | --- | --- | --- | --- |
| Alapgondolat | finom érzékelés és tudatosság | jelenlét és belső béke | állhatatosság és belső rend | bátorság és fókusz |
| Stresszben jellemző | elárasztottság → visszahúzódás | csitítás, alkalmazkodás (akár a saját igények rovására) | megfeszülés, kontroll, tervezés | felpörgés, cselekvés, „harc vagy menekülés” |
| Interocepció | nagyon finom, néha túl sok | a megszokott ritmus megbillenésekor figyel fel | feszülésként, későn | menet közben alig, megálláskor |
| Elkalandozó elme | hangulatok, árnyalatok, mások érzései | a hozzá közel állók igényei | teendők, tervek, hiányok | lehetőségek, „mi lenne, ha…” |
| Mi tölt vissza | csend, kevés inger, egyedüllét | meleg, ismerős közeg, kapcsolódás | rend, lezárás, kiszámíthatóság | mozgás, kint lenni, újdonság |
| Erősség | belső érzékelés, empátia | biztonságot sugárzó jelenlét (ko-reguláció) | kitartás, szerkezet | kezdeményezés, fókusz nyomás alatt |
| Amit az úton tanul | határok, földelés, hosszabb kilégzés | kilépni a megszokottból, nemet mondani | elengedni a kontrollt, pihenni | lelassulni, megérkezni |
| Kedvelt gyakorlat | Kájánupassaná (testpásztázás) | Sama Vritti (egyenletes légzés) | Nadi Shodhana (váltott orrlyukas légzés) | Anapanaszati (a légzés követése) |

## Pontozás

- 12 kérdés, mindegyikben 4 válasz; minden válasz pontosan egy rendhez tartozik.
- Az 1. (stresszválasz) és a 2. (visszatöltődés) kérdés **súlya 2**, mert ezek mutatják a
  legközvetlenebbül az idegrendszer alaphangolását. A többi kérdés súlya 1. Rendenként legfeljebb 14 pont.
- A pontozás **szerveroldalon** történik (`submit_compass`); a kliens nem látja, melyik válasz
  melyik rendhez tartozik (`compass_questionnaire` rend nélkül adja ki a kérdéseket), így nem
  lehet „célra tölteni”. A válaszlehetőségek sorrendjét a felület keveri.
- **Holtverseny** esetén (`COMPASS_TIE`, a holtversenyben lévő rendek a hiba DETAIL mezőjében)
  a felület egy döntő kérdést mutat, csak a holtversenyben lévő rendek válaszaival:

  > *Ha egyetlen dolgot vihetnél magaddal az útra, mi lenne az?*
  > — Tündék: *finomabb érzékelés* · Kertőrzők: *mélyebb béke* · Törpök: *szilárdabb belső rend* · Vándorok: *több bátorság*

- A válaszok és a pontszámok a profilban tárolódnak (`compass_answers`, `compass_scores`) —
  csak a tag maga és az admin látja.

## A kérdések

A pontos szöveg és a válasz–rend hozzárendelés a `20261124150000_kind_messages_xp_compass.sql`
migrációban (`compass_questions`). Szerkeszteni a superadmin tudja.

| # | Kérdés | Dimenzió | Súly |
| --- | --- | --- | --- |
| 1 | Váratlan, feszült helyzetbe kerülsz… Mi történik benned először? | stresszválasz | 2 |
| 2 | Egy megterhelő nap után mi tölt vissza a leginkább? | szabályozás | 2 |
| 3 | Hogyan érzékeled hétköznap a tested jelzéseit? | interocepció | 1 |
| 4 | Mi történik a légzéseddel, amikor feszült vagy? | légzés | 1 |
| 5 | Amikor a figyelmed elkalandozik, mivel foglalkozik? | elkalandozó elme | 1 |
| 6 | Egy közösségben te jellemzően… | társas idegrendszer | 1 |
| 7 | Hogyan viszonyulsz az újhoz és a megszokotthoz? | újdonság / ritmus | 1 |
| 8 | Mi merít ki a leginkább? | terhelés | 1 |
| 9 | Mit szeretnél a leginkább a gyakorlástól? | növekedési irány | 1 |
| 10 | Ha egy gyakorlás aznap nem megy, mit teszel? | megküzdés | 1 |
| 11 | Milyen az energiád egy átlagos napon? | energia-ritmus | 1 |
| 12 | Mit mondanak rólad a hozzád közel állók? | külső tükör | 1 |

## A felületen kötelező szöveg

> Az Iránytű önismereti eszköz, nem pszichológiai vizsgálat vagy diagnózis. Nincs jó vagy rossz
> eredmény: minden rend egyenrangú, és minden rend mindent gyakorol — csak a kiindulópont más.
> A rended végleges.
