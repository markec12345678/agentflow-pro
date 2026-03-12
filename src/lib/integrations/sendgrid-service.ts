/**
 * SendGrid Integration Service
 * Handles: Transactional emails, templates, analytics
 */

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: any;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
    disposition: string;
  }>;
}

export class SendGridService {
  private config: SendGridConfig;
  private baseUrl: string = 'https://api.sendgrid.com/v3';

  constructor(config?: Partial<SendGridConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.SENDGRID_API_KEY || '',
      fromEmail: config?.fromEmail || process.env.EMAIL_FROM || 'noreply@agentflow.pro',
      fromName: config?.fromName || 'AgentFlow Pro',
    };
  }

  /**
   * Send single email
   */
  async sendEmail(data: EmailData): Promise<{ messageId: string }> {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const personalization: any = {
      to: [{ email: data.to }],
      subject: data.subject,
    };

    if (data.cc?.length) {
      personalization.cc = data.cc.map(email => ({ email }));
    }

    if (data.bcc?.length) {
      personalization.bcc = data.bcc.map(email => ({ email }));
    }

    if (data.dynamicTemplateData) {
      personalization.dynamic_template_data = data.dynamicTemplateData;
    }

    const body: any = {
      personalizations: [personalization],
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
    };

    if (data.templateId) {
      body.template_id = data.templateId;
    } else {
      body.content = [
        {
          type: data.html ? 'text/html' : 'text/plain',
          value: data.html || data.text || '',
        },
      ];
    }

    if (data.attachments?.length) {
      body.attachments = data.attachments;
    }

    const response = await fetch(`${this.baseUrl}/mail/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok && response.status !== 202) {
      const error = await response.json();
      throw new Error(`SendGrid API error: ${JSON.stringify(error)}`);
    }

    const messageId = response.headers.get('X-Message-Id') || `sent-${Date.now()}`;
    return { messageId };
  }

  /**
   * Send batch emails
   */
  async sendBatchEmails(emails: EmailData[]): Promise<{ count: number; messageIds: string[] }> {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const messageIds: string[] = [];
    
    for (const email of emails) {
      const result = await this.sendEmail(email);
      messageIds.push(result.messageId);
    }

    return { count: emails.length, messageIds };
  }

  /**
   * Send transactional email (booking confirmation, etc.)
   */
  async sendTransactionalEmail(
    to: string,
    templateId: string,
    templateData: any
  ): Promise<{ messageId: string }> {
    return this.sendEmail({
      to,
      subject: templateData.subject || '',
      templateId,
      dynamicTemplateData: templateData,
    });
  }

  /**
   * Send booking confirmation
   */
  async sendBookingConfirmation(
    guestEmail: string,
    bookingData: {
      confirmationCode: string;
      propertyName: string;
      checkIn: Date;
      checkOut: Date;
      guests: number;
      totalPrice: number;
      currency: string;
    }
  ): Promise<{ messageId: string }> {
    return this.sendTransactionalEmail(guestEmail, 'd-booking-confirmation', {
      subject: `Potrdilo Rezervacije - ${bookingData.confirmationCode}`,
      confirmationCode: bookingData.confirmationCode,
      propertyName: bookingData.propertyName,
      checkInDate: bookingData.checkIn.toLocaleDateString('sl-SI'),
      checkOutDate: bookingData.checkOut.toLocaleDateString('sl-SI'),
      guests: bookingData.guests,
      totalPrice: bookingData.totalPrice,
      currency: bookingData.currency,
    });
  }

  /**
   * Send pre-arrival email
   */
  async sendPreArrivalEmail(
    guestEmail: string,
    data: {
      propertyName: string;
      checkInDate: string;
      checkInTime: string;
      address: string;
      instructions: string;
    }
  ): Promise<{ messageId: string }> {
    return this.sendTransactionalEmail(guestEmail, 'd-pre-arrival', {
      subject: `Priprava na Prihod - ${data.propertyName}`,
      propertyName: data.propertyName,
      checkInDate: data.checkInDate,
      checkInTime: data.checkInTime,
      address: data.address,
      instructions: data.instructions,
    });
  }

  /**
   * Send post-stay review request
   */
  async sendReviewRequest(
    guestEmail: string,
    data: {
      propertyName: string;
      reviewUrl: string;
      guestName: string;
    }
  ): Promise<{ messageId: string }> {
    return this.sendTransactionalEmail(guestEmail, 'd-review-request', {
      subject: `Kako je bilo pri nas? - ${data.propertyName}`,
      propertyName: data.propertyName,
      guestName: data.guestName,
      reviewUrl: data.reviewUrl,
    });
  }

  /**
   * Get email stats
   */
  async getEmailStats(messageId: string): Promise<{
    delivered: boolean;
    opened: boolean;
    clicked: boolean;
    bounced: boolean;
    spamReport: boolean;
  }> {
    if (!this.config.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    // Note: This requires SendGrid Email Activity API (paid feature)
    const response = await fetch(
      `${this.baseUrl}/messages?msg_id=${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return {
        delivered: false,
        opened: false,
        clicked: false,
        bounced: false,
        spamReport: false,
      };
    }

    const data = await response.json();
    return {
      delivered: true,
      opened: data.open_count > 0,
      clicked: data.click_count > 0,
      bounced: false,
      spamReport: false,
    };
  }
}

export const sendGridService = new SendGridService();
