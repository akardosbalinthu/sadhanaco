/** Események: árkatalógus-kódok és hibaüzenetek (közös a felülethez és a webhookhoz). */

type Kind = "nyilt_est" | "gyakorlonap" | "elvonulas" | "online_meditacio" | "qa_elo" | "tura";
type Tier = "none" | "tarsasagi" | "belso_kor";

/** A számlázandó tétel kódja az esemény típusa és a foglaláskori tagsági szint szerint. */
export function eventPriceCode(kind: Kind, tier: Tier | null): string | null {
  const t = tier === "belso_kor" ? "belso_kor" : "tarsasagi";
  if (kind === "nyilt_est") return `nyilt_est_${t}`;
  if (kind === "gyakorlonap") return `gyakorlonap_${t}`;
  if (kind === "elvonulas") return "elvonulas";
  return null;
}

export function bookingError(hint: string | null | undefined): string {
  switch (hint) {
    case "TRIAL_NOT_ALLOWED":
      return "A próbaidő alatt eseményre még nem lehet jelentkezni. A próbaidő végén ez is megnyílik.";
    case "NOT_MEMBER":
      return "Eseményre aktív tagsággal lehet jelentkezni.";
    case "TIER_NOT_ALLOWED":
      return "Erre az alkalomra a jelenlegi tagságoddal nem lehet jelentkezni.";
    case "RETREAT_LOCKED":
      return "Az elvonulás az IP 3 elvégzése és jóváhagyás után nyílik meg.";
    case "REGISTRATION_NOT_OPEN":
      return "A jelentkezés még nem nyílt meg.";
    case "REGISTRATION_CLOSED":
      return "A jelentkezés erre az alkalomra lezárult.";
    case "PRIORITY_WINDOW":
      return "Az első 48 órában a Belső Kör tagjai foglalhatnak. Utána a fennmaradó helyekre te is jelentkezhetsz.";
    case "ALREADY_REGISTERED":
      return "Erre az alkalomra már jelentkeztél.";
    case "EVENT_FULL":
      return "A tagoknak szánt helyek erre az alkalomra beteltek.";
    case "EVENT_NOT_FOUND":
      return "Ez az esemény nem érhető el.";
    default:
      return "A jelentkezés most nem sikerült. Kérlek, próbáld újra kicsit később.";
  }
}

export function inviteError(hint: string | null | undefined): string {
  switch (hint) {
    case "INVITE_LIMIT":
      return "Erre a túrára már meghívtad a megengedett számú vendéget.";
    case "ALREADY_MEMBER":
      return "Ő már A Társaság tagja – külön meghívó nélkül is jöhet.";
    case "ALREADY_INVITED":
      return "Őt már meghívták erre a túrára.";
    case "INVALID_GUEST":
      return "Adj meg nevet és érvényes e-mail-címet.";
    case "REGISTRATION_CLOSED":
      return "A túra már elkezdődött.";
    default:
      return "A meghívó most nem ment el. Kérlek, próbáld újra.";
  }
}
