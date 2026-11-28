import { z } from "zod";

/** 1. változatú (2026. november 25-i) kérdőív — csak a régi jelentkezések megjelenítéséhez. */
export const PILLARS = [
  { key: "taplalkozas", title: "Táplálkozás", question: "Mennyire vagy elégedett azzal, ahogyan most étkezel?", hint: "pl. rendszertelenül eszem, sokat nassolok, este eszem a legtöbbet…" },
  { key: "mozgas", title: "Mozgás", question: "Mennyire vagy elégedett azzal, amennyit és ahogyan mozogsz?", hint: "pl. heti kétszer futok, egész nap ülök…" },
  { key: "alvas", title: "Alvás", question: "Mennyire vagy elégedett az alvásoddal?", hint: "pl. nehezen alszom el, éjjel felébredek…" },
  { key: "stressz", title: "Stresszkezelés", question: "Mennyire tudod most kezelni a mindennapi terhelést?", hint: "pl. sokáig bírom, aztán hirtelen elfáradok…" },
  { key: "szerek", title: "Kockázatos szerek", question: "Mennyire vagy elégedett a viszonyoddal az alkoholhoz, a dohányzáshoz, a koffeinhez és más szerekhez?", hint: "pl. esténként iszom egy pohár bort, napi öt cigaretta…" },
  { key: "kapcsolatok", title: "Társas kapcsolódás", question: "Mennyire érzed magad támogatva a kapcsolataidban?", hint: "pl. kevés időm jut a barátaimra…" },
] as const;
export type PillarKey = (typeof PILLARS)[number]["key"];

export const RATING_LABELS = ["egyáltalán nem", "kevéssé", "közepesen", "nagyrészt", "teljesen"] as const;

export const INVEST = [
  { value: "igen", label: "Igen" },
  { value: "talan", label: "Talán" },
  { value: "nem", label: "Nem" },
] as const;

export const START_OPTIONS = [
  { value: "azonnal", label: "Azonnal – ma vagy holnap" },
  { value: "egy_heten_belul", label: "Egy héten belül" },
  { value: "egy_honapon_belul", label: "Egy hónapon belül" },
  { value: "kesobb", label: "Később" },
  { value: "nem_tudom", label: "Még nem tudom" },
] as const;

