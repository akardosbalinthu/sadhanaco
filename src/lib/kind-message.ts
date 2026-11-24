import { z } from "zod";

/** A Kedves Üzenet mezői — ugyanazok a korlátok, mint az adatbázisban. */
export const messageFields = {
  recipient_name: z.string().trim().min(1, "Add meg, kinek szól az üzenet.").max(120),
  recipient_phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, " "))
    .refine((v) => /^\+?[0-9 ()\/-]{6,30}$/.test(v) && (v.match(/[0-9]/g)?.length ?? 0) >= 6, "Adj meg egy érvényes telefonszámot."),
  message: z.string().trim().min(1, "Írd meg az üzenetet.").max(2000, "Az üzenet legfeljebb 2000 karakter lehet."),
  consent: z.literal("on", { message: "Kérlek, erősítsd meg a nyilatkozatot." }),
};

export type FormState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

/** Az adatbázis HINT-kódjai emberi nyelven. */
export function kindMessageError(hint: string | undefined | null): string {
  switch (hint) {
    case "TRIAL_NOT_ALLOWED":
      return "A díjmentes Elsőbbségi Kedves Üzenet a próbaidő után nyílik meg. Addig díjmentes Kedves Üzenetet küldhetsz.";
    case "NOT_MEMBER":
      return "Az Elsőbbségi Kedves Üzenet aktív tagsággal érhető el.";
    case "QUOTA_EXHAUSTED":
      return "Ebben a hónapban már elküldted a díjmentes Elsőbbségi Üzeneteidet. Díjmentes Kedves Üzenetet továbbra is küldhetsz.";
    case "INVALID_GUEST":
      return "Add meg a neved és egy érvényes e-mail-címet.";
    default:
      return "Az üzenet most nem ment el. Kérlek, próbáld újra kicsit később.";
  }
}

export const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? "Kérlek, ellenőrizd a mezőket.";
