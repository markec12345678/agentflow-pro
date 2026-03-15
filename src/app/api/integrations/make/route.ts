import { NextRequest, NextResponse } from 'next/server';

/**
 * Make.com (formerly Integromat) Integration
 * Webhook endpoint for Make scenarios
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenario, action, data, hookId } = body;

    logger.info('Make.com webhook received:', { scenario, action, hookId });

    // Route to appropriate action
    switch (action) {
      case 'watch_bookings':
        return await handleWatchBookings(data);
      case 'watch_reviews':
        return await handleWatchReviews(data);
      case 'create_reservation':
        return await handleMakeCreateReservation(data);
      case 'update_guest':
        return await handleUpdateGuest(data);
      case 'execute_workflow':
        return await handleMakeExecuteWorkflow(data);
      default:
        return NextResponse.json(
          { error: 'Unknown action', supportedActions: getMakeSupportedActions() },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Make.com webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/make
 * Returns Make.com app manifest
 */
export async function GET() {
  return NextResponse.json({
    name: 'AgentFlow Pro',
    description: 'AI-powered tourism automation for hotels and rentals',
    version: '1.0.0',
    documentationUrl: 'https://docs.agentflow.pro/integrations/make',
    auth: {
      type: 'api-key',
      header: 'X-AgentFlow-API-Key',
    },
    triggers: [
      {
        name: 'Watch New Bookings',
        description: 'Watches for new reservations',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'watch_bookings' },
        output: [
          { name: 'id', type: 'text' },
          { name: 'guestName', type: 'text' },
          { name: 'guestEmail', type: 'text' },
          { name: 'checkIn', type: 'datetime' },
          { name: 'checkOut', type: 'datetime' },
          { name: 'guests', type: 'number' },
          { name: 'totalPrice', type: 'number' },
          { name: 'status', type: 'text' },
        ],
      },
      {
        name: 'Watch New Reviews',
        description: 'Watches for new guest reviews',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'watch_reviews' },
        output: [
          { name: 'id', type: 'text' },
          { name: 'rating', type: 'number' },
          { name: 'comment', type: 'text' },
          { name: 'reviewerName', type: 'text' },
          { name: 'source', type: 'text' },
          { name: 'reviewedAt', type: 'datetime' },
        ],
      },
      {
        name: 'Watch Check-ins Today',
        description: 'Watches for guests checking in today',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'watch_checkins' },
      },
    ],
    actions: [
      {
        name: 'Create Reservation',
        description: 'Creates a new reservation',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'create_reservation' },
        input: [
          { name: 'propertyId', type: 'text', required: true },
          { name: 'guestName', type: 'text', required: true },
          { name: 'guestEmail', type: 'text', required: true },
          { name: 'guestPhone', type: 'text' },
          { name: 'checkIn', type: 'datetime', required: true },
          { name: 'checkOut', type: 'datetime', required: true },
          { name: 'guests', type: 'number', required: true },
          { name: 'notes', type: 'text' },
        ],
        output: [
          { name: 'id', type: 'text' },
          { name: 'confirmationCode', type: 'text' },
          { name: 'status', type: 'text' },
        ],
      },
      {
        name: 'Update Guest',
        description: 'Updates guest information',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'update_guest' },
        input: [
          { name: 'guestId', type: 'text', required: true },
          { name: 'name', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'phone', type: 'text' },
          { name: 'preferences', type: 'text' },
        ],
      },
      {
        name: 'Send Message',
        description: 'Sends email/SMS to guest',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'send_message' },
        input: [
          { name: 'guestEmail', type: 'text', required: true },
          { name: 'subject', type: 'text' },
          { name: 'message', type: 'text', required: true },
          { name: 'channel', type: 'text', enum: ['email', 'sms', 'whatsapp'] },
        ],
      },
      {
        name: 'Execute Workflow',
        description: 'Triggers an AgentFlow workflow',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'execute_workflow' },
        input: [
          { name: 'workflowId', type: 'text', required: true },
          { name: 'inputData', type: 'any' },
        ],
      },
    ],
    searches: [
      {
        name: 'Get Reservation',
        description: 'Finds a reservation by ID',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'get_reservation' },
        input: [
          { name: 'reservationId', type: 'text', required: true },
        ],
      },
      {
        name: 'Check Availability',
        description: 'Checks property availability for dates',
        endpoint: '/api/integrations/make',
        httpMethod: 'POST',
        body: { action: 'check_availability' },
        input: [
          { name: 'propertyId', type: 'text', required: true },
          { name: 'checkIn', type: 'datetime', required: true },
          { name: 'checkOut', type: 'datetime', required: true },
        ],
      },
    ],
  });
}

