import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Nav } from "@/web/components/Nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AgentFlow Pro - AI-Powered Business Automation",
    template: "%s | AgentFlow Pro",
  },
  description:
    "Multi-Agent AI Platform for Business Automation. Build workflows with Research, Content, Code, and Deploy agents. Ship in hours, not weeks.",
  keywords: ["AI", "automation", "workflows", "agents", "business automation"],
  authors: [{ name: "AgentFlow Pro" }],
  openGraph: {
    title: "AgentFlow Pro - AI-Powered Business Automation",
    description:
      "Build custom workflows with 4 intelligent AI agents. Research, Content, Code, and Deploy – all in one platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentFlow Pro - AI-Powered Business Automation",
    description: "Build custom workflows with 4 intelligent AI agents.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
