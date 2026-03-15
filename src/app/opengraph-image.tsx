/**
 * Dynamic OG Image for AgentFlow Pro
 * Only used for social sharing - not critical for app functionality
 */

import { Metadata } from "next";

export const metadata: Metadata = {
  openGraph: {
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AgentFlow Pro - AI-powered property management",
      },
    ],
  },
};

export default function OpenGraphImageRoute() {
  return null;
}
