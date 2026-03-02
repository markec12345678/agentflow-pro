import type { Metadata } from "next";
import "./globals.css";
import { ThemeInit } from "./theme-init";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Nav } from "@/web/components/Nav";
import { ErrorBoundary } from "@/web/components/ErrorBoundary";
import { AnalyticsLoader } from "@/web/components/AnalyticsLoader";
import { FloatingAssistant } from "@/web/components/FloatingAssistant";

// Service Worker Registration Component
function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                  console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                  console.log('SW registration failed: ', registrationError);
                });
            });
          }
        `,
      }}
    />
  );
}

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
      "AgentFlow Pro: AI Automation for Tourism | 8 Agents, eTurizem, GDPR",
    template: "%s | AgentFlow Pro",
  },
  description:
    "AI automation for tourism – 8 specialized agents, eTurizem integration, GDPR compliant. Save 10+ hours weekly with automatic reservations, guest communication, and marketing.",
  keywords: ["AI", "automation", "tourism", "hotel", "slovenia", "eturizem", "gdpr", "reservations"],
  authors: [{ name: "AgentFlow Pro" }],
  openGraph: {
    title: "AgentFlow Pro – AI Automation for Tourism",
    description: "8 AI agents to automate your hotel. eTurizem integration, GDPR compliant, 20+ languages. Save 10+ hours weekly.",
    url: baseUrl,
    siteName: "AgentFlow Pro",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "AgentFlow Pro - AI Automation for Tourism",
      },
    ],
    locale: "sl_SI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentFlow Pro – AI Automation for Tourism",
    description: "8 AI agents to automate your hotel. eTurizem integration, GDPR compliant.",
    images: [`${baseUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
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
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AgentFlow Pro" />
        
        {/* Android */}
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Service Worker Registration */}
        <ServiceWorkerRegistration />
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
