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
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3002");

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
    default:
      "AgentFlow Pro: The Only AI Platform That Creates Content AND Syncs Reservations",
    template: "%s | AgentFlow Pro",
  },
  description:
    "AI platform for tourism: creates accommodation descriptions, guest emails, and landing pages; syncs reservations from Booking.com, Airbnb, and PMS. Multi-language, SEO optimized.",
  keywords: ["AI", "tourism", "content", "hotel", "agentflow", "booking"],
  authors: [{ name: "AgentFlow Pro" }],
  openGraph: {
    title:
      "AgentFlow Pro: The Only AI Platform That Creates Content AND Syncs Reservations",
    description:
      "Content + reservation sync. Descriptions, emails, landing pages – multi-language.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "AgentFlow Pro: The Only AI Platform That Creates Content AND Syncs Reservations",
    description:
      "From AI text to a full calendar – all in one tool for tourism.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className={inter.className}>
        <ThemeInit />
        <AnalyticsLoader />
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-9999 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
            aria-label="Skip to main content"
          >
            Skip to main content
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
