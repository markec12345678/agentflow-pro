/**
 * App Icon - Static Metadata
 * 
 * Provides favicon for the application
 * Uses static file from /public folder
 * 
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/icons
 */

import { Metadata } from 'next';

/**
 * Static metadata for favicon
 * Points to /public/favicon.ico
 */
export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
      },
    ],
    shortcut: '/favicon.ico',
  },
};

/**
 * Icon component
 * Returns null - icon is served statically
 */
export default function Icon() {
  return null;
}
