import { z } from "zod";

/** A jelentkezéskor kért biztonsági kérdés (a régi jelentkezési űrlap szövegével egyezik). */
export const SAFETY_QUESTION =
  "A testi és lelki biztonságod a legfontosabb. Van bármi, amiről tudnom kell (egészségi állapot, sérülés, várandósság, érzékenység)? Ha nincs, írd be: Nincs.";

export const HEALTH_CONSENT =
  "Hozzájárulok, hogy a szervező a megadott egészségi információt az esemény biztonságos megtartása érdekében kezelje. Csak ő látja, és az esemény után 30 nappal automatikusan törlődik.";

export const detailsSchema = z.object({
  phone: z
    .string()
    .trim()
    .refine((v) => /^\+?[0-9 ()\/-]{6,30}$/.test(v) && (v.match(/[0-9]/g)?.length ?? 0) >= 6, "Adj meg egy érvényes telefonszámot."),
  safety_note: z.string().trim().min(1, "Kérlek, válaszolj a biztonsági kérdésre (a „Nincs” is jó válasz).").max(1000),
  health_consent: z.literal("on", { message: "A biztonsági információ kezeléséhez kérlek, add meg a hozzájárulásod." }),
});

export function parseDetails(fd: FormData) {
  return detailsSchema.safeParse({
    phone: fd.get("phone") ?? "",
    safety_note: fd.get("safety_note") ?? "",
    health_consent: fd.get("health_consent") ?? undefined,
  });
}

export const detailsError = (hint: string | null | undefined) =>
  ({
    INVALID_PHONE: "Adj meg egy érvényes telefonszámot.",
    NOTE_REQUIRED: "Kérlek, válaszolj a biztonsági kérdésre (a „Nincs” is jó válasz).",
    CONSENT_REQUIRED: "A biztonsági információ kezeléséhez kérlek, add meg a hozzájárulásod.",
  })[hint ?? ""] ?? "A jelentkezési adatok mentése nem sikerült.";
