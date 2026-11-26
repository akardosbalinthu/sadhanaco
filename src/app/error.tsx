"use client";

import { useEffect } from "react";
import { buttonPrimary, buttonSecondary, PageHeader } from "@/components/ornaments";
import { SITE } from "@/lib/site";

/** Saját hibaoldal: ha egy oldal betöltése közben hiba történik. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  return (
    <main className="mx-auto max-w-5xl px-6 py-24">
      <PageHeader eyebrow="Hiba" title="Valami nem sikerült.">
        <p>
          Az oldal betöltése közben hiba történt. Próbáld újra egy kicsit később; ha nem múlik el, írj nekem:{" "}
          <a href={`mailto:${SITE.email}`} className="text-forest underline decoration-gold/50 underline-offset-4">
            {SITE.email}
          </a>
          .
        </p>
      </PageHeader>
      <div className="mt-10 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={buttonPrimary}>
          Újrapróbálom
        </button>
        <a href={`${site}/`} className={buttonSecondary}>
          Vissza a kezdőlapra
        </a>
      </div>
    </main>
  );
}
