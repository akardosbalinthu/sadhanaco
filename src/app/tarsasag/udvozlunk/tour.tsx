"use client";

import { useState } from "react";
import { Compass, Heart, Leaf, Sparkles, Users } from "lucide-react";
import { buttonPrimary, buttonSecondary, GildedCard } from "@/components/ornaments";
import { finishOnboarding } from "./actions";

const STEPS = [
  {
    icon: Leaf,
    eyebrow: "Üdv itt",
    title: "Jó, hogy itt vagy.",
    text: [
      "A Társaság tagjaival azon dolgozunk, hogy jobb hellyé tegyük a világot — először magunkkal kezdve. Ennek alapja egy nyugodtabb, rugalmasabb idegrendszer; mellette a kedvesség, a figyelmesség és a segítőkészség.",
      "Nem kell semmit teljesítened. Napi néhány perc gyakorlás, egy közösség, amely mellett haladsz, és élő alkalmak, amikor találkozunk. Két perc, és megmutatom, mi hol van.",
    ],
  },
  {
    icon: Compass,
    eyebrow: "Első lépés",
    title: "A Ceremónia és a rended",
    text: [
      "Tizenkét kérdés arról, hogyan működik az idegrendszered a hétköznapokban: mi történik benned feszült helyzetben, mi tölt vissza, merre jár a figyelmed.",
      "A válaszaid alapján a négy rend egyikébe kerülsz — Tündék, Kertőrzők, Törpök vagy Vándorok —, és részletes, személyre szóló kiértékelést kapsz. A rend a kiindulópontod: minden rend egyenrangú, és mindenki mindent gyakorol.",
    ],
  },
  {
    icon: Sparkles,
    eyebrow: "Gyakorlótér",
    title: "Heti küldetések, napi hangolások",
    text: [
      "A tananyag a belépésed napjától hetente nyílik: rövid elméleti videók, vezetett hanganyagok és napi 10–15 perces gyakorlások. Ami aznap megvolt, azt egy kattintással kipipálod.",
      "A haladásodat a karakterkártyád mutatja: XP és rang (Kereső, Figyelő, Horgonyzó…). A ranglistán heti, havi és negyedéves bontásban látszik, kik gyakoroltak a legtöbbet — ha nem szeretnél szerepelni, elrejtheted magad. A Belső Tükör a saját, csak általad látható naplód.",
    ],
  },
  {
    icon: Users,
    eyebrow: "Közösség",
    title: "Tapasztalat, nem tanácsadás",
    text: [
      "A közösségi térben azt osztjuk meg, amit a saját gyakorlásunkban észrevettünk — mi segített egy nehezebb estén, mi működött élesben. Nem diagnosztizálunk és nem okítunk.",
      "A „Köszönöm, hasznos volt” és a „Hasonlót tapasztaltam” gombokkal jelezheted, ha valaki szavai elértek. A „Megválaszolatlan posztok” szűrő megmutatja, kinek jólesne most egy válasz. Péntekenként közös körkérdés indul.",
    ],
  },
  {
    icon: Heart,
    eyebrow: "És még",
    title: "Élő alkalmak, kedves üzenetek",
    text: [
      "Az Események között találod a Nyílt Esteket, a Gyakorlónapokat, a közös online meditációkat és a havi túrát — a túra úti célját a tagok szavazzák meg, és vendéget is hívhatsz. A Kedves Üzenet menüben elsőbbséggel küldhetsz kedves üzenetet bárkinek — én egy meglepetés-telefonhívásban adom át.",
      "Az Adataim oldalon állíthatod be a neved és a beceneved, és ott kezelheted az előfizetésedet. Ha elakadsz, írj nyugodtan: info@akardosbalint.hu.",
    ],
  },
];

export function Tour({ hasOrder }: { hasOrder: boolean }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const Icon = step.icon;
  const last = i === STEPS.length - 1;
  return (
    <GildedCard className="p-8 sm:p-10">
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span className="uppercase tracking-[0.2em] text-gold">{step.eyebrow}</span>
        <span>
          {i + 1} / {STEPS.length}
        </span>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {STEPS.map((_, k) => (
          <span key={k} className={`h-1 flex-1 rounded-full ${k <= i ? "bg-gold" : "bg-line"}`} />
        ))}
      </div>
      <Icon className="mt-8 h-7 w-7 text-forest" strokeWidth={1.25} aria-hidden />
      <h2 className="mt-4 font-serif text-3xl text-forest">{step.title}</h2>
      <div className="mt-4 space-y-3 leading-relaxed text-ink">
        {step.text.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        {i > 0 ? (
          <button type="button" onClick={() => setI(i - 1)} className={buttonSecondary}>
            Vissza
          </button>
        ) : (
          <form action={finishOnboarding}>
            <button className="text-sm text-ink-soft underline decoration-gold/50 underline-offset-4 hover:text-gold">Kihagyom</button>
          </form>
        )}
        {last ? (
          <form action={finishOnboarding}>
            <button className={buttonPrimary}>{hasOrder ? "Irány a gyakorlótér" : "Kezdjük — irány a Ceremónia"}</button>
          </form>
        ) : (
          <button type="button" onClick={() => setI(i + 1)} className={buttonPrimary}>
            Tovább
          </button>
        )}
      </div>
    </GildedCard>
  );
}
