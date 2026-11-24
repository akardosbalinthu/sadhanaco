"use client";

import { useActionState } from "react";
import { bookOpenEvening, type GuestBookingState } from "./actions";

const initial: GuestBookingState = { status: "idle" };

export function BookingForm({ eventId, priceLabel }: { eventId: string; priceLabel: string }) {
  const [state, action, pending] = useActionState(bookOpenEvening, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">Név</span>
        <input
          name="name"
          required
          autoComplete="name"
          className="w-full rounded-md border border-line bg-white/60 px-3 py-2.5 outline-none focus:border-moss"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">E-mail-cím</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-line bg-white/60 px-3 py-2.5 outline-none focus:border-moss"
        />
      </label>
      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="waiver" required className="mt-1 accent-moss" />
        <span>
          Kérem a szolgáltatás teljesítését a megrendeléssel, és tudomásul veszem, hogy ezzel elveszítem
          a 14 napos elállási jogomat.
        </span>
      </label>
      {state.status === "error" && <p className="text-sm text-ink">{state.message}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-moss px-5 py-2.5 text-sm text-paper hover:bg-moss-soft disabled:opacity-60"
      >
        {pending ? "Egy pillanat…" : `Jelentkezés és fizetés (${priceLabel})`}
      </button>
      <p className="text-xs text-ink-soft">
        A fizetés a Stripe biztonságos oldalán történik. A részvételi díjról alanyi adómentes számlát
        állítunk ki.
      </p>
    </form>
  );
}
