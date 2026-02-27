/**
 * Shared email sending via Resend API.
 * Set RESEND_API_KEY and EMAIL_FROM in env to enable.
 */

const RESEND_API = "https://api.resend.com/emails";

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "AgentFlow Pro <notifications@agentflow.pro>";

  if (!apiKey || !to?.includes("@")) {
    console.log(
      "[Email] Skipped (no RESEND_API_KEY or invalid to):",
      to ? "***" : "missing"
    );
    return;
  }

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API ${res.status}: ${err}`);
    }
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    throw error;
  }
}

function getBaseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3002")
  );
}

export function buildVerificationEmailHtml(verifyLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; max-width: 500px;">
  <h2>Potrdite vaš e-poštni naslov</h2>
  <p>Kliknite spodnjo povezavo za potrditev vašega računa:</p>
  <p><a href="${verifyLink}" style="color: #2563eb; text-decoration: underline;">Potrdi e-pošto</a></p>
  <p style="color: #6b7280; font-size: 14px;">Povezava je veljavna 24 ur. Če niste zahtevali potrditve, prezrite to sporočilo.</p>
</body>
</html>`;
}

export function buildPasswordResetEmailHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; max-width: 500px;">
  <h2>Ponastavitev gesla</h2>
  <p>Prejeli ste to sporočilo, ker ste zahtevali ponastavitev gesla. Kliknite spodnjo povezavo:</p>
  <p><a href="${resetLink}" style="color: #2563eb; text-decoration: underline;">Ponastavi geslo</a></p>
  <p style="color: #6b7280; font-size: 14px;">Povezava je veljavna 1 uro. Če niste zahtevali ponastavitve, prezrite to sporočilo.</p>
</body>
</html>`;
}

export function buildTeamInviteEmailHtml(inviteLink: string, role: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; max-width: 500px;">
  <h2>Povabilo v ekipo</h2>
  <p>Povabljeni ste, da se pridružite ekipi (vloga: ${role}). Kliknite spodnjo povezavo za sprejem:</p>
  <p><a href="${inviteLink}" style="color: #2563eb; text-decoration: underline;">Sprejmi povabilo</a></p>
  <p style="color: #6b7280; font-size: 14px;">Povezava je veljavna 7 dni.</p>
</body>
</html>`;
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const baseUrl = getBaseUrl();
  const verifyLink = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  const html = buildVerificationEmailHtml(verifyLink);
  await sendEmail(to, "Potrdite vaš e-poštni naslov - AgentFlow Pro", html);
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const html = buildPasswordResetEmailHtml(resetLink);
  await sendEmail(to, "Ponastavitev gesla - AgentFlow Pro", html);
}

export async function sendTeamInviteEmail(
  to: string,
  inviteLink: string,
  role: string
): Promise<void> {
  const html = buildTeamInviteEmailHtml(inviteLink, role);
  await sendEmail(to, "Povabilo v ekipo - AgentFlow Pro", html);
}