/**
 * Watch new bookings (for Make polling)
 */
async function handleWatchBookings(data: any): Promise<NextResponse> {
  const { prisma } = await import('@/lib/prisma');
  
  const { since, limit = 10 } = data;
  
  const bookings = await prisma.reservation.findMany({
    where: {
      createdAt: { gte: since ? new Date(since) : new Date(Date.now() - 3600000) },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      checkIn: true,
      checkOut: true,
      guests: true,
      totalPrice: true,
      status: true,
      source: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ bookings });
}

/**
 * Watch new reviews
 */
async function handleWatchReviews(data: any): Promise<NextResponse> {
  const { prisma } = await import('@/lib/prisma');
  
  const { since, limit = 10 } = data;
  
  const reviews = await prisma.review.findMany({
    where: {
      createdAt: { gte: since ? new Date(since) : new Date(Date.now() - 86400000) },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      reviewerName: true,
      source: true,
      reviewedAt: true,
    },
  });

  return NextResponse.json({ reviews });
}

/**
 * Create reservation for Make
 */
async function handleMakeCreateReservation(data: any): Promise<NextResponse> {
  const { propertyId, guestName, guestEmail, guestPhone, checkIn, checkOut, guests, notes } = data;

  const { prisma } = await import('@/lib/prisma');

  const reservation = await prisma.reservation.create({
    data: {
      propertyId,
      guestName,
      guestEmail,
      guestPhone,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      notes,
      status: 'pending',
      source: 'make',
    },
  });

  return NextResponse.json({
    id: reservation.id,
    confirmationCode: `MAKE-${reservation.id.slice(0, 8).toUpperCase()}`,
    status: reservation.status,
    createdAt: reservation.createdAt,
  });
}

/**
 * Update guest
 */
async function handleUpdateGuest(data: any): Promise<NextResponse> {
  const { guestId, name, email, phone, preferences } = data;

  const { prisma } = await import('@/lib/prisma');

  const guest = await prisma.guest.update({
    where: { id: guestId },
    data: {
      name,
      email,
      phone,
      preferences: preferences ? JSON.parse(preferences) : undefined,
    },
  });

  return NextResponse.json(guest);
}

/**
 * Execute workflow for Make
 */
async function handleMakeExecuteWorkflow(data: any): Promise<NextResponse> {
  const { workflowId, inputData } = data;

  const { executeWorkflow } = await import('@/workflows/executor');
  const { createOrchestrator } = await import('@/orchestrator/Orchestrator');

  const orchestrator = createOrchestrator();
  const result = await executeWorkflow(
    { id: workflowId, name: 'Make Trigger', nodes: [], edges: [] },
    orchestrator,
    inputData
  );

  return NextResponse.json({
    success: result.success,
    output: result.output,
    executedAt: new Date().toISOString(),
  });
}

/**
 * Get supported actions for Make
 */
function getMakeSupportedActions(): string[] {
  return [
    'watch_bookings',
    'watch_reviews',
    'watch_checkins',
    'create_reservation',
    'update_guest',
    'send_message',
    'execute_workflow',
    'get_reservation',
    'check_availability',
  ];
}
