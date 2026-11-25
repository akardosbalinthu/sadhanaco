import { HEALTH_CONSENT, SAFETY_QUESTION } from "@/lib/registration-details";
import { inputClass } from "@/components/ornaments";

/** Telefonszám, biztonsági kérdés és egészségi hozzájárulás – minden jelentkezésnél. */
export function RegistrationDetailsFields({ phone = "" }: { phone?: string }) {
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">Telefonszám</span>
        <input name="phone" type="tel" inputMode="tel" required maxLength={30} defaultValue={phone} autoComplete="tel" placeholder="+36 30 123 4567" className={inputClass} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm text-ink-soft">{SAFETY_QUESTION}</span>
        <textarea name="safety_note" required rows={2} maxLength={1000} className={inputClass} />
      </label>
      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="health_consent" required className="mt-1 accent-forest" />
        <span>{HEALTH_CONSENT}</span>
      </label>
    </div>
  );
}
