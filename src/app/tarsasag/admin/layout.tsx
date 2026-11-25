import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "./admin-nav";

export const metadata = { title: "Admin · A Társaság", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();
  // Jelvények helyett csendes számok: mennyi dolog vár rád az egyes részeken.
  const [prog, msgs, inv, notes, cons] = await Promise.all([
    supabase.from("progression_requests").select("id", { count: "exact", head: true }).in("status", ["requested", "scheduled"]),
    supabase.rpc("admin_kind_message_queue"),
    supabase.from("invoices").select("id", { count: "exact", head: true }).is("provider_invoice_number", null),
    supabase.from("admin_notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    supabase.from("consultations").select("id", { count: "exact", head: true }).eq("status", "requested"),
  ]);
  const counts: Record<string, number> = {
    "": notes.count ?? 0,
    "/tovabblepes": prog.count ?? 0,
    "/kedves-uzenetek": msgs.data?.length ?? 0,
    "/szamlak": inv.count ?? 0,
    "/konzultaciok": cons.count ?? 0,
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">Admin</p>
      <AdminNav counts={counts} />
      {children}
    </main>
  );
}
