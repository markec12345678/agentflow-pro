/**
 * AgentFlow Pro - Billing API Endpoints
 * Complete subscription management and payment processing API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { stripeService, PlanType, SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { billingService, usageService } from '@/lib/billing';
import { authOptions } from '@/lib/auth-options';
import { getUserId } from '@/lib/auth-users';
import { apiSuccess, apiError } from '@/lib/api-response';
import { prisma } from '@/database/schema';

async function requireSession() {
  const session = await getServerSession(authOptions);
  const userId = getUserId(session);
  if (!userId) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), userId: null };
  return { session, userId, error: null };
}

async function subscriptionBelongsToUser(subscriptionId: string, userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId, userId },
  });
  return !!sub;
}

async function customerBelongsToUser(customerId: string, userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId, userId },
  });
  return !!sub;
}

// GET /api/billing/plans - Get available subscription plans
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'plans':
        return await getPlans();

      case 'usage': {
        const { userId: sessionUserId, error } = await requireSession();
        if (error) return error;
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        if (userId !== sessionUserId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return await getUsageStats(userId);
      }

      case 'subscription': {
        const { userId: sessionUserId, error } = await requireSession();
        if (error) return error;
        const subscriptionId = searchParams.get('subscriptionId');
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
        }
        const owns = await subscriptionBelongsToUser(subscriptionId, sessionUserId);
        if (!owns) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return await getSubscriptionStatus(subscriptionId);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/billing - Handle billing operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_customer':
        return await createCustomer(request, data);

      case 'create_subscription':
        return await createSubscription(request, data);

      case 'update_subscription':
        return await updateSubscription(request, data);

      case 'cancel_subscription':
        return await cancelSubscription(request, data);

      case 'create_checkout_session':
        return await createCheckoutSession(request, data);

      case 'create_portal_session':
        return await createPortalSession(request, data);

      case 'track_usage':
        return await trackUsage(request, data);

      case 'generate_invoice':
        return await generateInvoice(request, data);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET handlers
async function getPlans() {
  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    interval: plan.interval,
    features: plan.features,
    limits: plan.limits,
    formattedPrice: stripeService.formatPrice(plan.price, plan.currency)
  }));

  return NextResponse.json({
    success: true,
    data: plans
  });
}

async function getUsageStats(userId: string) {
  const stats = await usageService.getUsageStats(userId);

  return NextResponse.json({
    success: true,
    data: stats
  });
}

async function getSubscriptionStatus(subscriptionId: string) {
  const status = await billingService.getSubscriptionStatus(subscriptionId);

  return NextResponse.json({
    success: true,
    data: status
  });
}

// POST handlers
async function createCustomer(_request: NextRequest, data: { email?: string; name?: string }) {
  const { userId, error } = await requireSession();
  if (error) return error;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? data.email;
  const name = (session?.user?.name as string) ?? data.name ?? '';
  if (!email || !name) {
    return apiError('Email and name are required', 400, 'BAD_REQUEST');
  }
  try {
    const customer = await billingService.getOrCreateCustomer(email, name);
    return apiSuccess({
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to create customer', 500);
  }
}

async function createSubscription(_request: NextRequest, data: {
  email?: string;
  name?: string;
  planId: PlanType;
  trialPeriodDays?: number;
}) {
  const { userId, error } = await requireSession();
  if (error) return error;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? data.email;
  const name = (session?.user?.name as string) ?? data.name ?? '';
  const { planId, trialPeriodDays } = data;
  if (!email || !name || !planId) {
    return apiError('Email, name, and planId are required', 400, 'BAD_REQUEST');
  }
  try {
    const { subscription, customer } = await billingService.createSubscription(
      email,
      name,
      planId,
      trialPeriodDays
    );
    return apiSuccess({
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
      currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
      trialEnd: (subscription as unknown as { trial_end?: number }).trial_end
        ? new Date((subscription as unknown as { trial_end: number }).trial_end * 1000)
        : undefined,
      clientSecret: (subscription.latest_invoice as { payment_intent?: { client_secret?: string } } | null)?.payment_intent?.client_secret,
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to create subscription', 500);
  }
}

async function updateSubscription(_request: NextRequest, data: {
  subscriptionId: string;
  planId: PlanType;
}) {
  const { userId: sessionUserId, error } = await requireSession();
  if (error) return error;
  const { subscriptionId, planId } = data;
  if (!subscriptionId || !planId) {
    return apiError('Subscription ID and plan ID are required', 400, 'BAD_REQUEST');
  }
  const owns = await subscriptionBelongsToUser(subscriptionId, sessionUserId!);
  if (!owns) return apiError('Forbidden', 403, 'FORBIDDEN');
  try {
    const subscription = await billingService.updateSubscription(subscriptionId, planId);
    return apiSuccess({
      subscriptionId: subscription.id,
      status: subscription.status,
      planId: subscription.items.data[0].price.metadata?.planId,
      currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to update subscription', 500);
  }
}

async function cancelSubscription(_request: NextRequest, data: {
  subscriptionId: string;
  immediate?: boolean;
}) {
  const { userId: sessionUserId, error } = await requireSession();
  if (error) return error;
  const { subscriptionId, immediate = false } = data;
  if (!subscriptionId) return apiError('Subscription ID is required', 400, 'BAD_REQUEST');
  const owns = await subscriptionBelongsToUser(subscriptionId, sessionUserId!);
  if (!owns) return apiError('Forbidden', 403, 'FORBIDDEN');
  try {
    const subscription = await billingService.cancelSubscription(subscriptionId, immediate);
    return apiSuccess({
      subscriptionId: subscription.id,
      status: subscription.status,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to cancel subscription', 500);
  }
}

async function createCheckoutSession(_request: NextRequest, data: {
  customerId: string;
  planId: PlanType;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}) {
  const { userId: sessionUserId, error } = await requireSession();
  if (error) return error;
  const { customerId, planId, successUrl, cancelUrl, trialPeriodDays } = data;
  if (!customerId || !planId || !successUrl || !cancelUrl) {
    return apiError('Customer ID, plan ID, success URL, and cancel URL are required', 400, 'BAD_REQUEST');
  }
  const owns = await customerBelongsToUser(customerId, sessionUserId!);
  if (!owns) return apiError('Forbidden', 403, 'FORBIDDEN');
  try {
    const session = await billingService.createCheckoutSession(
      customerId,
      planId,
      successUrl,
      cancelUrl,
      trialPeriodDays
    );
    return apiSuccess({ sessionId: session.id, url: session.url });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to create checkout session', 500);
  }
}

async function createPortalSession(_request: NextRequest, data: {
  customerId: string;
  returnUrl: string;
}) {
  const { userId: sessionUserId, error } = await requireSession();
  if (error) return error;
  const { customerId, returnUrl } = data;
  if (!customerId || !returnUrl) {
    return apiError('Customer ID and return URL are required', 400, 'BAD_REQUEST');
  }
  const owns = await customerBelongsToUser(customerId, sessionUserId!);
  if (!owns) return apiError('Forbidden', 403, 'FORBIDDEN');
  try {
    const session = await billingService.createCustomerPortalSession(customerId, returnUrl);
    return apiSuccess({ sessionId: session.id, url: session.url });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to create portal session', 500);
  }
}

async function trackUsage(_request: NextRequest, data: {
  userId: string;
  type: 'agent_run' | 'storage' | 'team_member';
  value?: number;
}) {
  const { userId: sessionUserId, error } = await requireSession();
  if (error) return error;
  const { userId, type, value } = data;
  if (!userId || !type) return apiError('User ID and type are required', 400, 'BAD_REQUEST');
  if (userId !== sessionUserId) return apiError('Forbidden', 403, 'FORBIDDEN');
  try {
    switch (type) {
      case 'agent_run':
        await usageService.trackAgentRun(userId);
        break;
      case 'storage':
        if (value === undefined) return apiError('Storage value is required', 400, 'BAD_REQUEST');
        await usageService.trackStorageUsage(userId, value);
        break;
      case 'team_member':
        if (value === undefined) return apiError('Team member count is required', 400, 'BAD_REQUEST');
        await usageService.trackTeamMemberUsage(userId, value);
        break;
      default:
        return apiError('Invalid usage type', 400, 'BAD_REQUEST');
    }
    const canPerform = await usageService.canPerformAction(userId, type);
    return apiSuccess({
      tracked: true,
      canPerform,
      message: canPerform ? 'Usage tracked successfully' : 'Usage limit reached',
    });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to track usage', 500);
  }
}

async function generateInvoice(_request: NextRequest, data: { userId: string }) {
  const { userId: sessionUserId, error } = await requireSession();
  if (error) return error;
  const { userId } = data;
  if (!userId) return apiError('User ID is required', 400, 'BAD_REQUEST');
  if (userId !== sessionUserId) return apiError('Forbidden', 403, 'FORBIDDEN');
  try {
    await usageService.generateMonthlyInvoice(userId);
    return apiSuccess({ message: 'Invoice generated successfully' });
  } catch (err) {
    return apiError(err instanceof Error ? err.message : 'Failed to generate invoice', 500);
  }
}

// Webhook handler for Stripe events
export async function PUT(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Stripe signature is required' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
    }

    const event = await stripeService.constructWebhookEvent(body, signature, webhookSecret);

    // Handle the webhook event
    await billingService.handleWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
