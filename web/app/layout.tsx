import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sora = Sora({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://nakoahub.com"),
  title: { default: "Nakoa — Imprimer commence ici.", template: "%s · Nakoa" },
  description:
    "Nakoa — Plateforme SaaS d'impression : marketplace intelligente, ERP de production et IA — pour l'Afrique de l'Ouest.",
  keywords: ["imprimerie", "impression", "marketplace", "Côte d'Ivoire", "Mobile Money", "Paystack"],
  authors: [{ name: "Nakoa" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://nakoahub.com",
    title: "Nakoa — Imprimer commence ici",
    description: "Imprimez. Livrez. Brillez. La plateforme intelligente d'impression pour l'Afrique de l'Ouest.",
    siteName: "Nakoa",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nakoa — Imprimer commence ici",
    description: "Imprimez. Livrez. Brillez.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0710" }, // teinte chaude Nakoa
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
