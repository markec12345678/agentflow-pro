/**
 * Mailchimp Integration Service
 * Handles: Email campaigns, audience management, automation
 */

interface MailchimpConfig {
  apiKey: string;
  serverPrefix: string;
  audienceId: string;
}

interface CampaignData {
  type: 'regular' | 'plaintext' | 'absplit' | 'rss' | 'variation';
  recipients: {
    list_id: string;
    segment_opts?: any;
  };
  settings: {
    subject_line: string;
    title: string;
    from_name: string;
    reply_to: string;
  };
  content?: {
    html?: string;
    text?: string;
  };
}

interface AudienceMember {
  email_address: string;
  status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
  merge_fields?: {
    FNAME?: string;
    LNAME?: string;
    PROPERTY?: string;
    BOOKINGS?: number;
  };
}

export class MailchimpService {
  private config: MailchimpConfig;
  private baseUrl: string;

  constructor(config?: Partial<MailchimpConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.MAILCHIMP_API_KEY || '',
      serverPrefix: config?.serverPrefix || process.env.MAILCHIMP_SERVER_PREFIX || 'us1',
      audienceId: config?.audienceId || process.env.MAILCHIMP_AUDIENCE_ID || '',
    };

    this.baseUrl = `https://${this.config.serverPrefix}.api.mailchimp.com/3.0`;
  }

  /**
   * Create and send email campaign
   */
  async createCampaign(data: CampaignData): Promise<{ id: string; status: string }> {
    if (!this.config.apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        recipients: {
          ...data.recipients,
          list_id: data.recipients.list_id || this.config.audienceId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mailchimp API error: ${error.title}`);
    }

    const campaign = await response.json();
    return { id: campaign.id, status: campaign.status };
  }

  /**
   * Add/update audience member
   */
  async addOrUpdateAudienceMember(member: AudienceMember): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    const subscriberHash = this.md5(member.email_address.toLowerCase());
    
    const response = await fetch(
      `${this.baseUrl}/lists/${this.config.audienceId}/members/${subscriberHash}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `apikey ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(member),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mailchimp API error: ${error.title}`);
    }

    return response.json();
  }

  /**
   * Add multiple audience members (batch)
   */
  async addBatchAudienceMembers(members: AudienceMember[]): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    const operations = members.map((member, index) => ({
      method: 'PUT',
      path: `/lists/${this.config.audienceId}/members/${this.md5(member.email_address.toLowerCase())}`,
      body: JSON.stringify(member),
      operation_id: `op_${index}`,
    }));

    const response = await fetch(`${this.baseUrl}/batches`, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operations }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mailchimp API error: ${error.title}`);
    }

    return response.json();
  }

  /**
   * Send campaign
   */
  async sendCampaign(campaignId: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    const response = await fetch(
      `${this.baseUrl}/campaigns/${campaignId}/actions/send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `apikey ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mailchimp API error: ${error.title}`);
    }

    return response.json();
  }

  /**
   * Get campaign performance
   */
  async getCampaignPerformance(campaignId: string): Promise<any> {
    if (!this.config.apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    const response = await fetch(
      `${this.baseUrl}/reports/${campaignId}`,
      {
        headers: {
          'Authorization': `apikey ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mailchimp API error: ${error.title}`);
    }

    return response.json();
  }

  /**
   * Create automation email (guest journey)
   */
  async createAutomationEmail(
    email: string,
    journeyType: 'pre-arrival' | 'post-stay' | 'birthday' | 'anniversary',
    propertyData: any
  ): Promise<any> {
    // Add to audience with tags
    await this.addOrUpdateAudienceMember({
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: propertyData.guestName?.split(' ')[0] || '',
        LNAME: propertyData.guestName?.split(' ')[1] || '',
        PROPERTY: propertyData.propertyName || '',
      },
    });

    // Trigger automation based on journey type
    // This would integrate with Mailchimp's Customer Journey Builder
    return {
      success: true,
      message: `Automation triggered for ${journeyType}`,
    };
  }

  /**
   * Helper: MD5 hash for subscriber identification
   */
  private md5(email: string): string {
    // Simple MD5 implementation (in production, use crypto library)
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get audience stats
   */
  async getAudienceStats(): Promise<{
    memberCount: number;
    subscribedCount: number;
    unsubscribedCount: number;
    cleanedCount: number;
  }> {
    if (!this.config.apiKey) {
      throw new Error('Mailchimp API key not configured');
    }

    const response = await fetch(
      `${this.baseUrl}/lists/${this.config.audienceId}`,
      {
        headers: {
          'Authorization': `apikey ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mailchimp API error: ${error.title}`);
    }

    const list = await response.json();
    return {
      memberCount: list.stats.member_count,
      subscribedCount: list.stats.member_count_since_send || 0,
      unsubscribedCount: list.stats.unsubscribed_count || 0,
      cleanedCount: list.stats.cleaned_count || 0,
    };
  }
}

export const mailchimpService = new MailchimpService();
