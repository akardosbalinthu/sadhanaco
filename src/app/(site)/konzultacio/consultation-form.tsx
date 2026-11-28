"use client";

import { useActionState } from "react";
import { buttonPrimary, inputClass } from "@/components/ornaments";
import { keepFields } from "@/lib/keep-fields";
import { submitConsultationRequest, type RequestState } from "./actions";

const label = "mb-1.5 block text-sm text-ink-soft";

export function ConsultationForm({ utmSource }: { utmSource?: string }) {
  const [state, action, pending] = useActionState(submitConsultationRequest, { status: "idle" } as RequestState);
  return (
    <form onSubmit={keepFields(action)} className="space-y-6">
      {/* Robotcsapda: rejtett mező */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Weboldal
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {utmSource && <input type="hidden" name="utm_source" value={utmSource} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className={label}>A neved</span>
          <input name="full_name" required minLength={2} maxLength={120} autoComplete="name" className={inputClass} />
        </label>
        <label className="block">
          <span className={label}>E-mail-cím</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className={label}>Telefonszám</span>
          <input name="phone" type="tel" inputMode="tel" required minLength={6} maxLength={40} autoComplete="tel" className={inputClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className={label}>Mi az, amin a legjobban szeretnél változtatni?</span>
          <textarea name="problem" required minLength={3} maxLength={4000} rows={4} className={inputClass} />
          <span className="mt-1.5 block text-xs text-ink-soft">Elég pár mondat. Így a beszélgetésen rögtön a lényegről beszélhetünk.</span>
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-lg bg-paper-deep/70 p-5 text-sm text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-forest" />
        <span>
          Elolvastam az{" "}
          <a href="/adatkezeles#konzultacio" target="_blank" className="text-forest underline decoration-gold/60 underline-offset-4">
            adatkezelési tájékoztatót
          </a>
          , és hozzájárulok, hogy Kardos Bálint e. v. a megadott adataimat – ha a válaszomban az egészségemre vonatkozó
          információt is megosztok, azt is – a konzultáció megszervezése és előkészítése céljából kezelje. A
          hozzájárulásomat bármikor visszavonhatom egy e-maillel.
        </span>
      </label>

      {state.status === "error" && (
        <p role="alert" className="rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">
          {state.message}
        </p>
      )}

      <button type="submit" className={buttonPrimary} disabled={pending} aria-busy={pending}>
        {pending ? "Küldés…" : "Tovább az időpontokhoz"}
      </button>
    </form>
  );
}
