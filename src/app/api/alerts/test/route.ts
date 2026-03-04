import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { sendSlack, sendEmail, sendSms } from '@/alerts/channels';
import { getDevContact, getReceptionistContact } from '@/alerts/contacts';

export const dynamic = "force-dynamic";

/**
 * POST /api/alerts/test
 * Send a test alert
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = getUserId(session);
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { channel, message = "Test alert from AgentFlow Pro" } = body;

    // Validate channel
    const validChannels = ['email', 'sms', 'slack'];
    if (!validChannels.includes(channel)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CHANNEL', message: 'Invalid channel' } },
        { status: 400 }
      );
    }

    let result = { success: false, message: '' };

    try {
      switch (channel) {
        case 'email':
          const receptionistContact = getReceptionistContact();
          if (receptionistContact.email) {
            await sendEmail(
              receptionistContact.email,
              'Test Alert - AgentFlow Pro',
              message
            );
            result = { success: true, message: 'Test email sent successfully' };
          } else {
            result = { success: false, message: 'No email address configured' };
          }
          break;

        case 'sms':
          const receptionistContact = getReceptionistContact();
          if (receptionistContact.phone) {
            await sendSms(receptionistContact.phone, message);
            result = { success: true, message: 'Test SMS sent successfully' };
          } else {
            result = { success: false, message: 'No phone number configured' };
          }
          break;

        case 'slack':
          const slackContact = getDevContact();
          if (slackContact.slackWebhook) {
            await sendSlack(slackContact.slackWebhook, message);
            result = { success: true, message: 'Test Slack message sent successfully' };
          } else {
            result = { success: false, message: 'No Slack webhook configured' };
          }
          break;
      }
    } catch (error) {
      console.error(`Test ${channel} error:`, error);
      result = { 
        success: false, 
        message: `Failed to send test ${channel}: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Test alert error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
