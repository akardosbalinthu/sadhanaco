"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { back, budapestLocalToIso, requireAdmin } from "@/lib/admin";
import { magicLinkFor } from "@/lib/auth-links";
import { sendEmail } from "@/lib/email";
import { publicEnv } from "@/lib/env";
import { budapestToUtc, fmtFull, sessionSchedule } from "@/lib/program";
import { tp } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

const uuid = z.string().uuid();
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optStr = (fd: FormData, k: string) => str(fd, k) || null;
const httpsOrNull = (v: string | null) => (v && /^https:\/\//.test(v) ? v : null);

function done(path: string, error: { message: string } | null, ok: string): never {
  revalidatePath(tp("/admin"), "layout");
  back(path, error ? { hiba: error.message } : { ok });
}

// ---------------------------------------------------------------------------
// Konzultációs időpontok
// ---------------------------------------------------------------------------

export async function saveConsultationSettings(fd: FormData) {
  const { supabase } = await requireAdmin();
  const meet = optStr(fd, "meet_url");
  if (meet && !httpsOrNull(meet)) back("/idopontok", { hiba: "A Meet-link https:// kezdetű legyen." });
  const minutes = Number(str(fd, "minutes") || 30);
  const { error } = await supabase
    .from("app_settings")
    .update({ consultation_meet_url: meet, consultation_default_minutes: minutes })
    .eq("id", true);
  done("/idopontok", error, "Beállítások elmentve.");
}

/** Egy vagy több időpont: a megadott napon a kezdéstől a befejezésig, adott hosszúságú sávokban. */
export async function addSlots(fd: FormData) {
  const { supabase } = await requireAdmin();
  const day = str(fd, "day"); // YYYY-MM-DD
  const from = str(fd, "from"); // HH:MM
  const to = str(fd, "to"); // HH:MM (üres: egyetlen időpont)
  const minutes = Number(str(fd, "minutes") || 30);
  const gap = Number(str(fd, "gap") || 0);
  const repeat = Math.min(Math.max(Number(str(fd, "repeat_weeks") || 1), 1), 12);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  const f = /^(\d{2}):(\d{2})$/.exec(from);
  if (!m || !f || !(minutes >= 10 && minutes <= 180)) back("/idopontok", { hiba: "Add meg a napot, a kezdést és a hosszt." });
  const t = /^(\d{2}):(\d{2})$/.exec(to);
  const startMin = +f![1] * 60 + +f![2];
  const endMin = t ? +t[1] * 60 + +t[2] : startMin + minutes;
  const rows: { starts_at: string; duration_minutes: number }[] = [];
  for (let w = 0; w < repeat; w++) {
    const d = new Date(Date.UTC(+m![1], +m![2] - 1, +m![3] + 7 * w));
    for (let s = startMin; s + minutes <= endMin; s += minutes + gap) {
      const at = budapestToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), Math.floor(s / 60), s % 60);
      if (at.getTime() > Date.now()) rows.push({ starts_at: at.toISOString(), duration_minutes: minutes });
    }
  }
  if (rows.length === 0) back("/idopontok", { hiba: "Nem keletkezett jövőbeli időpont – ellenőrizd a napot és az órákat." });
  const { error } = await supabase.from("consultation_slots").upsert(rows, { onConflict: "starts_at", ignoreDuplicates: true });
  done("/idopontok", error, `${rows.length} időpont felvéve.`);
}

export async function deleteSlot(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const { error } = await supabase.from("consultation_slots").delete().eq("id", id).is("application_id", null);
  done("/idopontok", error, "Időpont törölve.");
}

export async function setSlotMeet(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const url = optStr(fd, "meet_url");
  if (url && !httpsOrNull(url)) back("/idopontok", { hiba: "A Meet-link https:// kezdetű legyen." });
  const { error } = await supabase.from("consultation_slots").update({ meet_url: url }).eq("id", id);
  done("/idopontok", error, "Meet-link elmentve.");
}

