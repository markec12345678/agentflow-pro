/**
 * Webhook Alerts for Budget Thresholds
 * Sends alerts to Slack, email, or custom webhooks when budget thresholds are crossed
 */

import { BudgetManager, BudgetStatus } from '../../../cost/budget-manager';

export interface WebhookAlertConfig {
  /** Slack webhook URL */
  slackWebhook?: string;
  
  /** Email address for alerts */
  email?: string;
  
  /** Custom webhook URL */
  customWebhook?: string;
  
  /** Enable alerts for warning threshold */
  enableWarningAlerts: boolean;
  
  /** Enable alerts for critical threshold */
  enableCriticalAlerts: boolean;
  
  /** Enable alerts for exceeded budget */
  enableExceededAlerts: boolean;
}

export class WebhookAlerts {
  private config: WebhookAlertConfig;
  private budget: BudgetManager;
  private alertCooldown = new Map<string, number>(); // Prevent spam
  private readonly COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

  constructor(config: WebhookAlertConfig, budget?: BudgetManager) {
    this.config = config;
    this.budget = budget || new BudgetManager();
  }

  /**
   * Check and send alerts based on budget status
   */
  async checkAndAlert(userId?: string): Promise<void> {
    const status = await this.budget.getBudgetStatus(userId);
    const alertKey = userId || 'global';

    // Check cooldown
    const lastAlert = this.alertCooldown.get(alertKey) || 0;
    if (Date.now() - lastAlert < this.COOLDOWN_MS) {
      return; // Still in cooldown
    }

    // Determine which alert to send
    if (status.status === 'warning' && this.config.enableWarningAlerts) {
      await this.sendWarningAlert(status, userId);
      this.alertCooldown.set(alertKey, Date.now());
    } else if (status.status === 'critical' && this.config.enableCriticalAlerts) {
      await this.sendCriticalAlert(status, userId);
      this.alertCooldown.set(alertKey, Date.now());
    } else if (status.status === 'exceeded' && this.config.enableExceededAlerts) {
      await this.sendExceededAlert(status, userId);
      this.alertCooldown.set(alertKey, Date.now());
    }
  }

  /**
   * Send warning alert (80% budget used)
   */
  private async sendWarningAlert(status: BudgetStatus, userId?: string): Promise<void> {
    const message = {
      text: `⚠️ Budget Warning`,
      attachments: [
        {
          color: 'warning',
          fields: [
            {
              title: 'Budget Status',
              value: `${(status.percentageUsed * 100).toFixed(1)}% used`,
              short: true,
            },
            {
              title: 'Amount Spent',
              value: `$${status.spent.toFixed(2)} / $${status.budget.toFixed(2)}`,
              short: true,
            },
            {
              title: 'Remaining',
              value: `$${status.remaining.toFixed(2)}`,
              short: true,
            },
            {
              title: 'Days Left',
              value: `${status.daysRemaining}`,
              short: true,
            },
          ],
          footer: userId ? `User: ${userId}` : 'Global Budget',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendToSlack(message);
    console.log('[WebhookAlerts] Warning alert sent');
  }

  /**
   * Send critical alert (95% budget used)
   */
  private async sendCriticalAlert(status: BudgetStatus, userId?: string): Promise<void> {
    const message = {
      text: `🚨 Budget Critical`,
      attachments: [
        {
          color: 'danger',
          fields: [
            {
              title: 'Budget Status',
              value: `${(status.percentageUsed * 100).toFixed(1)}% used - CRITICAL`,
              short: true,
            },
            {
              title: 'Amount Spent',
              value: `$${status.spent.toFixed(2)} / $${status.budget.toFixed(2)}`,
              short: true,
            },
            {
              title: 'Remaining',
              value: `$${status.remaining.toFixed(2)}`,
              short: true,
            },
            {
              title: 'Recommended Action',
              value: 'Switch to cheaper model (gpt-3.5-turbo)',
              short: false,
            },
            {
              title: 'Daily Budget',
              value: `$${status.recommendedDailySpend.toFixed(2)} / day to stay within budget`,
              short: false,
            },
          ],
          footer: userId ? `User: ${userId}` : 'Global Budget',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendToSlack(message);
    console.log('[WebhookAlerts] Critical alert sent');
  }

  /**
   * Send exceeded alert (budget exceeded)
   */
  private async sendExceededAlert(status: BudgetStatus, userId?: string): Promise<void> {
    const message = {
      text: `❌ Budget Exceeded`,
      attachments: [
        {
          color: 'danger',
          fields: [
            {
              title: 'Budget Status',
              value: `BUDGET EXCEEDED`,
              short: true,
            },
            {
              title: 'Amount Spent',
              value: `$${status.spent.toFixed(2)} / $${status.budget.toFixed(2)}`,
              short: true,
            },
            {
              title: 'Over Budget By',
              value: `$${Math.abs(status.remaining).toFixed(2)}`,
              short: true,
            },
            {
              title: 'Action Required',
              value: 'Operations may be blocked until budget is reset',
              short: false,
            },
          ],
          footer: userId ? `User: ${userId}` : 'Global Budget',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    await this.sendToSlack(message);
    console.log('[WebhookAlerts] Exceeded alert sent');
  }

  /**
   * Send message to Slack webhook
   */
  private async sendToSlack(message: any): Promise<void> {
    if (!this.config.slackWebhook) {
      console.log('[WebhookAlerts] Slack webhook not configured, skipping');
      return;
    }

    try {
      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('[WebhookAlerts] Failed to send Slack alert:', error);
    }
  }

  /**
   * Send to custom webhook
   */
  private async sendToCustomWebhook(payload: any): Promise<void> {
    if (!this.config.customWebhook) {
      return;
    }

    try {
      await fetch(this.config.customWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[WebhookAlerts] Failed to send custom webhook:', error);
    }
  }

  /**
   * Clear alert cooldown
   */
  clearCooldown(userId?: string): void {
    const key = userId || 'global';
    this.alertCooldown.delete(key);
  }

  /**
   * Get cooldown status
   */
  getCooldownStatus(userId?: string): { inCooldown: boolean; remainingMs: number } {
    const key = userId || 'global';
    const lastAlert = this.alertCooldown.get(key) || 0;
    const elapsed = Date.now() - lastAlert;
    const remaining = Math.max(0, this.COOLDOWN_MS - elapsed);

    return {
      inCooldown: remaining > 0,
      remainingMs: remaining,
    };
  }
}

export const getWebhookAlerts = (config?: Partial<WebhookAlertConfig>): WebhookAlerts => {
  return new WebhookAlerts({
    enableWarningAlerts: true,
    enableCriticalAlerts: true,
    enableExceededAlerts: true,
    ...config,
  });
};

export default WebhookAlerts;
