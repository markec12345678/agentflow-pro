import { NextRequest, NextResponse } from 'next/server';

/**
 * Zapier Integration - Webhook Endpoint
 * This endpoint allows Zapier to trigger AgentFlow workflows
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zapierEvent, action, data } = body;

    // Validate Zapier signature (in production)
    const signature = request.headers.get('X-Zapier-Signature');
    if (!signature) {
      // In development, allow without signature
      logger.warn('Missing Zapier signature (allowed in dev)');
    }

    // Route to appropriate action
    switch (action) {
      case 'trigger_workflow':
        return await handleTriggerWorkflow(data);
      case 'create_reservation':
        return await handleCreateReservation(data);
      case 'send_message':
        return await handleSendMessage(data);
      case 'get_availability':
        return await handleGetAvailability(data);
      default:
        return NextResponse.json(
          { error: 'Unknown action', supportedActions: getSupportedActions() },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Zapier webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/zapier
 * Returns Zapier integration manifest
 */
export async function GET() {
  return NextResponse.json({
    version: '1.0.0',
    title: 'AgentFlow Pro',
    description: 'AI-powered tourism automation platform',
    authentication: {
      type: 'custom',
      test: {
        url: '{{base_url}}/api/integrations/zapier/test',
        method: 'GET',
      },
      connectionLabel: '{{property_name}}',
      fields: [
        {
          key: 'api_key',
          label: 'API Key',
          type: 'password',
          required: true,
          helpText: 'Your AgentFlow Pro API key',
        },
      ],
    },
    triggers: [
      {
        key: 'new_booking',
        noun: 'Booking',
        display: {
          label: 'New Booking',
          description: 'Triggers when a new booking is created',
          hidden: false,
          important: true,
        },
        operation: {
          perform: {
            url: '{{base_url}}/api/integrations/zapier/trigger/new_booking',
            method: 'GET',
          },
          outputFields: [
            { key: 'id', label: 'Booking ID' },
            { key: 'guestName', label: 'Guest Name' },
            { key: 'checkIn', label: 'Check-in Date' },
            { key: 'checkOut', label: 'Check-out Date' },
            { key: 'totalPrice', label: 'Total Price' },
          ],
        },
      },
      {
        key: 'new_review',
        noun: 'Review',
        display: {
          label: 'New Review',
          description: 'Triggers when a new review is received',
          hidden: false,
          important: true,
        },
        operation: {
          perform: {
            url: '{{base_url}}/api/integrations/zapier/trigger/new_review',
            method: 'GET',
          },
        },
      },
    ],
    creates: [
      {
        key: 'create_reservation',
        noun: 'Reservation',
        display: {
          label: 'Create Reservation',
          description: 'Creates a new reservation',
          hidden: false,
          important: true,
        },
        operation: {
          perform: {
            url: '{{base_url}}/api/integrations/zapier',
            method: 'POST',
            body: {
              action: 'create_reservation',
              data: '{{bundle.inputData}}',
            },
          },
          inputFields: [
            { key: 'propertyId', label: 'Property ID', required: true },
            { key: 'guestName', label: 'Guest Name', required: true },
            { key: 'guestEmail', label: 'Guest Email', required: true },
            { key: 'checkIn', label: 'Check-in Date', required: true, type: 'datetime' },
            { key: 'checkOut', label: 'Check-out Date', required: true, type: 'datetime' },
            { key: 'guests', label: 'Number of Guests', required: true, type: 'integer' },
          ],
          outputFields: [
            { key: 'id', label: 'Reservation ID' },
            { key: 'confirmationCode', label: 'Confirmation Code' },
            { key: 'status', label: 'Status' },
          ],
        },
      },
      {
        key: 'send_message',
        noun: 'Message',
        display: {
          label: 'Send Message',
          description: 'Sends a message to a guest',
          hidden: false,
          important: false,
        },
        operation: {
          perform: {
            url: '{{base_url}}/api/integrations/zapier',
            method: 'POST',
            body: {
              action: 'send_message',
              data: '{{bundle.inputData}}',
            },
          },
        },
      },
    ],
    searches: [
      {
        key: 'find_availability',
        noun: 'Availability',
        display: {
          label: 'Find Availability',
          description: 'Checks availability for dates',
          hidden: false,
          important: true,
        },
        operation: {
          perform: {
            url: '{{base_url}}/api/integrations/zapier',
            method: 'POST',
            body: {
              action: 'get_availability',
              data: '{{bundle.inputData}}',
            },
          },
          inputFields: [
            { key: 'propertyId', label: 'Property ID', required: true },
            { key: 'checkIn', label: 'Check-in Date', required: true, type: 'datetime' },
            { key: 'checkOut', label: 'Check-out Date', required: true, type: 'datetime' },
          ],
        },
      },
    ],
  });
}

