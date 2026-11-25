"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Check } from "lucide-react";
import { buttonPrimary, buttonSecondary, inputClass } from "@/components/ornaments";
import { INVEST, PILLARS, RATING_LABELS, START_OPTIONS } from "@/lib/application";
import { keepFields } from "@/lib/keep-fields";
import { submitApplication, type ApplyState } from "./actions";

const legend = "font-serif text-xl text-forest";
const hint = "mt-1 text-sm text-ink-soft";
const chip =
  "flex cursor-pointer items-center justify-center rounded-md border border-line px-3 py-2 text-sm text-ink-soft transition-colors duration-300 hover:border-gold/60 has-[:checked]:border-gold has-[:checked]:bg-gold-soft/30 has-[:checked]:text-forest";

function Scale({ name, max, low, high }: { name: string; max: number; low: string; high: string }) {
  return (
    <div className="mt-3">
      <div className={`grid gap-2 ${max === 5 ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-10"}`}>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <label key={n} className={chip}>
            <input type="radio" name={name} value={n} required className="sr-only" />
            {n}
          </label>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-ink-soft">
        <span>1 = {low}</span>
        <span>
          {max} = {high}
        </span>
      </div>
    </div>
  );
}

function Choice({ name, options }: { name: string; options: readonly { value: string; label: string }[] }) {
  return (
    <div className={`mt-3 grid gap-2 ${options.length > 3 ? "sm:grid-cols-1" : "grid-cols-3"}`}>
      {options.map((o) => (
        <label key={o.value} className={`${chip} ${options.length > 3 ? "justify-start px-4 py-3" : ""}`}>
          <input type="radio" name={name} value={o.value} required className="sr-only" />
          {o.label}
        </label>
      ))}
    </div>
  );
}

