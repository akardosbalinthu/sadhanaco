"use client";

import { keepFields } from "@/lib/keep-fields";
import { buttonPrimary, inputClass } from "@/components/ornaments";
import { publicEnv } from "@/lib/env";

const SITE_URL = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
import { useActionState } from "react";
import { RegistrationDetailsFields } from "@/components/registration-details-fields";
import { bookOpenEvening, type GuestBookingState } from "./actions";

const initial: GuestBookingState = { status: "idle" };

export function BookingForm({ eventId, priceLabel, free = false }: { eventId: string; priceLabel: string; free?: boolean }) {
  const [state, action, pending] = useActionState(bookOpenEvening, initial);

  if (state.status === "done") {
    return <p role="status" className="leading-relaxed text-forest">{state.message}</p>;
  }

  return (
    <form onSubmit={keepFields(action)} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">Név</span>
        <input
          name="name"
          required
          autoComplete="name"
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">E-mail-cím</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </label>
      <RegistrationDetailsFields />
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

      {!free && (
        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input type="checkbox" name="waiver" required className="mt-1 accent-forest" />
          <span>
            Kérem a szolgáltatás teljesítését a megrendeléssel, és tudomásul veszem, hogy ezzel elveszítem
            a 14 napos elállási jogomat.
          </span>
        </label>
      )}
      {state.status === "error" && <p className="text-sm text-ink">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} w-full`}
      >
        {pending ? "Egy pillanat…" : free ? `Jelentkezem (${priceLabel})` : `Jelentkezés és fizetés (${priceLabel})`}
      </button>
      {!free && (
        <p className="text-xs text-ink-soft">
          A fizetés a Stripe biztonságos oldalán történik. A részvételi díjról alanyi adómentes számlát
          állítunk ki.
        </p>
      )}
    </form>
  );
}