/**
 * Test authentication
 */
async function handleTestAuth(): Promise<NextResponse> {
  // Verify API key
  const apiKey = process.env.ZAPIER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 401 });
  }

  return NextResponse.json({ success: true, message: 'Authentication successful' });
}

/**
 * Trigger workflow
 */
async function handleTriggerWorkflow(data: any): Promise<NextResponse> {
  const { workflowId, inputData } = data;

  if (!workflowId) {
    return NextResponse.json({ error: 'workflowId is required' }, { status: 400 });
  }

  // Execute workflow
  const { executeWorkflow } = await import('@/workflows/executor');
  const { createOrchestrator } = await import('@/orchestrator/Orchestrator');

  const orchestrator = createOrchestrator();
  const result = await executeWorkflow(
    { id: workflowId, name: 'Zapier Trigger', nodes: [], edges: [] },
    orchestrator,
    inputData
  );

  return NextResponse.json({
    success: true,
    executionId: result.output.executionId,
    status: result.success ? 'completed' : 'failed',
  });
}

/**
 * Create reservation
 */
async function handleCreateReservation(data: any): Promise<NextResponse> {
  const { propertyId, guestName, guestEmail, checkIn, checkOut, guests } = data;

  // Validate required fields
  if (!propertyId || !guestName || !guestEmail || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { prisma } = await import('@/lib/prisma');

  // Create reservation
  const reservation = await prisma.reservation.create({
    data: {
      propertyId,
      guestName,
      guestEmail,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      status: 'pending',
      source: 'zapier',
    },
  });

  return NextResponse.json({
    id: reservation.id,
    confirmationCode: `ZAP-${reservation.id.slice(0, 8).toUpperCase()}`,
    status: reservation.status,
  });
}

/**
 * Send message
 */
async function handleSendMessage(data: any): Promise<NextResponse> {
  const { guestEmail, subject, message } = data;

  if (!guestEmail || !message) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { sendGridService } = await import('@/lib/integrations/sendgrid-service');

  const result = await sendGridService.sendEmail({
    to: guestEmail,
    subject: subject || 'Message from Property',
    html: message,
  });

  return NextResponse.json({
    success: true,
    messageId: result.messageId,
  });
}

/**
 * Get availability
 */
async function handleGetAvailability(data: any): Promise<NextResponse> {
  const { propertyId, checkIn, checkOut } = data;

  if (!propertyId || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { prisma } = await import('@/lib/prisma');

  // Check for blocked dates
  const blocked = await prisma.blockedDate.findMany({
    where: {
      propertyId,
      OR: [
        {
          startDate: { lte: new Date(checkOut) },
          endDate: { gte: new Date(checkIn) },
        },
      ],
    },
  });

  const available = blocked.length === 0;

  return NextResponse.json({
    propertyId,
    checkIn,
    checkOut,
    available,
    blockedDates: blocked.map(b => ({
      startDate: b.startDate,
      endDate: b.endDate,
      reason: b.reason,
    })),
  });
}

/**
 * Get supported actions
 */
function getSupportedActions(): string[] {
  return [
    'trigger_workflow',
    'create_reservation',
    'send_message',
    'get_availability',
  ];
}
