// Email sender stub (different from email-sender.ts in services)
export async function scheduleEmail(data: any): Promise<void> {}
export async function sendPendingGuestEmails(): Promise<any> {
  return { sent: 0, failed: 0, skipped: 0 };
}
export async function sendPendingWhatsAppMessages(): Promise<any> {
  return { sent: 0, failed: 0, skipped: 0 };
}
