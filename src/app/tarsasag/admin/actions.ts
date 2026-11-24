"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { back, budapestLocalToIso, requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";

const uuid = z.string().uuid();
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optStr = (fd: FormData, k: string) => str(fd, k) || null;
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
const intOrNull = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v === "") return null;
  const n = Number(v.replace(/\s/g, ""));
  return Number.isFinite(n) ? Math.round(n) : NaN;
};

function done(path: string, error: { message: string } | null, ok: string): never {
  revalidatePath(tp("/admin"), "layout");
  back(path, error ? { hiba: error.message } : { ok });
}

// ---------------------------------------------------------------------------
// Áttekintés
// ---------------------------------------------------------------------------

export async function setRegistrationOpen(formData: FormData) {
  const { supabase } = await requireAdmin();
  const open = formData.get("open") === "true";
  const { error } = await supabase.from("app_settings").update({ registration_open: open }).eq("id", true);
  done("", error, open ? "Az új jelentkezések megnyitva." : "Az új jelentkezések lezárva.");
}

export async function markNotificationRead(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const { error } = await supabase.from("admin_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  done("", error, "Értesítés kipipálva.");
}

// ---------------------------------------------------------------------------
// Tagok
// ---------------------------------------------------------------------------

export async function setUnlocks(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const { data: cur } = await supabase.from("profiles").select("m2_unlocked, ip3_unlocked, retreat_unlocked").eq("id", id).single();
  const now = new Date().toISOString();
  const m2 = bool(formData, "m2_unlocked");
  const ip3 = bool(formData, "ip3_unlocked");
  const retreat = bool(formData, "retreat_unlocked");
  const { error } = await supabase
    .from("profiles")
    .update({
      m2_unlocked: m2,
      ip3_unlocked: ip3,
      retreat_unlocked: retreat,
      ...(m2 && !cur?.m2_unlocked ? { m2_unlocked_at: now } : {}),
      ...(ip3 && !cur?.ip3_unlocked ? { ip3_unlocked_at: now } : {}),
    })
    .eq("id", id);
  done(`/tagok?tag=${id}`, error, "A lépcsők mentve.");
}

export async function setRole(formData: FormData) {
  const { supabase, isSuperadmin, user } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const role = z.enum(["member", "admin"]).parse(formData.get("role"));
  if (!isSuperadmin) back(`/tagok?tag=${id}`, { hiba: "Szerepkört csak superadmin oszthat." });
  if (id === user.id) back(`/tagok?tag=${id}`, { hiba: "A saját szerepköröd nem módosíthatod." });
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  done(`/tagok?tag=${id}`, error, "Szerepkör mentve.");
}

export async function setOrder(formData: FormData) {
  const { supabase, isSuperadmin } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const order = z.enum(["tundek", "kertorzok", "torpok", "vandorok"]).parse(formData.get("order"));
  if (!isSuperadmin) back(`/tagok?tag=${id}`, { hiba: "A rendet csak superadmin javíthatja." });
  const { error } = await supabase.rpc("superadmin_set_order", { p_user: id, p_order: order });
  done(`/tagok?tag=${id}`, error, "A rend javítva.");
}

// ---------------------------------------------------------------------------
// Továbblépések
// ---------------------------------------------------------------------------

export async function scheduleConsultation(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const at = budapestLocalToIso(str(formData, "consultation_at"));
  if (!at) back("/tovabblepes", { hiba: "Add meg a konzultáció időpontját." });
  const { error } = await supabase
    .from("progression_requests")
    .update({ consultation_at: at, status: "scheduled", admin_note: optStr(formData, "admin_note") })
    .eq("id", id);
  done("/tovabblepes", error, "A konzultáció időpontja rögzítve.");
}

// A gombok értéke (name/value) nem jut el megbízhatóan a Server Actionig, ezért
// minden döntésnek saját action-je van (a gombokon formAction-nel).
export async function approveProgression(formData: FormData) {
  return decideProgression(formData, true);
}
export async function declineProgression(formData: FormData) {
  return decideProgression(formData, false);
}

async function decideProgression(formData: FormData, approve: boolean) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const { error } = await supabase.rpc("admin_decide_progression", {
    p_request_id: id,
    p_approve: approve,
    p_admin_note: optStr(formData, "admin_note") ?? undefined,
  });
  done("/tovabblepes", error, approve ? "A lépcső megnyitva." : "A kérés elutasítva.");
}

// ---------------------------------------------------------------------------
// Kedves Üzenetek
// ---------------------------------------------------------------------------

export async function kindMessageDelivered(formData: FormData) {
  return recordKindMessageAttempt(formData, true);
}
export async function kindMessageAttemptFailed(formData: FormData) {
  return recordKindMessageAttempt(formData, false);
}

async function recordKindMessageAttempt(formData: FormData, success: boolean) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const { error } = await supabase.rpc("admin_record_kind_message_attempt", {
    p_message: id,
    p_success: success,
    p_note: optStr(formData, "note") ?? undefined,
  });
  done("/kedves-uzenetek", error, success ? "Kézbesítve. Köszönöm!" : "A sikertelen próbálkozás rögzítve.");
}