export const START_LABEL = Object.fromEntries(START_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;
export const INVEST_LABEL = Object.fromEntries(INVEST.map((o) => [o.value, o.label])) as Record<string, string>;

export const APP_STATUS_LABEL: Record<string, string> = {
  uj: "Új",
  foglalt: "Időpontot foglalt",
  konzultalt: "Konzultáció megvolt",
  resztvevo: "Résztvevő lett",
  nem_lett: "Nem lett résztvevő",
  archiv: "Archív",
};

// =============================================================================
// 2. változat (2026. november 26.): 15 kérdés, mindegyik 1–10-es skálán.
// A kérdések szövege, sorrendje és a végpontok feliratai csak itt szerepelnek.
// =============================================================================

export type QuestionKey = `q${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15}`;
export type Question = { key: QuestionKey; area: string; text: string; low: string; high: string };

/** 2. változat (15 kérdés) – csak a régi jelentkezések megjelenítéséhez. */
export const QUESTIONS_V2: Question[] = [
  { key: "q1", area: "Táplálkozás", text: "Az elmúlt két hétben milyen gyakran ettél nyugodtan, rohanás nélkül, olyan ételt, amitől utána jól érezted magad?", low: "szinte soha", high: "szinte minden étkezésnél" },
  { key: "q2", area: "Mozgás", text: "Az elmúlt két hétben hány napon mozogtál legalább fél órát (séta, sport, kerti munka)?", low: "egyen sem", high: "szinte minden nap" },
  { key: "q3", area: "Alvás", text: "Az elmúlt két hétben hány reggel ébredtél kipihenten?", low: "szinte egyszer sem", high: "szinte minden reggel" },
  { key: "q4", area: "Stresszkezelés", text: "Az elmúlt két hétben, ha valami felzaklatott, mennyi idő alatt nyerted vissza a nyugalmadat?", low: "órákig bennem maradt", high: "néhány perc alatt" },
  { key: "q5", area: "Szerhasználat", text: "Az elmúlt két hétben mennyire te döntötted el – és nem a megszokás –, mikor nyúlsz alkoholhoz, cigarettához, koffeinhez vagy más szerhez?", low: "többnyire a megszokás döntött", high: "mindig én döntöttem, vagy nem élek ilyesmivel" },
  { key: "q6", area: "Kapcsolatok", text: "Az elmúlt két hétben milyen gyakran volt olyan beszélgetésed, amelyben igazán figyeltek rád, és te is igazán figyeltél?", low: "egyszer sem", high: "szinte minden nap" },
  { key: "q7", area: "Befelé", text: "Az elmúlt két hétben milyen gyakran vetted észre napközben a légzésedet vagy a tested jelzéseit?", low: "szinte soha", high: "naponta többször" },
  { key: "q8", area: "Befelé", text: "Az elmúlt két hétben mennyire tudtál jelen lenni abban, amit éppen csináltál?", low: "szinte mindig máshol járt az eszem", high: "többnyire jelen voltam" },
  { key: "q9", area: "Kifelé", text: "Ha holnap segítségre lenne szükséged, hány emberre számíthatnál?", low: "senkire", high: "többekre is, habozás nélkül" },
  { key: "q10", area: "Kifelé", text: "Mennyire érzed, hogy tartozol valahová (család, barátok, közösség)?", low: "sehová", high: "erősen" },
  { key: "q11", area: "Szándék", text: "Mennyire nehezíti most a mindennapjaidat az, amin változtatni szeretnél?", low: "alig", high: "nagyon" },
  { key: "q12", area: "Szándék", text: "Mennyire állsz készen arra, hogy pénzt, időt és energiát fektess a változtatásba?", low: "most nem", high: "teljesen" },
  { key: "q13", area: "Szándék", text: "Mennyire fér bele a napjaidba egy napi gyakorlás és heti egy alkalom?", low: "most nem fér bele", high: "gond nélkül" },
  { key: "q14", area: "Szándék", text: "Mennyire állsz készen arra, hogy a megszokásaidon is változtass?", low: "most nem", high: "teljesen" },
  { key: "q15", area: "Kezdés", text: "Mennyire érzed úgy, hogy most van itt az ideje elkezdeni?", low: "ráér még", high: "ma vagy holnap kezdeném" },
];

/** A minősítés küszöbe a kezdési kérdésen (8–10: foglalhat konzultációt). */
export const START_THRESHOLD = 8;

/** A hat pillér (az Életmód-térkép tengelyei) és a hozzájuk tartozó szövegek. */
export const MAP_PILLARS = [
  { key: "q1", name: "Táplálkozás", strength: "Figyelsz arra, mit és hogyan eszel.", tip: "Holnap egy étkezést egyél képernyő nélkül, lassan. Figyeld meg, mikor érzed, hogy jóllaktál." },
  { key: "q2", name: "Mozgás", strength: "A tested rendszeresen mozgásban van.", tip: "Ma tegyél egy tízperces sétát, telefon nélkül. Nem az edzés a cél, hanem hogy megmozdulj." },
  { key: "q3", name: "Alvás", strength: "Az alvásod jó alapot ad a napjaidhoz.", tip: "Ma este fél órával lefekvés előtt tedd le a telefont, és figyeld meg, hogyan ébredsz." },
  { key: "q4", name: "Stresszkezelés", strength: "Hamar visszatalálsz a nyugalomhoz.", tip: "Ha legközelebb felzaklat valami, mielőtt válaszolnál, állj meg egy percre. Csak vedd észre, mit érzel." },
  { key: "q5", name: "Szerhasználat", strength: "Tudatosan döntesz arról, mihez nyúlsz.", tip: "A következő három napban figyeld meg, milyen helyzetben nyúlnál a megszokott szerhez. Csak vedd észre, ne ítélkezz." },
  { key: "q6", name: "Kapcsolatok", strength: "Vannak, akikkel igazán figyeltek egymásra.", tip: "Ma írj vagy telefonálj valakinek, akire rég gondoltál, csak azért, hogy megkérdezd, hogy van." },
] as const satisfies readonly { key: QuestionKey; name: string; strength: string; tip: string }[];

export const RESULT_TEXT = {
  longTerm: "Ez az első lépés, és már ma megteheted. A programban hétről hétre erre építünk.",
  qualified: "A válaszaid alapján most jó időben vagy. Beszéljünk egy ismerkedő konzultáción.",
  qualifiedCta: "Időpontot választok",
  later: "Úgy tűnik, most még nem sürget a kezdés, és ez rendben van. Addig gyere el egy Nyílt Estre, és nézd meg, hogyan dolgozom.",
  laterCta: "Közelgő Nyílt Estek",
};

export type Answers = Record<QuestionKey, number>;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** A 2. változat Életmód-térképe: a hat pillér, befelé/kifelé, az erősség és a következő lépés. */
export function lifestyleMap(a: Answers) {
  const pillars = MAP_PILLARS.map((p) => ({ ...p, value: a[p.key] }));
  // holtversenynél a sorrend dönt: az első legmagasabb, illetve az első legalacsonyabb
  const strongest = pillars.reduce((best, p) => (p.value > best.value ? p : best), pillars[0]);
  // a következő lépés mindig egy másik pillér (egyforma pontoknál is jár tanács)
  const rest = pillars.filter((p) => p.key !== strongest.key);
  const weakest = rest.reduce((low, p) => (p.value < low.value ? p : low), rest[0]);
  return {
    pillars,
    inward: round1((a.q7 + a.q8) / 2),
    outward: round1((a.q9 + a.q10) / 2),
    strongest,
    weakest,
    qualified: a.q15 >= START_THRESHOLD,
  };
}

// =============================================================================
// 4. változat (2026. november 28., Acélidegek Mentorprogram): 14 kérdés, 1–10-es skála.
// Hat terület az ígéret mentén + szándék. A kérdés szövege nem nevez meg gyakorlatot,
// és nem árulja el a program felépítését.
// =============================================================================

export const QUESTIONS: Question[] = [
  { key: "q1", area: "Megnyugvás", text: "Az elmúlt két hétben, ha valami felzaklatott, mennyi idő alatt nyerted vissza a nyugalmadat?", low: "órákig bennem maradt", high: "néhány perc alatt" },
  { key: "q2", area: "Megnyugvás", text: "Mennyire bízol abban, hogy egy fontos prezentáció, tárgyalás vagy nehéz beszélgetés előtt meg tudod nyugtatni magad?", low: "egyáltalán nem", high: "teljesen" },
  { key: "q3", area: "Alvás", text: "Az elmúlt két hétben hány reggel ébredtél kipihenten?", low: "szinte egyszer sem", high: "szinte minden reggel" },
  { key: "q4", area: "Alvás", text: "Az elmúlt két hétben hány éjszaka aludtál nyugodtan, anélkül hogy sokáig forgolódtál volna, vagy hajnalban felriadtál volna?", low: "szinte egyen sem", high: "szinte mindegyiken" },
  { key: "q5", area: "Kikapcsolás", text: "Az elmúlt két hétben hány este tudtál igazán kikapcsolni a munka után?", low: "egyen sem", high: "szinte minden este" },
  { key: "q6", area: "Reakciók", text: "Az elmúlt két hétben milyen gyakran reagáltál hevesebben, mint amit a helyzet indokolt: felcsattantál, vagy napokig rágódtál valamin?", low: "nagyon gyakran", high: "szinte soha" },
  { key: "q7", area: "Figyelem", text: "Az elmúlt két hétben mennyire tudtál hosszabb ideig, megszakítás nélkül egy feladatra összpontosítani, amikor kellett?", low: "szinte soha", high: "szinte mindig" },
  { key: "q8", area: "Figyelem", text: "Egy átlagos munkanap végén mennyire érzed úgy, hogy arra ment el az időd, ami valóban fontos volt?", low: "szinte soha", high: "szinte mindig" },
  { key: "q9", area: "Döntés nyomás alatt", text: "Amikor nagy a nyomás, mennyire tudsz tiszta fejjel dönteni?", low: "szinte egyáltalán nem", high: "teljesen" },
  { key: "q10", area: "Szándék", text: "Mennyire nehezíti most a munkádat vagy a mindennapjaidat az, amin változtatni szeretnél?", low: "alig", high: "nagyon" },
  { key: "q11", area: "Szándék", text: "Mennyire állsz készen arra, hogy pénzt, időt és energiát fektess a változtatásba?", low: "most nem", high: "teljesen" },
  { key: "q12", area: "Szándék", text: "Mennyire tudsz időt szakítani a napjaidban arra, hogy az új eszközöket rendszeresen gyakorold?", low: "most nem tudok", high: "gond nélkül" },
  { key: "q13", area: "Szándék", text: "Mennyire állsz készen arra, hogy a megszokásaidon is változtass?", low: "most nem", high: "teljesen" },
  { key: "q14", area: "Kezdés", text: "Mennyire érzed úgy, hogy most van itt az ideje elkezdeni?", low: "ráér még", high: "ma vagy holnap kezdeném" },
];

/** Az Idegrendszer-térkép hat tengelye (a 4. változat kérdéseiből) és a hozzájuk tartozó szövegek. */
export const NERVE_AXES = [
  { keys: ["q1", "q2"], name: "Megnyugvás", strength: "Feszült helyzetben is hamar visszatalálsz a nyugalomhoz.", tip: "Legközelebb, mielőtt egy nehéz helyzetben megszólalnál, állj meg egy pillanatra, és figyeld meg, hol érzed a testedben a feszültséget. Csak vedd észre." },
  { keys: ["q3", "q4"], name: "Alvás", strength: "Az alvásod jó alapot ad a napjaidhoz.", tip: "Ma este fél órával lefekvés előtt tedd le a telefont, és figyeld meg, hogyan ébredsz holnap." },
  { keys: ["q5"], name: "Kikapcsolás", strength: "Este le tudod tenni a munkát.", tip: "Ma a munka végén írd fel egy papírra, mi maradt nyitva, és mi az első lépés holnap. Így a fejednek nem kell estig fejben tartania." },
  { keys: ["q6"], name: "Reakciók", strength: "Arányosan reagálsz, nem ragadsz bele a feszültségbe.", tip: "Ha legközelebb felcsattannál, mielőtt válaszolnál, számolj el magadban ötig. Nem kell elfojtanod semmit, csak teret adsz magadnak." },
  { keys: ["q7", "q8"], name: "Figyelem", strength: "Tudsz mélyen és hosszan összpontosítani.", tip: "Holnap a legfontosabb feladatodat kezdd 25 perccel, értesítések nélkül, a telefont egy másik szobában hagyva." },
  { keys: ["q9"], name: "Döntés", strength: "Nyomás alatt is megőrzöd a tisztánlátásodat.", tip: "A következő fontos döntés előtt írd le egy mondatban, mit akarsz elérni vele. Ez segít, hogy a nyomás helyett a célod vezessen." },
] as const satisfies readonly { keys: readonly QuestionKey[]; name: string; strength: string; tip: string }[];

/** Az Idegrendszer-térkép: a hat terület, az erősség és a következő kis lépés. */
export function nerveMap(a: Partial<Answers>) {
  const pillars = NERVE_AXES.map((x) => ({
    name: x.name,
    strength: x.strength,
    tip: x.tip,
    value: round1(x.keys.reduce((sum, k) => sum + (a[k] ?? 0), 0) / x.keys.length),
  }));
  const strongest = pillars.reduce((best, p) => (p.value > best.value ? p : best), pillars[0]);
  const rest = pillars.filter((p) => p.name !== strongest.name);
  const weakest = rest.reduce((low, p) => (p.value < low.value ? p : low), rest[0]);
  return { pillars, strongest, weakest, qualified: (a.q14 ?? 0) >= START_THRESHOLD };
}

export const RESULT_TEXT_V4 = {
  longTerm: "Ez egy kis lépés, és már ma megteheted. A mentorálás során erre építünk, a te helyzeteidre szabva.",
  qualified: "A válaszaid alapján most jó időben vagy. Válassz időpontot az ingyenes, 55 perces online konzultációhoz.",
  qualifiedCta: "Időpontot választok",
  later: "Úgy tűnik, most még nem sürget a kezdés, és ez rendben van. Addig gyere el egy Nyílt Meditációs Estre, és nézd meg, hogyan dolgozom.",
  laterCta: "Közelgő Nyílt Estek",
};

const answerSchema = z.coerce.number().int().min(1).max(10);

/** „Honnan hallottál rólam?” – nem kötelező válaszlehetőségek. */
export const HEARD_FROM = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  ismeros: "Egy ismerősöm ajánlotta",
  nyilt_est: "Nyílt Meditációs Esten voltam",
  kereses: "Google-keresés",
  egyeb: "Máshonnan",
} as const;
const HEARD_FROM_KEYS = Object.keys(HEARD_FROM) as [keyof typeof HEARD_FROM, ...(keyof typeof HEARD_FROM)[]];

