"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { tp } from "@/lib/site";

const uuid = z.string().uuid();
const refresh = () => revalidatePath(tp("/kozosseg"), "layout");

/** Hibánál visszairányítunk üzenettel; az RLS dönti el, ki mit írhat. */
function fail(path: string, msg: string): never {
  redirect(`${tp(path)}?hiba=${encodeURIComponent(msg)}`);
}

export async function createPost(formData: FormData) {
  const parsed = z
    .object({ title: z.string().trim().max(200), body: z.string().trim().min(1).max(10000) })
    .safeParse({ title: formData.get("title") ?? "", body: formData.get("body") ?? "" });
  if (!parsed.success) fail("/kozosseg", "Írj legalább néhány szót (legfeljebb 10 000 karakter).");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({ title: parsed.data.title || null, body: parsed.data.body })
    .select("id")
    .single();
  if (error) fail("/kozosseg", "A bejegyzés most nem ment el. Próbáld újra kicsit később.");
  refresh();
  redirect(tp(`/kozosseg/${data.id}`));
}

export async function addComment(formData: FormData) {
  const postId = uuid.parse(formData.get("postId"));
  const body = z.string().trim().min(1).max(5000).safeParse(formData.get("body"));
  if (!body.success) fail(`/kozosseg/${postId}`, "A hozzászólás 1–5000 karakter lehet.");
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({ post_id: postId, body: body.data });
  if (error) fail(`/kozosseg/${postId}`, "A hozzászólás most nem ment el.");
  refresh();
  redirect(tp(`/kozosseg/${postId}#hozzaszolasok`));
}

async function toggleReaction(formData: FormData, kind: "koszonom" | "hasonlot") {
  const postId = uuid.parse(formData.get("postId"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { data: existing } = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("kind", kind)
    .maybeSingle();
  if (existing) {
    await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id).eq("kind", kind);
  } else {
    await supabase.from("post_reactions").insert({ post_id: postId, kind });
  }
  refresh();
}

// A gombok name/value-ja nem jut át megbízhatóan, ezért reakciónként külön action.
export async function toggleThanks(formData: FormData) {
  return toggleReaction(formData, "koszonom");
}
export async function toggleSimilar(formData: FormData) {
  return toggleReaction(formData, "hasonlot");
}

export async function editPost(formData: FormData) {
  const id = uuid.parse(formData.get("id"));
  const parsed = z
    .object({ title: z.string().trim().max(200), body: z.string().trim().min(1).max(10000) })
    .safeParse({ title: formData.get("title") ?? "", body: formData.get("body") ?? "" });
  if (!parsed.success) fail(`/kozosseg/${id}`, "A bejegyzés nem lehet üres.");
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ title: parsed.data.title || null, body: parsed.data.body }).eq("id", id);
  if (error) fail(`/kozosseg/${id}`, "A módosítás nem ment el.");
  refresh();
}

export async function deletePost(formData: FormData) {
  const id = uuid.parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) fail(`/kozosseg/${id}`, "A törlés nem sikerült.");
  refresh();
  redirect(tp("/kozosseg"));
}

export async function deleteComment(formData: FormData) {
  const id = uuid.parse(formData.get("id"));
  const postId = uuid.parse(formData.get("postId"));
  const supabase = await createClient();
  await supabase.from("comments").delete().eq("id", id);
  refresh();
  redirect(tp(`/kozosseg/${postId}#hozzaszolasok`));
}

/** Moderáció (csak admin; az adatbázis-trigger és az RLS is ellenőrzi). */
async function setHidden(formData: FormData, table: "posts" | "comments", hidden: boolean) {
  const id = uuid.parse(formData.get("id"));
  const postId = uuid.parse(formData.get("postId"));
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return;
  await supabase.from(table).update({ is_hidden: hidden }).eq("id", id);
  refresh();
  redirect(tp(`/kozosseg/${postId}`));
}
export async function hidePost(formData: FormData) {
  return setHidden(formData, "posts", true);
}
export async function unhidePost(formData: FormData) {
  return setHidden(formData, "posts", false);
}
export async function hideComment(formData: FormData) {
  return setHidden(formData, "comments", true);
}
export async function unhideComment(formData: FormData) {
  return setHidden(formData, "comments", false);
}