export async function closeKindMessageDelivered(formData: FormData) {
  return closeKindMessage(formData, false);
}
export async function closeKindMessageFailed(formData: FormData) {
  return closeKindMessage(formData, true);
}

async function closeKindMessage(formData: FormData, failed: boolean) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const { error } = await supabase.rpc("admin_close_kind_message", {
    p_message: id,
    p_failed: failed,
    p_note: optStr(formData, "note") ?? undefined,
  });
  done("/kedves-uzenetek", error, failed ? "Az üzenet sikertelenként lezárva." : "Az üzenet kézbesítettként lezárva.");
}

// ---------------------------------------------------------------------------
// Számlák
// ---------------------------------------------------------------------------

export async function setInvoiceNumber(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const number = z.string().trim().min(1).max(100).safeParse(formData.get("number"));
  if (!number.success) back("/szamlak", { hiba: "Add meg a számla sorszámát." });
  const { error } = await supabase.from("invoices").update({ provider_invoice_number: number.data }).eq("id", id);
  done("/szamlak", error, `A sorszám rögzítve: ${number.data}`);
}

// ---------------------------------------------------------------------------
// Tananyag
// ---------------------------------------------------------------------------

const TRACKS = ["gyakorlas", "tudas", "ritual_reggeli", "ritual_esti"] as const;

export async function saveLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = optStr(formData, "id");
  const moduleSlug = str(formData, "module_slug");
  const minutes = intOrNull(formData, "duration_minutes");
  const parsed = z
    .object({
      module_id: uuid,
      title: z.string().min(1).max(200),
      description: z.string().max(4000).nullable(),
      week_number: z.number().int().min(1).max(9),
      sort_order: z.number().int().min(0).max(999),
      kind: z.enum(["video", "audio", "text"]),
      track: z.enum(TRACKS),
      bunny_video_id: z.string().max(200).nullable(),
      duration_seconds: z.number().int().positive().nullable(),
      is_published: z.boolean(),
    })
    .safeParse({
      module_id: str(formData, "module_id"),
      title: str(formData, "title"),
      description: optStr(formData, "description"),
      week_number: intOrNull(formData, "week_number"),
      sort_order: intOrNull(formData, "sort_order") ?? 0,
      kind: str(formData, "kind"),
      track: str(formData, "track"),
      bunny_video_id: optStr(formData, "bunny_video_id"),
      duration_seconds: minutes == null ? null : minutes * 60,
      is_published: bool(formData, "is_published"),
    });
  const path = `/tananyag?modul=${encodeURIComponent(moduleSlug)}`;
  if (!parsed.success) back(path, { hiba: "Ellenőrizd a mezőket (cím, hét 1–9, időtartam percben)." });
  const { error } = id
    ? await supabase.from("lessons").update(parsed.data).eq("id", uuid.parse(id))
    : await supabase.from("lessons").insert(parsed.data);
  done(path, error, id ? "A lecke mentve." : "Az új lecke felvéve.");
}

// ---------------------------------------------------------------------------
// Események
// ---------------------------------------------------------------------------

const EVENT_KINDS = ["nyilt_est", "gyakorlonap", "elvonulas", "online_meditacio", "qa_elo", "tura"] as const;

/** Alapértékek típusonként (CLAUDE.md 5. és 7. pont); az űrlapon felülírhatók. */
const EVENT_DEFAULTS: Record<
  (typeof EVENT_KINDS)[number],
  { tarsasagi: number; belso: number; external: number | null; membersOnly: boolean; retreat: boolean; allowed: ("tarsasagi" | "belso_kor")[] }
> = {
  nyilt_est: { tarsasagi: 3200, belso: 0, external: 4940, membersOnly: false, retreat: false, allowed: ["tarsasagi", "belso_kor"] },
  gyakorlonap: { tarsasagi: 6460, belso: 0, external: null, membersOnly: true, retreat: false, allowed: ["tarsasagi", "belso_kor"] },
  elvonulas: { tarsasagi: 0, belso: 0, external: null, membersOnly: true, retreat: true, allowed: ["tarsasagi", "belso_kor"] },
  online_meditacio: { tarsasagi: 0, belso: 0, external: null, membersOnly: true, retreat: false, allowed: ["tarsasagi", "belso_kor"] },
  qa_elo: { tarsasagi: 0, belso: 0, external: null, membersOnly: true, retreat: false, allowed: ["belso_kor"] },
  tura: { tarsasagi: 0, belso: 0, external: null, membersOnly: true, retreat: false, allowed: ["tarsasagi", "belso_kor"] },
};

