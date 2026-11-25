import { redirect } from "next/navigation";
import { requireMember } from "@/lib/member";
import { tp } from "@/lib/site";
import { Tour } from "./tour";

export const metadata = { title: "Üdv A Társaságban", robots: { index: false, follow: false } };

export default async function WelcomePage() {
  const { profile, hasAccess } = await requireMember();
  if (!hasAccess) redirect(tp("/gyakorlas"));
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-center text-xs uppercase tracking-[0.25em] text-gold">
        Üdv A Társaságban{profile.first_name ? `, ${profile.first_name}` : ""}
      </p>
      <div className="mt-8">
        <Tour hasOrder={Boolean(profile.order_key)} />
      </div>
    </main>
  );
}
