import axios from 'axios';
import { logger } from '@/infrastructure/observability/logger';

/**
 * Sends a message to a Slack webhook URL.
 * 
 * @param webhookUrl The Slack webhook URL.
 * @param message The message to send.
 */
export async function sendSlackMessage(webhookUrl: string, message: string): Promise<void> {
  try {
    await axios.post(webhookUrl, { text: message });
  } catch (error) {
    logger.error('Error sending Slack message:', error);
    throw new Error('Failed to send Slack message');
  }
}
