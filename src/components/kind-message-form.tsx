"use client";

import { keepFields } from "@/lib/keep-fields";
import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { buttonPrimary, inputClass } from "@/components/ornaments";
import type { FormState } from "@/lib/kind-message";

type Choice = { value: string; title: string; text: string; disabled?: boolean };

/**
 * Kedves Üzenet beküldő űrlap. Vendégnél (guest) a küldő neve és e-mail-címe is kell;
 * tagnál választható az üzenet fajtája (choices).
 */
export function KindMessageForm({
  action,
  guest = false,
  choices,
  termsHref,
  paid,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  guest?: boolean;
  choices?: Choice[];
  termsHref: string;
  /** A „paid” választásnál megjelenő összegmező beállításai. */
  paid?: { min: number; suggested: number };
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle" } as FormState);
  const firstEnabled = choices?.find((c) => !c.disabled)?.value;
  const [kind, setKind] = useState(firstEnabled);
  const isPaid = kind === "paid" && paid;

  if (state.status === "done") {
    return (
      <div role="status" className="flex items-start gap-3 text-forest">
        <Check className="mt-1 h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
        <p className="leading-relaxed">{state.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={keepFields(formAction)} className="space-y-5">
      {choices && (
        <fieldset className={`grid gap-3 ${choices.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <legend className="mb-2 text-sm text-ink-soft">Milyen üzenetet küldesz?</legend>
          {choices.map((c) => (
            <label
              key={c.value}
              className={`flex cursor-pointer gap-3 rounded-md border border-line p-4 transition-colors duration-300 has-[:checked]:border-gold has-[:checked]:bg-gold-soft/30 ${
                c.disabled ? "cursor-not-allowed opacity-50" : "hover:border-gold/60"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={c.value}
                defaultChecked={c.value === firstEnabled}
                disabled={c.disabled}
                onChange={() => setKind(c.value)}
                className="mt-1 accent-forest"
              />
              <span>
                <span className="block font-serif text-lg text-forest">{c.title}</span>
                <span className="mt-1 block text-sm text-ink-soft">{c.text}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-soft">Kinek szól?</span>
          <input name="recipient_name" required maxLength={120} placeholder="pl. Erzsi nagymamám" className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-ink-soft">A telefonszáma</span>
          <input name="recipient_phone" required type="tel" inputMode="tel" maxLength={30} placeholder="+36 30 123 4567" className={inputClass} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">Az üzeneted</span>
        <textarea
          name="message"
          required
          rows={6}
          maxLength={2000}
          placeholder="Mit üzennél neki? Néhány őszinte, kedves mondat elég."
          className={inputClass}
        />
      </label>

      {guest && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">A te neved</span>
            <input name="guest_name" required maxLength={120} autoComplete="name" className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Az e-mail-címed — ide küldöm a megerősítést</span>
            <input name="guest_email" required type="email" autoComplete="email" className={inputClass} />
          </label>
          {/* Csapda a robotoknak: ember nem látja, nem tölti ki. */}
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        </div>
      )}

      {isPaid && (
        <div className="space-y-4 rounded-md border border-gold/40 p-4">
          <label className="block max-w-xs">
            <span className="mb-1.5 block text-sm text-ink-soft">Az összeg, amelyet szánsz rá (Ft)</span>
            <input
              name="amount"
              type="number"
              required
              min={paid.min}
              step={100}
              defaultValue={paid.suggested}
              className={inputClass}
            />
          </label>
          <p className="text-xs text-ink-soft">
            Legalább {paid.min.toLocaleString("hu-HU", { useGrouping: "always" } as Intl.NumberFormatOptions)} Ft. A kereten felüli
            üzeneteket az összeg szerint csökkenő sorrendben kézbesítem, a díjmentesek előtt. Ez digitális szolgáltatás, nem
            adomány: számla készül róla.
          </p>
          <label className="flex items-start gap-3 text-sm text-ink-soft">
            <input type="checkbox" name="waiver" required className="mt-1 accent-forest" />
            <span>Kérem a szolgáltatás azonnali teljesítését, és tudomásul veszem, hogy ezzel elveszítem a 14 napos elállási jogomat.</span>
          </label>
        </div>
      )}

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="anonymous" className="mt-1 accent-forest" />
        <span>
          <span className="text-forest">Névtelen maradnék.</span> A hívásban nem mondom ki a neved — a címzett csak az
          üzenetet hallja, azt nem, hogy ki küldte.
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="consent" required className="mt-1 accent-forest" />
        <span>
          A címzett nevét és telefonszámát jogszerűen adom meg, és elfogadom az{" "}
          <a href={termsHref} target="_blank" rel="noopener" className="text-forest underline decoration-gold/60 underline-offset-4">
            ÁSZF
          </a>{" "}
          Egy Kedves Üzenetre vonatkozó részét.
        </span>
      </label>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-alert">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className={buttonPrimary}>
        {pending ? "Egy pillanat…" : guest ? "Elküldöm" : isPaid ? "Tovább a fizetéshez" : "Elküldöm az üzenetet"}
      </button>
    </form>
  );
}
