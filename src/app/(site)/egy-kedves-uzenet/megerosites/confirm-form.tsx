"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { buttonPrimary } from "@/components/ornaments";
import { confirmGuestMessage, type ConfirmState } from "../actions";

export function ConfirmForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmGuestMessage, { status: "idle" } as ConfirmState);
  if (state.status === "ok") {
    return (
      <div role="status" className="flex items-start gap-3 text-forest">
        <Check className="mt-1 h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} aria-hidden />
        <p className="leading-relaxed">
          Megerősítve. A(z) {state.recipient} részére írt üzeneted bekerült a kézbesítési sorba. Köszönöm, hogy
          szóltál – valaki hamarosan megtudja, hogy számít.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="t" value={token} />
      {state.status === "error" && <p role="alert" className="text-sm text-alert">{state.message}</p>}
      <button disabled={pending} className={buttonPrimary}>
        {pending ? "Egy pillanat…" : "Megerősítem az üzenetet"}
      </button>
    </form>
  );
}
