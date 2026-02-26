/**
 * AgentFlow Pro - Billing API Endpoints
 * Complete subscription management and payment processing API
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeService, PlanType, SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { billingService, usageService } from '@/lib/billing';

// GET /api/billing/plans - Get available subscription plans
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'plans':
        return await getPlans();
      
      case 'usage':
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        return await getUsageStats(userId);
      
      case 'subscription':
        const subscriptionId = searchParams.get('subscriptionId');
        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
        }
        return await getSubscriptionStatus(subscriptionId);
      
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
        return await createCustomer(data);
      
      case 'create_subscription':
        return await createSubscription(data);
      
      case 'update_subscription':
        return await updateSubscription(data);
      
      case 'cancel_subscription':
        return await cancelSubscription(data);
      
      case 'create_checkout_session':
        return await createCheckoutSession(data);
      
      case 'create_portal_session':
        return await createPortalSession(data);
      
      case 'track_usage':
        return await trackUsage(data);
      
      case 'generate_invoice':
        return await generateInvoice(data);
      
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
async function createCustomer(data: { email: string; name: string }) {
  const { email, name } = data;
  
  if (!email || !name) {
    return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
  }

  try {
    const customer = await billingService.getOrCreateCustomer(email, name);
    
    return NextResponse.json({
      success: true,
      data: {
        customerId: customer.id,
        email: customer.email,
        name: customer.name
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create customer' },
      { status: 500 }
    );
  }
}

async function createSubscription(data: {
  email: string;
  name: string;
  planId: PlanType;
  trialPeriodDays?: number;
}) {
  const { email, name, planId, trialPeriodDays } = data;
  
  if (!email || !name || !planId) {
    return NextResponse.json({ error: 'Email, name, and planId are required' }, { status: 400 });
  }

  try {
    const { subscription, customer } = await billingService.createSubscription(
      email,
      name,
      planId,
      trialPeriodDays
    );
    
    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        customerId: customer.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

async function updateSubscription(data: {
  subscriptionId: string;
  planId: PlanType;
}) {
  const { subscriptionId, planId } = data;
  
  if (!subscriptionId || !planId) {
    return NextResponse.json({ error: 'Subscription ID and plan ID are required' }, { status: 400 });
  }

  try {
    const subscription = await billingService.updateSubscription(subscriptionId, planId);
    
    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        planId: subscription.items.data[0].price.metadata?.planId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

async function cancelSubscription(data: {
  subscriptionId: string;
  immediate?: boolean;
}) {
  const { subscriptionId, immediate = false } = data;
  
  if (!subscriptionId) {
    return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
  }

  try {
    const subscription = await billingService.cancelSubscription(subscriptionId, immediate);
    
    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}

async function createCheckoutSession(data: {
  customerId: string;
  planId: PlanType;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}) {
  const { customerId, planId, successUrl, cancelUrl, trialPeriodDays } = data;
  
  if (!customerId || !planId || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: 'Customer ID, plan ID, success URL, and cancel URL are required' }, { status: 400 });
  }

  try {
    const session = await billingService.createCheckoutSession(
      customerId,
      planId,
      successUrl,
      cancelUrl,
      trialPeriodDays
    );
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

async function createPortalSession(data: {
  customerId: string;
  returnUrl: string;
}) {
  const { customerId, returnUrl } = data;
  
  if (!customerId || !returnUrl) {
    return NextResponse.json({ error: 'Customer ID and return URL are required' }, { status: 400 });
  }

  try {
    const session = await billingService.createCustomerPortalSession(customerId, returnUrl);
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

async function trackUsage(data: {
  userId: string;
  type: 'agent_run' | 'storage' | 'team_member';
  value?: number;
}) {
  const { userId, type, value } = data;
  
  if (!userId || !type) {
    return NextResponse.json({ error: 'User ID and type are required' }, { status: 400 });
  }

  try {
    switch (type) {
      case 'agent_run':
        await usageService.trackAgentRun(userId);
        break;
      
      case 'storage':
        if (!value) {
          return NextResponse.json({ error: 'Storage value is required' }, { status: 400 });
        }
        await usageService.trackStorageUsage(userId, value);
        break;
      
      case 'team_member':
        if (!value) {
          return NextResponse.json({ error: 'Team member count is required' }, { status: 400 });
        }
        await usageService.trackTeamMemberUsage(userId, value);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid usage type' }, { status: 400 });
    }

    // Check if user can still perform the action
    const canPerform = await usageService.canPerformAction(userId, type);
    
    return NextResponse.json({
      success: true,
      data: {
        tracked: true,
        canPerform,
        message: canPerform ? 'Usage tracked successfully' : 'Usage limit reached'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track usage' },
      { status: 500 }
    );
  }
}

async function generateInvoice(data: {
  userId: string;
}) {
  const { userId } = data;
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    await usageService.generateMonthlyInvoice(userId);
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Invoice generated successfully'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate invoice' },
      { status: 500 }
    );
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
