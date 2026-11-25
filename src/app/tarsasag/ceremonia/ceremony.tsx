"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { OrderCrest } from "@/components/order-crest";
import { buttonPrimary, buttonSecondary, GildedCard } from "@/components/ornaments";
import { submitCeremony } from "./actions";

type Q = { id: number; prompt: string; options: { key: string; text: string }[] };
type Info = Record<string, { name: string; single: string; gift: string; motto: string }>;

const TIEBREAK: Record<string, string> = {
  tundek: "Finomabb érzékelést",
  kertorzok: "Mélyebb békét",
  torpok: "Szilárdabb belső rendet",
  vandorok: "Több bátorságot",
};

export function Ceremony({ questions, info, practiceHref, reportHref }: { questions: Q[]; info: Info; practiceHref: string; reportHref: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [tied, setTied] = useState<string[] | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function send(tiebreak?: string) {
    setError(null);
    start(async () => {
      const r = await submitCeremony(answers, tiebreak);
      if (r.status === "done") setResult(r.order);
      else if (r.status === "tie") setTied(r.tied);
      else setError(r.message);
    });
  }

  if (result) {
    const o = info[result];
    return (
      <GildedCard className="p-8 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">A Ceremónia döntött</p>
        <OrderCrest order={result} className="mx-auto mt-6 h-28 w-24" />
        <h2 className="mt-4 font-serif text-4xl text-forest">{o?.name}</h2>
        <p className="mt-2 text-gold">{o?.gift}</p>
        <p className="mx-auto mt-6 max-w-md font-serif italic text-ink">{o?.motto}</p>
        <p className="mx-auto mt-6 max-w-md text-sm text-ink-soft">
          Elkészült a személyre szóló kiértékelésed is: mit mutattak a válaszaid a stresszválaszodról, a
          testérzékelésedről és arról, mi tölt vissza.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={reportHref} className={buttonPrimary}>
            Elolvasom a kiértékelésem
          </Link>
          <Link href={practiceHref} className={buttonSecondary}>
            Indulhat az első hét
          </Link>
        </div>
      </GildedCard>
    );
  }

  if (tied) {
    return (
      <GildedCard className="p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-gold">Még egy kérdés</p>
        <h2 className="mt-3 font-serif text-2xl text-forest">Ha egyetlen dolgot vihetnél magaddal az útra, mi lenne az?</h2>
        <div className="mt-6 grid gap-3">
          {tied.map((t) => (
            <button key={t} disabled={pending} onClick={() => send(t)} className={`${buttonSecondary} text-left`}>
              {TIEBREAK[t] ?? t}
            </button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-ink">{error}</p>}
      </GildedCard>
    );
  }

  const q = questions[step];
  const chosen = answers[String(q.id)];
  const last = step === questions.length - 1;
  return (
    <GildedCard className="p-8">
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span className="uppercase tracking-[0.18em] text-gold">{step + 1}. kérdés / {questions.length}</span>
        <span>{Math.round((step / questions.length) * 100)}%</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div className="h-full bg-gold transition-all duration-500" style={{ width: `${((step + (chosen ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <h2 className="mt-6 font-serif text-2xl text-forest">{q.prompt}</h2>
      <div className="mt-6 grid gap-3" role="radiogroup">
        {q.options.map((o) => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={chosen === o.key}
            onClick={() => setAnswers((a) => ({ ...a, [String(q.id)]: o.key }))}
            className={`rounded-md border p-4 text-left text-sm transition-colors duration-300 ${
              chosen === o.key ? "border-gold bg-gold-soft/30 text-ink" : "border-line text-ink-soft hover:border-gold/60"
            }`}
          >
            {o.text}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-ink">{error}</p>}
      <div className="mt-8 flex justify-between gap-3">
        <button type="button" disabled={step === 0 || pending} onClick={() => setStep((s) => s - 1)} className={`${buttonSecondary} disabled:opacity-40`}>
          Vissza
        </button>
        {last ? (
          <button type="button" disabled={!chosen || pending} onClick={() => send()} className={`${buttonPrimary} disabled:opacity-40`}>
            {pending ? "Egy pillanat…" : "A Ceremónia döntsön"}
          </button>
        ) : (
          <button type="button" disabled={!chosen} onClick={() => setStep((s) => s + 1)} className={`${buttonPrimary} disabled:opacity-40`}>
            Tovább
          </button>
        )}
      </div>
    </GildedCard>
  );
}
