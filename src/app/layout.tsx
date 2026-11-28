import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { themeInitScript } from "@/components/theme";
import { resolvedSiteUrl } from "@/lib/site";

const TITLE = "Kardos Bálint · Acélidegek Mentorprogram";
const DESCRIPTION =
  "Vedd újra a kezedbe az életed irányítását. 16 hetes, személyes online mentorálás szakértőknek és vezetőknek – nyugalom nyomás alatt.";

export const metadata: Metadata = {
  metadataBase: new URL(resolvedSiteUrl()),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "hu_HU",
    siteName: "Kardos Bálint",
    title: "Vedd újra a kezedbe az életed irányítását.",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-paper text-ink antialiased">
        {children}
        {/* Süti nélküli, összesített látogatottságmérés (Vercel Web Analytics). */}
        <Analytics />
      </body>
    </html>
  );
}