export async function createEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const kind = z.enum(EVENT_KINDS).safeParse(formData.get("kind"));
  if (!kind.success) back("/esemenyek", { hiba: "Válaszd ki az esemény típusát." });
  const d = EVENT_DEFAULTS[kind.data];
  const startsAt = budapestLocalToIso(str(formData, "starts_at"));
  const title = str(formData, "title");
  if (!startsAt || !title) back("/esemenyek", { hiba: "A cím és a kezdés időpontja kötelező." });

  const pick = (k: string, fallback: number | null) => {
    const v = intOrNull(formData, k);
    return v === null ? fallback : v;
  };
  const isTura = kind.data === "tura";
  const row = {
    kind: kind.data,
    title,
    description: optStr(formData, "description"),
    location: optStr(formData, "location"),
    is_online: bool(formData, "is_online"),
    starts_at: startsAt,
    ends_at: budapestLocalToIso(str(formData, "ends_at")),
    capacity: intOrNull(formData, "capacity"),
    members_only: isTura ? true : kind.data === "nyilt_est" ? false : d.membersOnly,
    allowed_tiers: d.allowed,
    requires_retreat_unlock: d.retreat,
    registration_opens_at: budapestLocalToIso(str(formData, "registration_opens_at")) ?? new Date().toISOString(),
    registration_closes_at: budapestLocalToIso(str(formData, "registration_closes_at")),
    price_tarsasagi_huf: isTura ? 0 : (pick("price_tarsasagi_huf", d.tarsasagi) ?? 0),
    price_belso_kor_huf: isTura ? 0 : (pick("price_belso_kor_huf", d.belso) ?? 0),
    price_external_huf: isTura || d.membersOnly ? null : pick("price_external_huf", d.external),
    is_published: bool(formData, "is_published"),
  };
  if ([row.capacity, row.price_tarsasagi_huf, row.price_belso_kor_huf, row.price_external_huf].some((n) => Number.isNaN(n))) {
    back("/esemenyek", { hiba: "A létszám és az árak csak számok lehetnek." });
  }
  const { data, error } = await supabase.from("events").insert(row).select("id").single();
  if (error) back("/esemenyek", { hiba: error.message });
  revalidatePath(tp("/admin"), "layout");
  back(`/esemenyek?esemeny=${data.id}`, { ok: "Az esemény létrejött." });
}

export async function publishEvent(formData: FormData) {
  return setEventState(formData, "publish");
}
export async function unpublishEvent(formData: FormData) {
  return setEventState(formData, "unpublish");
}
export async function cancelEvent(formData: FormData) {
  return setEventState(formData, "cancel");
}

async function setEventState(formData: FormData, op: "publish" | "unpublish" | "cancel") {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const patch =
    op === "publish" ? { is_published: true } : op === "unpublish" ? { is_published: false } : { cancelled_at: new Date().toISOString() };
  const { error } = await supabase.from("events").update(patch).eq("id", id);
  done(`/esemenyek?esemeny=${id}`, error, op === "cancel" ? "Az esemény lemondva." : "Mentve.");
}

export async function markAttended(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const eventId = uuid.parse(formData.get("event_id"));
  const attended = formData.get("attended") === "true";
  const { error } = await supabase
    .from("event_registrations")
    .update({ attended_at: attended ? new Date().toISOString() : null })
    .eq("id", id);
  done(`/esemenyek?esemeny=${eventId}`, error, attended ? "Jelenlét rögzítve." : "Jelenlét visszavonva.");
}

// ---------------------------------------------------------------------------
// Túra-szavazások
// ---------------------------------------------------------------------------

export async function createPoll(formData: FormData) {
  const { supabase } = await requireAdmin();
  const month = str(formData, "month"); // ÉÉÉÉ-HH
  const closesAt = budapestLocalToIso(str(formData, "closes_at"));
  const options = str(formData, "options")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!/^\d{4}-\d{2}$/.test(month) || !closesAt) back("/turak", { hiba: "Add meg a hónapot és a szavazás zárását." });
  if (options.length < 5 || options.length > 10) back("/turak", { hiba: "5–10 úti célt adj meg, soronként egyet." });

  const { data: poll, error } = await supabase
    .from("destination_polls")
    .insert({
      month: `${month}-01`,
      title: str(formData, "title") || "Hová menjünk túrázni?",
      description: optStr(formData, "description"),
      opens_at: new Date().toISOString(),
      closes_at: closesAt,
    })
    .select("id")
    .single();
  if (error) back("/turak", { hiba: error.message });

  const { error: optError } = await supabase.from("destination_options").insert(
    options.map((line) => {
      const [name, ...rest] = line.split(" — ");
      return { poll_id: poll.id, name: name.slice(0, 120), description: rest.join(" — ").slice(0, 1000) || null };
    }),
  );
  if (optError) await supabase.from("destination_polls").delete().eq("id", poll.id);
  done("/turak", optError, "A szavazás kiírva.");
}

export async function closePoll(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const optionId = optStr(formData, "option_id");
  const { error } = await supabase.rpc("admin_close_destination_poll", {
    p_poll_id: id,
    p_option_id: optionId ? uuid.parse(optionId) : undefined,
  });
  done("/turak", error, "A szavazás lezárva.");
}

export async function linkPollEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = uuid.parse(formData.get("id"));
  const eventId = uuid.parse(formData.get("event_id"));
  const { error } = await supabase.from("destination_polls").update({ event_id: eventId }).eq("id", id);
  done("/turak", error, "A túra hozzárendelve.");
}