/** A foglalás lemondása: az időpont újra szabad lesz, a jelentkezés visszakerül „új” állapotba. */
export async function cancelBooking(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const notify = fd.get("notify") === "on";
  const { data: slot } = await supabase.from("consultation_slots").select("application_id, starts_at").eq("id", id).single();
  const { error } = await supabase.from("consultation_slots").update({ application_id: null, booked_at: null }).eq("id", id);
  if (!error && slot?.application_id) {
    const { data: app } = await supabase
      .from("applications")
      .update({ status: "uj" })
      .eq("id", slot.application_id)
      .eq("status", "foglalt")
      .select("full_name, email, token")
      .maybeSingle();
    if (notify && app) {
      const site = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
      await sendEmail(
        app.email,
        "Új időpontot kérek a konzultációhoz",
        [
          `Kedves ${app.full_name.split(/\s+/).slice(-1)[0]}!`,
          `Sajnos ez az időpont nekem nem jó: ${fmtFull(slot.starts_at)}. Kérlek, válassz egy újat ezen a linken – elnézést a kényelmetlenségért.`,
        ],
        { href: `${site}/jelentkezes/idopont?t=${app.token}`, label: "Új időpontot választok" },
      );
    }
  }
  done("/idopontok", error, "A foglalást lemondtam, az időpont újra szabad.");
}

// ---------------------------------------------------------------------------
// Jelentkezések
// ---------------------------------------------------------------------------

const STATUSES = ["uj", "foglalt", "konzultalt", "resztvevo", "nem_lett", "archiv"] as const;

export async function setApplicationStatus(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(STATUSES).parse(fd.get("status"));
  const note = optStr(fd, "admin_note");
  const { error } = await supabase.from("applications").update({ status, admin_note: note }).eq("id", id);
  done(`/jelentkezesek/${id}`, error, "Elmentve.");
}

export async function deleteApplication(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) back(`/jelentkezesek/${id}`, { hiba: error.message });
  done("/jelentkezesek", null, "A jelentkezést és a felmérés adatait töröltem.");
}

// ---------------------------------------------------------------------------
// Résztvevők
// ---------------------------------------------------------------------------

const enrollSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  full_name: z.string().trim().min(2).max(120),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  first_session: z.string().optional(),
  meet_url: z.string().optional(),
  application_id: z.string().uuid().optional(),
});

