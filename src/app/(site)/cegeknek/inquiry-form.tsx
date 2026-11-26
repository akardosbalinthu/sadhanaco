"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { buttonPrimary, inputClass } from "@/components/ornaments";
import { BUDGETS, FORMATS, LOCATIONS, TIMINGS } from "@/lib/business";
import { keepFields } from "@/lib/keep-fields";
import { submitInquiry, type InquiryState } from "./actions";

const label = "mb-1.5 block text-sm text-ink-soft";
const legend = "font-serif text-lg text-forest";
const chip =
  "flex cursor-pointer items-center gap-2.5 rounded-md border border-line px-3.5 py-2.5 text-sm text-ink-soft transition-colors duration-300 hover:border-gold/60 has-[:checked]:border-gold has-[:checked]:bg-gold-soft/30 has-[:checked]:text-forest";

export function InquiryForm() {
  const [state, action, pending] = useActionState(submitInquiry, { status: "idle" } as InquiryState);

  if (state.status === "done") {
    return (
      <div role="status" className="space-y-4">
        <Check className="h-6 w-6 text-gold" strokeWidth={1.5} aria-hidden />
        <h3 className="font-serif text-2xl text-forest">Köszönöm{state.name ? `, ${state.name}` : ""}!</h3>
        <p className="text-ink-soft">
          Megkaptam az ajánlatkérést. Átnézem, amit írtál, és hamarosan jelentkezem egy személyre szabott ajánlattal, vagy
          előtte egy rövid egyeztető beszélgetésre hívlak. A visszaigazolást e-mailben is elküldtem.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={keepFields(action)} className="space-y-10">
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Weboldal
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className={`${legend} mb-4`}>A cég</legend>
        <label className="block">
          <span className={label}>Cégnév</span>
          <input name="company_name" required minLength={2} maxLength={200} autoComplete="organization" className={inputClass} />
        </label>
        <label className="block">
          <span className={label}>Székhely (város)</span>
          <input name="hq_city" required minLength={2} maxLength={120} className={inputClass} />
        </label>
        <label className="block">
          <span className={label}>A cég mérete (fő)</span>
          <input name="company_size" type="number" inputMode="numeric" min={1} required className={inputClass} />
        </label>
        <label className="block">
          <span className={label}>Hányan vennének részt? (nem kötelező)</span>
          <input name="participants" type="number" inputMode="numeric" min={1} className={inputClass} />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className={`${legend} mb-4`}>Kapcsolattartó</legend>
        <label className="block">
          <span className={label}>Név</span>
          <input name="contact_name" required minLength={2} maxLength={120} autoComplete="name" className={inputClass} />
        </label>
        <label className="block">
          <span className={label}>Beosztás (nem kötelező)</span>
          <input name="contact_role" maxLength={120} autoComplete="organization-title" className={inputClass} />
        </label>
        <label className="block">
          <span className={label}>E-mail-cím</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className={label}>Telefonszám (nem kötelező)</span>
          <input name="phone" type="tel" inputMode="tel" maxLength={40} autoComplete="tel" className={inputClass} />
        </label>
      </fieldset>

      <div className="space-y-8">
        <label className="block">
          <span className={legend}>Mi a cél, vagy milyen helyzet miatt kerestek?</span>
          <span className="mt-1 block text-sm text-ink-soft">Néhány mondat elég: mi zajlik most a csapatban, és mit szeretnétek elérni.</span>
          <textarea name="goal" required rows={5} maxLength={4000} className={`${inputClass} mt-3`} />
        </label>

        <fieldset>
          <legend className={legend}>Milyen forma érdekel titeket?</legend>
          <p className="mt-1 text-sm text-ink-soft">Többet is bejelölhetsz.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {FORMATS.map((o) => (
              <label key={o.value} className={chip}>
                <input type="checkbox" name="formats" value={o.value} className="h-4 w-4 accent-forest" />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className={legend}>Hol tartanátok?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {LOCATIONS.map((o) => (
              <label key={o.value} className={chip}>
                <input type="checkbox" name="locations" value={o.value} className="h-4 w-4 accent-forest" />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-8 sm:grid-cols-2">
          <fieldset>
            <legend className={legend}>Mikorra terveztek?</legend>
            <div className="mt-3 space-y-2">
              {TIMINGS.map((o) => (
                <label key={o.value} className={chip}>
                  <input type="radio" name="timing" value={o.value} required className="h-4 w-4 accent-forest" />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className={legend}>Tervezett keret (nem kötelező)</legend>
            <div className="mt-3 space-y-2">
              {BUDGETS.map((o) => (
                <label key={o.value} className={chip}>
                  <input type="radio" name="budget" value={o.value} className="h-4 w-4 accent-forest" />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg bg-paper-deep/70 p-5 text-sm text-ink-soft">
        <input type="checkbox" name="privacy_consent" required className="mt-0.5 h-5 w-5 shrink-0 accent-forest" />
        <span>
          Elolvastam és elfogadom az{" "}
          <a href="/adatkezeles#cegeknek" target="_blank" className="text-forest underline decoration-gold/60 underline-offset-4">
            adatkezelési tájékoztatót
          </a>
          .
        </span>
      </label>

      {state.status === "error" && (
        <p role="alert" className="rounded-md border border-alert/40 px-4 py-3 text-sm text-alert">
          {state.message}
        </p>
      )}
      <button className={buttonPrimary} disabled={pending} aria-busy={pending}>
        {pending ? "Küldés…" : "Ajánlatot kérek"}
      </button>
    </form>
  );
}
