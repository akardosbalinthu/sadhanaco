import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { tp } from "@/lib/site";
import { GildedCard } from "@/components/ornaments";
import type { Database } from "@/lib/supabase/database.types";
import { saveLesson } from "../actions";
import { Empty, Flash, H2, label, one, smallInput, smallPrimary, type SP } from "../ui";
import { SubmitButton } from "../submit-button";

type Lesson = Database["public"]["Tables"]["lessons"]["Row"];

const TRACK = {
  gyakorlas: "Gyakorlás (vezetett hanganyag)",
  tudas: "Tudás (rövid elméleti videó)",
  ritual_reggeli: "Reggeli hangolás",
  ritual_esti: "Esti hangolás",
} as const;
const KIND = { audio: "Hang", video: "Videó", text: "Szöveg" } as const;

function LessonForm({ moduleId, moduleSlug, lesson, maxWeek }: { moduleId: string; moduleSlug: string; lesson?: Lesson; maxWeek: number }) {
  return (
    <form action={saveLesson} className="grid gap-3 sm:grid-cols-6">
      <input type="hidden" name="module_id" value={moduleId} />
      <input type="hidden" name="module_slug" value={moduleSlug} />
      {lesson && <input type="hidden" name="id" value={lesson.id} />}
      <label className="sm:col-span-4">
        <span className={label}>Cím</span>
        <input name="title" required maxLength={200} defaultValue={lesson?.title} className={`${smallInput} mt-1 w-full`} />
      </label>
      <label>
        <span className={label}>Hét</span>
        <input name="week_number" type="number" min={1} max={maxWeek} required defaultValue={lesson?.week_number ?? 1} className={`${smallInput} mt-1 w-full`} />
      </label>
      <label>
        <span className={label}>Sorrend</span>
        <input name="sort_order" type="number" min={0} max={999} defaultValue={lesson?.sort_order ?? 0} className={`${smallInput} mt-1 w-full`} />
      </label>
      <label className="sm:col-span-6">
        <span className={label}>Leírás (a tag látja)</span>
        <textarea name="description" rows={2} maxLength={4000} defaultValue={lesson?.description ?? ""} className={`${smallInput} mt-1 w-full`} />
      </label>
      <label className="sm:col-span-2">
        <span className={label}>Sáv</span>
        <select name="track" defaultValue={lesson?.track ?? "gyakorlas"} className={`${smallInput} mt-1 w-full`}>
          {Object.entries(TRACK).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>Formátum</span>
        <select name="kind" defaultValue={lesson?.kind ?? "audio"} className={`${smallInput} mt-1 w-full`}>
          {Object.entries(KIND).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>Perc</span>
        <input
          name="duration_minutes"
          type="number"
          min={1}
          defaultValue={lesson?.duration_seconds ? Math.round(lesson.duration_seconds / 60) : ""}
          className={`${smallInput} mt-1 w-full`}
        />
      </label>
      <label className="sm:col-span-2">
        <span className={label}>Bunny videó-azonosító</span>
        <input name="bunny_video_id" defaultValue={lesson?.bunny_video_id ?? ""} className={`${smallInput} mt-1 w-full`} />
      </label>
      <div className="flex items-center justify-between gap-3 sm:col-span-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={lesson?.is_published ?? false} className="accent-[var(--color-gold)]" />
          Közzétéve (a tagok látják)
        </label>
        <SubmitButton className={smallPrimary}>{lesson ? "Mentés" : "Lecke felvétele"}</SubmitButton>
      </div>
    </form>
  );
}

export default async function AdminCurriculum({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: modules } = await supabase.from("modules").select("*").order("stage").order("created_at");
  const slug = one(sp.modul) || modules?.[0]?.slug || "";
  const mod = modules?.find((m) => m.slug === slug);
  const { data: lessons } = mod
    ? await supabase.from("lessons").select("*").eq("module_id", mod.id).order("week_number").order("sort_order").order("created_at")
    : { data: [] as Lesson[] };
  const maxWeek = Math.min(9, mod?.total_weeks ?? 9);
  const byWeek = new Map<number, Lesson[]>();
  for (const l of lessons ?? []) byWeek.set(l.week_number, [...(byWeek.get(l.week_number) ?? []), l]);

  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <nav className="flex flex-wrap gap-2">
        {(modules ?? []).map((m) => (
          <Link
            key={m.id}
            href={tp(`/admin/tananyag?modul=${m.slug}`)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors duration-300 ${
              m.slug === slug ? "border-gold text-forest" : "border-line text-ink-soft hover:border-gold/60"
            }`}
          >
            {m.title}
          </Link>
        ))}
      </nav>

      {!mod ? (
        <Empty>Nincs még modul az adatbázisban.</Empty>
      ) : (
        <>
          <section>
            <H2>{mod.title}</H2>
            {mod.subtitle && <p className="mt-1 text-sm text-gold">{mod.subtitle}</p>}
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              A leckék hetente nyílnak, a tag egyéni belépésétől számítva. Csak a közzétett leckék látszanak; a
              nyilvános leírásokban ne szerepeljen konkrét gyakorlatnév.
            </p>
          </section>

          {[...byWeek.entries()].map(([week, list]) => (
            <section key={week}>
              <h3 className="font-serif text-lg text-forest">{week === 9 ? "+1. hét – lezárás" : `${week}. hét`}</h3>
              <ul className="mt-4 space-y-3">
                {list.map((l) => (
                  <li key={l.id}>
                    <details className="group">
                      <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 rounded-md border border-line px-4 py-3 text-sm transition-colors duration-300 hover:border-gold/60">
                        <span className="text-forest">{l.title}</span>
                        <span className="text-ink-soft">
                          {TRACK[l.track as keyof typeof TRACK] ?? l.track} · {KIND[l.kind]}
                          {l.duration_seconds ? ` · ${Math.round(l.duration_seconds / 60)} perc` : ""}
                        </span>
                        <span className={`ml-auto text-xs ${l.is_published ? "text-gold" : "text-ink-soft"}`}>
                          {l.is_published ? "közzétéve" : "piszkozat"}
                          {!l.bunny_video_id && l.kind !== "text" && " · nincs média"}
                        </span>
                      </summary>
                      <GildedCard className="mt-2">
                        <LessonForm moduleId={mod.id} moduleSlug={mod.slug} lesson={l} maxWeek={maxWeek} />
                      </GildedCard>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {(lessons ?? []).length === 0 && <Empty>Ebben a modulban még nincs lecke.</Empty>}

          <section>
            <H2>Új lecke</H2>
            <GildedCard className="mt-6">
              <LessonForm moduleId={mod.id} moduleSlug={mod.slug} maxWeek={maxWeek} />
            </GildedCard>
          </section>
        </>
      )}
    </div>
  );
}