/** Résztvevő felvétele: fiók (ha még nincs), program, alkalmak, üdvözlő levél belépő linkkel. */
export async function enrollParticipant(fd: FormData) {
  await requireAdmin();
  const parsed = enrollSchema.safeParse({
    email: fd.get("email"),
    full_name: fd.get("full_name"),
    starts_on: fd.get("starts_on"),
    first_session: str(fd, "first_session") || undefined,
    meet_url: str(fd, "meet_url") || undefined,
    application_id: str(fd, "application_id") || undefined,
  });
  const from = parsed.success && parsed.data.application_id ? `/jelentkezesek/${parsed.data.application_id}` : "/resztvevok";
  if (!parsed.success) back(from, { hiba: "Add meg a nevet, az e-mail-címet és a kezdés napját." });
  const d = parsed.data;
  const meet = d.meet_url ? httpsOrNull(d.meet_url) : null;
  if (d.meet_url && !meet) back(from, { hiba: "A Meet-link https:// kezdetű legyen." });
  const admin = createAdminClient();

  // 1. Fiók: a meglévőt használjuk, vagy újat hozunk létre (a profil a triggerrel készül).
  let { data: profile } = await admin.from("profiles").select("id, first_name").eq("email", d.email).maybeSingle();
  if (!profile) {
    const parts = d.full_name.split(/\s+/);
    const first = parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
    const last = parts.length > 1 ? parts[0] : "";
    const { data: created, error } = await admin.auth.admin.createUser({
      email: d.email,
      email_confirm: true,
      user_metadata: { first_name: first, last_name: last, display_name: d.full_name },
    });
    if (error || !created.user) back(from, { hiba: `A fiókot nem sikerült létrehozni: ${error?.message ?? "ismeretlen hiba"}` });
    profile = { id: created.user!.id, first_name: first };
  }

  // 2. Program (a Tudatosság alapból a 10. héttől nyílik)
  const s2 = new Date(`${d.starts_on}T12:00:00Z`);
  s2.setUTCDate(s2.getUTCDate() + 63);
  const { data: enr, error: enrErr } = await admin
    .from("program_enrollments")
    .insert({
      user_id: profile!.id,
      application_id: d.application_id ?? null,
      starts_on: d.starts_on,
      stage2_from: s2.toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (enrErr || !enr) {
    back(from, {
      hiba: enrErr?.code === "23505" ? "Ennek a személynek már van aktív programja." : `Nem sikerült felvenni: ${enrErr?.message ?? ""}`,
    });
  }

  // 3. Alkalmak a menetrend szerint (ha megadtad az elsőt)
  const firstIso = budapestLocalToIso(d.first_session);
  let sessions = 0;
  if (firstIso) {
    const rows = sessionSchedule(new Date(firstIso), d.starts_on).map((r) => ({ ...r, enrollment_id: enr!.id, meet_url: meet }));
    const { error } = await admin.from("program_sessions").insert(rows);
    if (!error) sessions = rows.length;
  }

  if (d.application_id) await admin.from("applications").update({ status: "resztvevo" }).eq("id", d.application_id);

  // 4. Üdvözlő levél belépő linkkel
  const link = await magicLinkFor(d.email, tp("/program"));
  const res = await sendEmail(
    d.email,
    "Indul a programod",
    [
      `Kedves ${profile!.first_name || d.full_name}!`,
      "Örülök, hogy együtt dolgozunk. Elkészült a programod felülete: itt találod a tananyagot, a gyakorlási tervedet, a heti beszámolót és az alkalmaink időpontjait.",
      firstIso ? `Az első alkalmunk: ${fmtFull(firstIso)}.` : "Az első alkalmunk időpontját hamarosan beírom a felületre.",
      "Belépni jelszó nélkül tudsz: a lenti gomb egy órán át érvényes, később a belépési oldalon bármikor kérhetsz új linket.",
    ],
    link ? { href: link, label: "Belépek a programomba" } : undefined,
  );
  revalidatePath(tp("/admin"), "layout");
  back(`/resztvevok/${enr!.id}`, {
    ok: `Felvettem.${sessions ? ` ${sessions} alkalom beütemezve.` : ""}${res.ok ? " Az üdvözlő levél kiment." : " Az üdvözlő levél nem ment ki – kérlek, szólj neki te."}`,
  });
}

export async function saveEnrollment(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const stage2 = str(fd, "stage2_from");
  const { error } = await supabase
    .from("program_enrollments")
    .update({
      practice_plan: optStr(fd, "practice_plan"),
      admin_note: optStr(fd, "admin_note"),
      ...(/^\d{4}-\d{2}-\d{2}$/.test(stage2) ? { stage2_from: stage2 } : {}),
    })
    .eq("id", id);
  done(`/resztvevok/${id}`, error, "Elmentve.");
}

export async function notifyPlanUpdated(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const { data: e } = await supabase.from("program_enrollments").select("user_id").eq("id", id).single();
  const { data: p } = e ? await supabase.from("profiles").select("email, first_name").eq("id", e.user_id).single() : { data: null };
  if (!p?.email) back(`/resztvevok/${id}`, { hiba: "Nem találom az e-mail-címét." });
  const res = await sendEmail(
    p!.email,
    "Frissítettem a gyakorlási tervedet",
    [`Kedves ${p!.first_name ?? "Résztvevő"}!`, "Frissítettem a gyakorlási tervedet. A Programom oldalon találod."],
    { href: `${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/program`, label: "Megnézem" },
  );
  back(`/resztvevok/${id}`, res.ok ? { ok: "Értesítettem." } : { hiba: "A levél nem ment ki." });
}

export async function setEnrollmentStatus(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const close = fd.get("close") === "true";
  const { error } = await supabase
    .from("program_enrollments")
    .update(close ? { status: "lezart", closed_at: new Date().toISOString() } : { status: "aktiv", closed_at: null })
    .eq("id", id);
  done(`/resztvevok/${id}`, error, close ? "A programot lezártam." : "A program újra aktív.");
}

export async function addSession(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("enrollment_id"));
  const at = budapestLocalToIso(str(fd, "starts_at"));
  const minutes = Number(str(fd, "minutes") || 60);
  const meet = optStr(fd, "meet_url");
  if (!at) back(`/resztvevok/${id}`, { hiba: "Add meg az időpontot." });
  if (meet && !httpsOrNull(meet)) back(`/resztvevok/${id}`, { hiba: "A Meet-link https:// kezdetű legyen." });
  const { error } = await supabase.from("program_sessions").insert({ enrollment_id: id, starts_at: at!, duration_minutes: minutes, meet_url: meet });
  done(`/resztvevok/${id}`, error, "Alkalom felvéve.");
}

export async function generateSessions(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("enrollment_id"));
  const at = budapestLocalToIso(str(fd, "first_session"));
  const meet = optStr(fd, "meet_url");
  if (!at) back(`/resztvevok/${id}`, { hiba: "Add meg az első alkalom időpontját." });
  const { data: e } = await supabase.from("program_enrollments").select("starts_on").eq("id", id).single();
  const rows = sessionSchedule(new Date(at!), e!.starts_on).map((r) => ({ ...r, enrollment_id: id, meet_url: httpsOrNull(meet) }));
  const { error } = await supabase.from("program_sessions").insert(rows);
  done(`/resztvevok/${id}`, error, `${rows.length} alkalom beütemezve.`);
}

