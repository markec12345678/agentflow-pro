"use client";

// Sentry disabled temporarily to fix worker thread errors
// import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
          <h1>Error</h1>
          <p>{error.message}</p>
        </div>
      </body>
    </html>
  );
}
