/**
 * Standalone CSRF endpoint - workaround for [...nextauth] 500 on catch-all.
 * Replicates NextAuth CSRF format (token|hash) for credentials flow.
 */
import { createHash, randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const CSRF_COOKIE = "next-auth.csrf-token";

export async function GET() {
  const secret = process.env.NEXTAUTH_SECRET || "development-secret-change-in-prod";
  const csrfToken = randomBytes(32).toString("hex");
  const hash = createHash("sha256").update(`${csrfToken}${secret}`).digest("hex");
  const cookieValue = `${csrfToken}|${hash}`;

  const isSecure = process.env.NEXTAUTH_URL?.startsWith("https");
  const cookieName = isSecure ? "__Host-next-auth.csrf-token" : CSRF_COOKIE;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.append(
    "Set-Cookie",
    `${cookieName}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax${isSecure ? "; Secure" : ""}; Max-Age=86400`
  );

  return new Response(JSON.stringify({ csrfToken }), {
    status: 200,
    headers,
  });
}
