import type { Metadata } from "next";
import "./globals.css";
import { ThemeInit } from "./theme-init";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Nav } from "@/web/components/Nav";
import { ErrorBoundary } from "@/web/components/ErrorBoundary";
import { AnalyticsLoader } from "@/web/components/AnalyticsLoader";
import { FloatingAssistant } from "@/web/components/FloatingAssistant";

const inter = Inter({ subsets: ["latin"] });

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
    languages: {
      sl: "/",
      en: "/",
      "x-default": "/",
    },
  },
  title: {
    default: "AgentFlow Pro: Edina AI platforma, ki ustvari vsebino IN sinhronizira rezervacije",
    template: "%s | AgentFlow Pro",
  },
  description:
    "AI platforma za turizem: ustvarja opise nastanitev, emaile za goste in landing strani; sinhronizira rezervacije iz Booking.com, Airbnb in PMS. Multi-jezik, SEO optimizirano.",
  keywords: ["AI", "turizem", "vsebina", "hotel", "agentflow", "booking"],
  authors: [{ name: "AgentFlow Pro" }],
  openGraph: {
    title: "AgentFlow Pro: Edina AI platforma, ki ustvari vsebino IN sinhronizira rezervacije",
    description: "Vsebina + sinhronizacija rezervacij. Opisi, emaili, landing strani – multi-jezik.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentFlow Pro: Edina AI platforma, ki ustvari vsebino IN sinhronizira rezervacije",
    description: "Od AI besedila do polnega koledarja – vse v enem orodju za turizem.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl" suppressHydrationWarning>
      <head>
        <ThemeInit />
      </head>
      <body className={inter.className}>
        <AnalyticsLoader />
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
            aria-label="Preskoči na vsebino"
          >
            Preskoči na vsebino
          </a>
          <Nav />
          <ErrorBoundary>
            <div id="main" tabIndex={-1}>
              {children}
            </div>
          </ErrorBoundary>
          <FloatingAssistant />
        </Providers>
      </body>
    </html>
  );
}