export async function updateSession(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const enrollment = uuid.parse(fd.get("enrollment_id"));
  if (fd.get("delete") === "1") {
    const { error } = await supabase.from("program_sessions").delete().eq("id", id);
    done(`/resztvevok/${enrollment}`, error, "Alkalom törölve.");
  }
  const at = budapestLocalToIso(str(fd, "starts_at"));
  const meet = optStr(fd, "meet_url");
  if (meet && !httpsOrNull(meet)) back(`/resztvevok/${enrollment}`, { hiba: "A Meet-link https:// kezdetű legyen." });
  const status = z.enum(["tervezett", "megtartott", "elmaradt"]).parse(fd.get("status"));
  const { error } = await supabase
    .from("program_sessions")
    .update({
      ...(at ? { starts_at: at } : {}),
      duration_minutes: Number(str(fd, "minutes") || 60),
      meet_url: meet,
      status,
      note: optStr(fd, "note"),
    })
    .eq("id", id);
  done(`/resztvevok/${enrollment}`, error, "Alkalom elmentve.");
}

/** Minden jövőbeli alkalomra ugyanaz a Meet-link (pl. egy állandó, ismétlődő hívás). */
export async function setAllMeet(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("enrollment_id"));
  const meet = optStr(fd, "meet_url");
  if (!meet || !httpsOrNull(meet)) back(`/resztvevok/${id}`, { hiba: "A Meet-link https:// kezdetű legyen." });
  const { error } = await supabase
    .from("program_sessions")
    .update({ meet_url: meet })
    .eq("enrollment_id", id)
    .gte("starts_at", new Date().toISOString());
  done(`/resztvevok/${id}`, error, "A Meet-link minden jövőbeli alkalomra beállítva.");
}

