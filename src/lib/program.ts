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
  phase: "hamarosan" | "tanulas" | "integracio" | "lezarult";
  practice_plan: string | null;
  week_start: string;
  report_done: boolean;
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
  tanulas: "Tanulás és beépítés",
  integracio: "Önálló integráció",
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

/**
 * Az alkalmak menetrendje budapesti idő szerint, mindig ugyanabban az órában:
 * az első 4 hónapban hetente (60 perc), a második 4-ben havonta (45 perc).
 */
export function sessionSchedule(firstSession: Date, startsOn: string) {
  const [sy, sm, sd] = startsOn.split("-").map(Number);
  const learningEnd = Date.UTC(sy, sm - 1 + 4, sd);
  const programEnd = Date.UTC(sy, sm - 1 + 8, sd);
  const f = budapestParts(firstSession);
  const out: { starts_at: string; duration_minutes: number }[] = [];
  // heti alkalmak: a falióra-idő marad, a nap hetente 7-tel nő
  for (let i = 0; ; i++) {
    const day = new Date(Date.UTC(f.y, f.mo - 1, f.d + 7 * i));
    if (day.getTime() >= learningEnd) break;
    out.push({ starts_at: budapestToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), f.h, f.mi).toISOString(), duration_minutes: 60 });
  }
  // havi alkalmak: az utolsó heti alkalom után egy hónappal, ugyanazon a napon és órában
  const last = out.length ? budapestParts(new Date(out[out.length - 1].starts_at)) : f;
  for (let i = 1; ; i++) {
    const day = new Date(Date.UTC(last.y, last.mo - 1 + i, last.d));
    if (day.getTime() >= programEnd) break;
    out.push({ starts_at: budapestToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), f.h, f.mi).toISOString(), duration_minutes: 45 });
  }
  return out;
}