export function ApplicationForm() {
  const [state, action, pending] = useActionState(submitApplication, { status: "idle" } as ApplyState);

  if (state.status === "later") {
    return (
      <div role="status" className="space-y-5">
        <Check className="h-6 w-6 text-gold" strokeWidth={1.5} aria-hidden />
        <h2 className="font-serif text-3xl text-forest">Köszönöm{state.name ? `, ${state.name}` : ""}!</h2>
        <p className="text-lg leading-relaxed text-ink-soft">
          Azt írtad, most még nem kezdenéd el — és ez teljesen rendben van. Az egyéni programot azoknak ajánlom, akik
          most szeretnének belevágni, mert akkor tudom igazán jól kísérni.
        </p>
        <p className="text-lg leading-relaxed text-ink-soft">
          Addig is szeretettel várlak egy Nyílt Meditációs Esten, ahol kipróbálhatod, hogyan dolgozom. Ha később úgy
          érzed, eljött az ideje, töltsd ki újra a felmérést.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/nyilt-estek" className={buttonPrimary}>
            Közelgő Nyílt Estek
          </Link>
          <Link href="/" className={buttonSecondary}>
            Vissza a kezdőlapra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={keepFields(action)} className="space-y-14">
      {/* Robotcsapda: rejtett mező */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Weboldal
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">1. rész</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">Hol tartasz most?</h2>
        <p className="mt-3 text-ink-soft">
          Az életmód-orvostan hat pillére mentén. Nincs jó vagy rossz válasz: egy pillanatkép arról, honnan indulunk.
        </p>
        <div className="mt-8 space-y-10">
          {PILLARS.map((p) => (
            <fieldset key={p.key}>
              <legend className={legend}>{p.title}</legend>
              <p className={hint}>{p.question}</p>
              <Scale name={`p_${p.key}_rating`} max={5} low={RATING_LABELS[0]} high={RATING_LABELS[4]} />
              {p.key === "alvas" && (
                <label className="mt-4 block max-w-xs">
                  <span className="mb-1.5 block text-sm text-ink-soft">Átlagosan hány órát alszol egy éjszaka?</span>
                  <input name="p_alvas_hours" type="number" min={0} max={16} step={0.5} inputMode="decimal" className={inputClass} />
                </label>
              )}
              <label className="mt-4 block">
                <span className="mb-1.5 block text-sm text-ink-soft">Ha szeretnéd, írd le pár szóban (nem kötelező)</span>
                <textarea name={`p_${p.key}_note`} rows={2} maxLength={1000} placeholder={p.hint} className={inputClass} />
              </label>
            </fieldset>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">2. rész</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">Mi hozott ide?</h2>
        <div className="mt-8 space-y-10">
          <label className="block">
            <span className={legend}>Mi az, amin most változtatni szeretnél?</span>
            <span className={`${hint} block`}>Írd le a saját szavaiddal, amennyit szeretnél.</span>
            <textarea name="problem" required rows={5} maxLength={4000} className={`${inputClass} mt-3`} />
          </label>
          <fieldset>
            <legend className={legend}>Mennyire nehezíti meg most az életedet?</legend>
            <Scale name="severity" max={10} low="alig" high="nagyon" />
          </fieldset>
          <fieldset>
            <legend className={legend}>Mennyire égető, hogy változás történjen?</legend>
            <Scale name="urgency" max={10} low="ráér" high="nagyon égető" />
          </fieldset>
          <div className="grid gap-8 sm:grid-cols-3">
            <fieldset>
              <legend className={legend}>Pénzt</legend>
              <p className={hint}>Készen állsz arra, hogy anyagilag is befektess a változásba?</p>
              <Choice name="invest_money" options={INVEST} />
            </fieldset>
            <fieldset>
              <legend className={legend}>Időt</legend>
              <p className={hint}>Napi gyakorlásra és heti egy alkalomra?</p>
              <Choice name="invest_time" options={INVEST} />
            </fieldset>
            <fieldset>
              <legend className={legend}>Energiát</legend>
              <p className={hint}>Arra, hogy a megszokásaidon is változtass?</p>
              <Choice name="invest_energy" options={INVEST} />
            </fieldset>
          </div>
          <fieldset>
            <legend className={legend}>Mikor szeretnéd elkezdeni?</legend>
            <Choice name="start_when" options={START_OPTIONS} />
          </fieldset>
        </div>
      </section>

      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-gold">3. rész</p>
        <h2 className="mt-2 font-serif text-3xl text-forest">Hogyan érlek el?</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm text-ink-soft">A neved</span>
            <input name="full_name" required minLength={2} maxLength={120} autoComplete="name" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">E-mail-cím</span>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Telefonszám (nem kötelező)</span>
            <input name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" className={inputClass} />
          </label>
        </div>

        <div className="mt-8 space-y-4 rounded-lg bg-paper-deep/70 p-5 text-sm text-ink-soft">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="health_consent" required className="mt-1 accent-forest" />
            <span>
              <strong className="font-normal text-forest">Kifejezetten hozzájárulok</strong>, hogy a felmérésben megadott,
              egészségemre vonatkozó adataimat (például az alvásomról, a mozgásomról, a szerhasználatomról és a
              panaszaimról írtakat) Kardos Bálint e. v. a konzultáció előkészítése és a program személyre szabása céljából
              kezelje. A hozzájárulásomat bármikor visszavonhatom egy e-maillel.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="privacy_consent" required className="mt-1 accent-forest" />
            <span>
              Elolvastam és elfogadom az{" "}
              <a href="/adatkezeles#jelentkezes" target="_blank" className="text-forest underline decoration-gold/60 underline-offset-4">
                adatkezelési tájékoztatót
              </a>
              .
            </span>
          </label>
        </div>
      </section>

      {state.status === "error" && (
        <p role="alert" className="rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">
          {state.message}
        </p>
      )}
      <div>
        <button className={buttonPrimary} disabled={pending} aria-busy={pending}>
          {pending ? "Küldés…" : "Elküldöm a felmérést"}
        </button>
        <p className="mt-3 text-sm text-ink-soft">A válaszaidat csak én látom.</p>
      </div>
    </form>
  );
}
