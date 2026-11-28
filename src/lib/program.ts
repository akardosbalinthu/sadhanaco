/** Az egyéni program közös típusai és megjelenítési segédei. */

export type MyProgram = {
  enrollment_id: string;
  status: "aktiv" | "lezart";
  starts_on: string;
  ends_on: string;
  learning_ends_on: string;
  stage2_from: string;
  started: boolean;
  month: number;
  week?: number;
  phase: "hamarosan" | "tanulas" | "integracio" | "lezarult";
  practice_plan: string | null;
  week_start: string;
  report_done: boolean;
  reports_open?: boolean;
  payment_overdue?: boolean;
  payment_paused?: boolean;
  next_session: {
    id: string;
    starts_at: string;
    duration_minutes: number;
    note: string | null;
    meet_url: string | null;
  } | null;
};

export const PHASE_LABEL: Record<MyProgram["phase"], string> = {
  hamarosan: "Hamarosan indul",
  tanulas: "16 hetes program",
  integracio: "16 hetes program", // régi érték (a 8 hónapos programból), már nem fordul elő
  lezarult: "Lezárult",
};

const TZ = "Europe/Budapest";
export const fmtFull = (iso: string) =>
  new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, dateStyle: "full", timeStyle: "short" }).format(new Date(iso));
export const fmtDay = (isoDate: string) =>
  new Intl.DateTimeFormat("hu-HU", { timeZone: TZ, year: "numeric", month: "long", day: "numeric" }).format(new Date(`${isoDate}T12:00:00Z`));

/** Budapesti falióra-idő → UTC pillanat (a nyári/téli időszámítást is kezeli). */
export function budapestToUtc(y: number, mo: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(guess));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asLocal = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"));
  return new Date(guess - (asLocal - guess));
}

/** Egy UTC pillanat budapesti dátum- és időösszetevői. */
export function budapestParts(at: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: g("year"), mo: g("month"), d: g("day"), h: g("hour"), mi: g("minute") };
}

/** A program hossza: 16 hét. */
export const PROGRAM_WEEKS = 16;

/**
 * Az alkalmak menetrendje budapesti idő szerint, mindig ugyanabban az órában:
 * a 16 hét alatt hetente egy 60 perces alkalom (a kezdéstől számított 16. hét végéig).
 */
export function sessionSchedule(firstSession: Date, startsOn: string) {
  const [sy, sm, sd] = startsOn.split("-").map(Number);
  const programEnd = Date.UTC(sy, sm - 1, sd + PROGRAM_WEEKS * 7);
  const f = budapestParts(firstSession);
  const out: { starts_at: string; duration_minutes: number }[] = [];
  // a falióra-idő marad, a nap hetente 7-tel nő
  for (let i = 0; ; i++) {
    const day = new Date(Date.UTC(f.y, f.mo - 1, f.d + 7 * i));
    if (day.getTime() >= programEnd) break;
    out.push({ starts_at: budapestToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), f.h, f.mi).toISOString(), duration_minutes: 60 });
  }
  return out;
}