export async function replyReport(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const enrollment = uuid.parse(fd.get("enrollment_id"));
  const reply = optStr(fd, "admin_reply");
  const { error } = await supabase
    .from("weekly_reports")
    .update({ admin_reply: reply, replied_at: reply ? new Date().toISOString() : null })
    .eq("id", id);
  if (!error && reply && fd.get("notify") === "on") {
    const { data: e } = await supabase.from("program_enrollments").select("user_id").eq("id", enrollment).single();
    const { data: p } = e ? await supabase.from("profiles").select("email, first_name").eq("id", e.user_id).single() : { data: null };
    if (p?.email) {
      await sendEmail(
        p.email,
        "Visszajeleztem a heti beszámolódra",
        [`Kedves ${p.first_name ?? "Résztvevő"}!`, "Elolvastam a heti beszámolódat, és visszajeleztem rá."],
        { href: `${publicEnv.NEXT_PUBLIC_TARSASAG_URL.replace(/\/$/, "")}/beszamolo`, label: "Elolvasom" },
      );
    }
  }
  done(`/resztvevok/${enrollment}`, error, "Visszajelzés elmentve.");
}

// ---------------------------------------------------------------------------
// Céges ajánlatkérések
// ---------------------------------------------------------------------------

export async function setInquiryStatus(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const status = z.enum(["uj", "folyamatban", "ajanlat_kiment", "megnyert", "nem_lett"]).parse(fd.get("status"));
  const { error } = await supabase.from("business_inquiries").update({ status, admin_note: optStr(fd, "admin_note") }).eq("id", id);
  done(`/ajanlatkeresek/${id}`, error, "Elmentve.");
}

export async function deleteInquiry(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const { error } = await supabase.from("business_inquiries").delete().eq("id", id);
  if (error) back(`/ajanlatkeresek/${id}`, { hiba: error.message });
  done("/ajanlatkeresek", null, "Az ajánlatkérést töröltem.");
}

// ---------------------------------------------------------------------------
// Fizetési link (egyéni program)
// ---------------------------------------------------------------------------

export async function createPaymentOffer(fd: FormData) {
  const { supabase } = await requireAdmin();
  const applicationId = str(fd, "application_id") || null;
  const from = applicationId ? `/jelentkezesek/${applicationId}` : "/resztvevok";
  const parsed = z
    .object({ full_name: z.string().trim().min(2).max(120), email: z.string().trim().toLowerCase().email(), starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
    .safeParse({ full_name: fd.get("full_name"), email: fd.get("email"), starts_on: fd.get("starts_on") });
  if (!parsed.success) back(from, { hiba: "Add meg a nevet, az e-mail-címet és a kezdés napját." });
  const d = parsed.data!;
  const { data: offer, error } = await supabase
    .from("program_payment_offers")
    .insert({ application_id: applicationId, full_name: d.full_name, email: d.email, starts_on: d.starts_on })
    .select("token")
    .single();
  if (error || !offer) back(from, { hiba: error?.message ?? "Nem sikerült létrehozni a linket." });
  const url = `${publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/fizetes?t=${offer!.token}`;
  const first = d.full_name.split(/\s+/).slice(-1)[0];
  const res = await sendEmail(
    d.email,
    "A programod fizetése",
    [
      `Kedves ${first}!`,
      "Köszönöm a beszélgetést, örülök, hogy együtt dolgozunk. Ezen a linken választhatod ki a fizetés módját – egy összegben, négy havi részletben vagy havonta –, és a Stripe biztonságos oldalán fizethetsz.",
      `A programod kezdete: ${new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${d.starts_on}T12:00:00Z`))}. A fizetés után e-mailben megkapod a belépő linket a programod felületére.`,
    ],
    { href: url, label: "Kiválasztom a fizetési módot" },
  );
  revalidatePath(tp("/admin"), "layout");
  back(from, res.ok ? { ok: "A fizetési linket elküldtem." } : { hiba: `A link elkészült, de a levél nem ment ki. Küldd el te: ${url}` });
}

export async function revokePaymentOffer(fd: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(fd.get("id"));
  const from = str(fd, "from") || "/jelentkezesek";
  const { error } = await supabase.from("program_payment_offers").update({ status: "visszavonva" }).eq("id", id).eq("status", "kikuldve");
  done(from, error, "A fizetési linket visszavontam.");
}
