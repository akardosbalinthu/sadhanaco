import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sadhana Idegrendszerfejlesztő Társaság",
  description: "Jelenlét – Tudatosság – Szabadság. Közös gyakorlótér Kardos Bálinttal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
