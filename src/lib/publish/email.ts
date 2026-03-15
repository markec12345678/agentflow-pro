/**
 * Sends workflow notification emails via Resend API.
 * Set RESEND_API_KEY and EMAIL_FROM in env to enable.
 */

const RESEND_API = "https://api.resend.com/emails";

export async function sendWorkflowNotificationEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AgentFlow Pro <notifications@agentflow.pro>";

  if (!apiKey || !to?.includes("@")) {
    logger.info("[Email] Skipped (no RESEND_API_KEY or invalid to):", { to: to ? "***" : "missing" });
    return;
  }

  if (process.env.DRY_RUN === "true") {
    logger.info("[DRY RUN] Email would be sent to:", to, "subject:", subject);
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
        html: `<p>${body.replace(/\n/g, "<br>")}</p>`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API ${res.status}: ${err}`);
    }
  } catch (error) {
    logger.error("[Email] Failed to send workflow notification:", error);
    throw new Error("Failed to send workflow notification email");
  }
}
