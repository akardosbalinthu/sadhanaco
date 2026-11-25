"use client";

import { keepFields } from "@/lib/keep-fields";
import { useActionState, useState } from "react";
import { buttonPrimary, inputClass } from "@/components/ornaments";
import { publicEnv } from "@/lib/env";

const SITE_URL = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
import { startCheckout, type JoinState } from "./actions";

export type PlanOption = { code: string; title: string; price: string; note: string };

const initial: JoinState = { status: "idle" };

export function JoinForm({ plans, defaultPlan }: { plans: PlanOption[]; defaultPlan: string }) {
  const [state, action, pending] = useActionState(startCheckout, initial);
  const [plan, setPlan] = useState(defaultPlan);

  return (
    <form onSubmit={keepFields(action)} className="space-y-6">
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-3 text-sm text-ink-soft">Válassz tagságot</legend>
        {plans.map((p) => (
          <label
            key={p.code}
            className={`cursor-pointer rounded-md border p-4 transition-colors duration-300 ${
              plan === p.code ? "border-gold bg-gold-soft/20" : "border-line hover:border-gold/60"
            }`}
          >
            <input
              type="radio"
              name="plan"
              value={p.code}
              checked={plan === p.code}
              onChange={() => setPlan(p.code)}
              className="sr-only"
            />
            <span className="block font-serif text-lg text-forest">{p.title}</span>
            <span className="block text-ink">{p.price}</span>
            <span className="mt-1 block text-xs text-ink-soft">{p.note}</span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-soft">Vezetéknév</span>
          <input name="last_name" required maxLength={60} autoComplete="family-name" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-soft">Keresztnév</span>
          <input name="first_name" required maxLength={60} autoComplete="given-name" className={inputClass} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">E-mail-cím – ezzel fogsz belépni</span>
        <input type="email" name="email" required autoComplete="email" className={inputClass} />
      </label>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="terms" required className="mt-1 accent-forest" />
        <span>
          Elfogadom az{" "}
          <a href={`${SITE_URL}/aszf`} target="_blank" rel="noopener" className="text-forest underline decoration-gold/60 underline-offset-4">
            ÁSZF-et
          </a>
          , és megismertem az{" "}
          <a href={`${SITE_URL}/adatkezeles`} target="_blank" rel="noopener" className="text-forest underline decoration-gold/60 underline-offset-4">
            adatkezelési tájékoztatót
          </a>
          .
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="waiver" required className="mt-1 accent-forest" />
        <span>
          Kérem a szolgáltatás azonnali teljesítését, és tudomásul veszem, hogy ezzel elveszítem a 14 napos
          elállási jogomat. Tudomásul veszem azt is, hogy ha a tagságom megszűnik és később visszatérek, az út
          elölről indul.
        </span>
      </label>

      {state.status === "error" && <p className="text-sm text-ink">{state.message}</p>}

      <button type="submit" disabled={pending} className={`${buttonPrimary} w-full`}>
        {pending ? "Egy pillanat…" : "Tovább a biztonságos fizetéshez"}
      </button>
      <p className="text-xs text-ink-soft">
        A fizetés a Stripe biztonságos oldalán történik. Csatlakozni magánszemélyként lehet; minden díjról
        alanyi adómentes számla készül. Lemondás bármikor, a következő számlázási időszaktól.
      </p>
    </form>
  );
}
