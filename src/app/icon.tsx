/**
 * Static icon - avoids dynamic font loading issues
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  icons: [
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export default function Icon() {
  return null;
}
