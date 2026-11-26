"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buttonPrimary, buttonSecondary, inputClass } from "@/components/ornaments";
import { HEARD_FROM, QUESTIONS, type QuestionKey } from "@/lib/application";
import { keepFields } from "@/lib/keep-fields";
import { submitApplication, type ApplyState } from "./actions";

/**
 * Kérdőív: képernyőnként egy kérdés (1–10-es skála), haladásjelzővel és visszalépéssel.
 * Minden mező egyetlen űrlapban van; a lépések csak a láthatóságot váltják,
 * így a beküldéskor minden válasz együtt megy el.
 */
export function ApplicationForm({ utmSource }: { utmSource?: string }) {
  const [state, action, pending] = useActionState(submitApplication, { status: "idle" } as ApplyState);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<QuestionKey, number>>>({});
  const [problem, setProblem] = useState("");
  const topRef = useRef<HTMLDivElement>(null);
  // Lépésváltáskor a kérdés kerüljön a képernyő tetejére (telefonon ne kelljen görgetni).
  useEffect(() => {
    if (step === 0 || !topRef.current) return;
    const top = topRef.current.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.35) topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);
  const total = QUESTIONS.length;
  const steps = total + 2; // + „Mi hozott ide?” + elérhetőség
  const onQuestion = step < total;
  const q = onQuestion ? QUESTIONS[step] : null;

  const choose = (key: QuestionKey, v: number) => {
    setAnswers((a) => ({ ...a, [key]: v }));
    // rövid szünet, hogy látszódjon a választás, aztán tovább
    window.setTimeout(() => setStep((s) => Math.min(s + 1, steps - 1)), 220);
  };
  const canNext = !onQuestion || answers[q!.key] != null;

  return (
    <form
      onSubmit={keepFields(action)}
      className="space-y-8"
      onKeyDown={(e) => {
        if (e.key === "Enter" && step < steps - 1 && (e.target as HTMLElement).tagName !== "TEXTAREA") e.preventDefault();
      }}
    >
      {/* Robotcsapda: rejtett mező */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Weboldal
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {/* Haladásjelző */}
      <div ref={topRef} className="scroll-mt-6">
        <div className="flex items-center justify-between text-sm text-ink-soft">
          <span>{onQuestion ? `${step + 1} / ${total}` : step === total ? "Majdnem kész" : "Utolsó lépés"}</span>
          {q && <span className="text-xs uppercase tracking-[0.16em] text-gold">{q.area}</span>}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full bg-gold transition-all duration-500" style={{ width: `${((step + (onQuestion ? 0 : 1)) / steps) * 100}%` }} />
        </div>
      </div>

      {utmSource && <input type="hidden" name="utm_source" value={utmSource} />}

      {/* A válaszok rejtett mezőkben – így minden lépés együtt megy el */}
      {QUESTIONS.map((x) => (
        <input key={x.key} type="hidden" name={x.key} value={answers[x.key] ?? ""} />
      ))}

      {q && (
        <fieldset key={q.key} className="min-h-[19rem]">
          <legend className="font-serif text-2xl leading-snug text-forest sm:text-3xl">{q.text}</legend>
          <div className="mt-8 grid grid-cols-5 gap-2 sm:gap-3">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const on = answers[q.key] === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => choose(q.key, n)}
                  aria-pressed={on}
                  className={`h-14 rounded-lg border text-lg transition-colors duration-300 ${
                    on ? "border-gold bg-gold-soft/40 text-forest" : "border-line text-ink-soft hover:border-gold/60"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-between gap-6 text-sm text-ink-soft">
            <span>1 = {q.low}</span>
            <span className="text-right">10 = {q.high}</span>
          </div>
        </fieldset>
      )}

      <div className={step === total ? "min-h-[19rem]" : "hidden"}>
        <label className="block">
          <span className="font-serif text-2xl leading-snug text-forest sm:text-3xl">Mi hozott ide?</span>
          <span className="mt-2 block text-ink-soft">
            Ha szeretnéd, írd le pár mondatban, min változtatnál. Nem kötelező, de segít, hogy a konzultáción rögtön a
            lényegről beszélhessünk.
          </span>
          <textarea name="problem" rows={5} maxLength={4000} value={problem} onChange={(e) => setProblem(e.target.value)} className={`${inputClass} mt-4`} />
        </label>
      </div>

      <div className={step === total + 1 ? "space-y-6" : "hidden"}>
        <div>
          <h2 className="font-serif text-2xl leading-snug text-forest sm:text-3xl">Hová küldjem az eredményed?</h2>
          <p className="mt-2 text-ink-soft">Elküldöm e-mailben is, hogy később visszanézhesd.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm text-ink-soft">A neved</span>
            <input name="full_name" required={step === total + 1} minLength={2} maxLength={120} autoComplete="name" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">E-mail-cím</span>
            <input name="email" type="email" required={step === total + 1} autoComplete="email" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Telefonszám (nem kötelező)</span>
            <input name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" className={inputClass} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm text-ink-soft">Honnan hallottál rólam? (nem kötelező)</span>
            <select name="heard_from" defaultValue="" className={inputClass}>
              <option value="">Válassz, ha szeretnél</option>
              {Object.entries(HEARD_FROM).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="space-y-4 rounded-lg bg-paper-deep/70 p-5 text-sm text-ink-soft">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="health_consent" required={step === total + 1} className="mt-1 h-5 w-5 shrink-0 accent-forest" />
            <span>
              <strong className="font-normal text-forest">Kifejezetten hozzájárulok</strong>, hogy a kérdőívben megadott,
              egészségemre vonatkozó adataimat (például az alvásomról, a mozgásomról és a szerhasználatomról adott
              válaszaimat) Kardos Bálint e. v. a konzultáció előkészítése és a program személyre szabása céljából kezelje.
              A hozzájárulásomat bármikor visszavonhatom egy e-maillel.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="privacy_consent" required={step === total + 1} className="mt-1 h-5 w-5 shrink-0 accent-forest" />
            <span>
              Elolvastam és elfogadom az{" "}
              <a href="/adatkezeles#jelentkezes" target="_blank" className="text-forest underline decoration-gold/60 underline-offset-4">
                adatkezelési tájékoztatót
              </a>
              .
            </span>
          </label>
        </div>
      </div>

      {state.status === "error" && (
        <p role="alert" className="rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">
          {state.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={`${buttonSecondary} px-4 ${step === 0 ? "invisible" : ""}`}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Vissza
        </button>
        {step < steps - 1 ? (
          <button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} className={`${buttonPrimary} disabled:opacity-40`}>
            {step === total && !problem.trim() ? "Kihagyom" : "Tovább"}
            <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        ) : (
          <button type="submit" className={buttonPrimary} disabled={pending} aria-busy={pending}>
            {pending ? "Küldés…" : "Megnézem az eredményem"}
          </button>
        )}
      </div>
    </form>
  );
}
