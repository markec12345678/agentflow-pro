/**
 * API Route for Push Notification Subscription
 * Handles user subscription to push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationSubscription, NotificationPreferences } from '@/types/notifications';

// Mock database for subscriptions (in production, this would be a real database)
const subscriptions: Map<string, NotificationSubscription> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      propertyId,
      endpoint,
      keys,
      deviceInfo,
      preferences,
    } = body;

    // Validate required fields
    if (!userId || !propertyId || !endpoint || !keys) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, propertyId, endpoint, keys' },
        { status: 400 }
      );
    }

    // Validate keys
    if (!keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription keys' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription: NotificationSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      propertyId,
      endpoint,
      keys,
      deviceInfo: deviceInfo || {
        userAgent: request.headers.get('user-agent') || '',
        platform: navigator?.platform || 'unknown',
        version: '1.0.0',
        screenWidth: 1920,
        screenHeight: 1080,
        language: 'en',
        timezone: 'UTC',
      },
      preferences: preferences || {
        enabled: true,
        categories: {
          housekeeping: true,
          maintenance: true,
          reception: true,
          management: true,
          security: true,
          guest_services: true,
          administrative: true,
          emergency: true,
        },
        priorities: {
          low: true,
          medium: true,
          high: true,
          urgent: true,
          critical: true,
        },
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '06:00',
          timezone: 'UTC',
        },
        sound: true,
        vibration: true,
        badge: true,
        emailFallback: true,
        smsFallback: false,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActiveAt: new Date(),
    };

    // Store subscription
    subscriptions.set(subscription.id, subscription);

    console.log(`📱 User ${userId} subscribed to notifications for property ${propertyId}`);

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Subscription error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to subscribe to notifications',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const propertyId = searchParams.get('propertyId');

    if (!userId || !propertyId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: userId, propertyId' },
        { status: 400 }
      );
    }

    // Find subscription for user and property
    const userSubscriptions = Array.from(subscriptions.values()).filter(
      sub => sub.userId === userId && sub.propertyId === propertyId && sub.isActive
    );

    if (userSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          subscription: null,
          message: 'No active subscription found',
        },
      });
    }

    // Return the most recent subscription
    const latestSubscription = userSubscriptions.reduce((latest, current) => 
      current.createdAt > latest.createdAt ? current : latest
    );

    return NextResponse.json({
      success: true,
      data: {
        subscription: latestSubscription,
      },
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to get subscription',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('subscriptionId');

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: subscriptionId' },
        { status: 400 }
      );
    }

    const subscription = subscriptions.get(subscriptionId);
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Deactivate subscription
    subscription.isActive = false;
    subscription.updatedAt = new Date();

    console.log(`📱 User ${subscription.userId} unsubscribed from notifications`);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Subscription deactivated successfully',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to unsubscribe',
      },
      { status: 500 }
    );
  }
}
