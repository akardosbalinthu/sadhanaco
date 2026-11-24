import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kardos Bálint · A Társaság",
  description: "Jelenlét – Tudatosság – Szabadság. Kardos Bálint és A Társaság.",
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