/** A link forrásjelölése (?utm_source=…): kisbetűs, legfeljebb 60 karakter, csak betű, szám, _ . - */
export function normalizeUtm(v: string | null | undefined): string | undefined {
  const s = (v ?? "").trim().toLowerCase().slice(0, 60);
  return /^[a-z0-9_.-]+$/.test(s) ? s : undefined;
}

export const applicationV2Schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().min(6).max(40),
  answers: z.object(Object.fromEntries(QUESTIONS.map((q) => [q.key, answerSchema])) as Record<QuestionKey, typeof answerSchema>),
  problem: z.string().trim().min(3).max(4000),
  health_consent: z.literal("on"),
  privacy_consent: z.literal("on"),
  heard_from: z.enum(HEARD_FROM_KEYS).optional().catch(undefined),
  utm_source: z.string().optional().transform(normalizeUtm),
});

export function applicationV2Input(fd: FormData) {
  const str = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" && v.trim() !== "" ? v : undefined;
  };
  return {
    full_name: str("full_name"),
    email: str("email"),
    phone: str("phone"),
    answers: Object.fromEntries(QUESTIONS.map((q) => [q.key, str(q.key)])),
    problem: str("problem"),
    health_consent: str("health_consent"),
    privacy_consent: str("privacy_consent"),
    heard_from: str("heard_from"),
    utm_source: str("utm_source"),
  };
}
