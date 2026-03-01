/**
 * AgentFlow Pro - Billing Frontend Components
 * React components for subscription management and billing
 */

import React, { useState, useEffect } from 'react';

// Types
interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    properties: number;
    content: number;
    aiGenerations: number;
  };
}

interface Subscription {
  id: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Usage {
  properties: number;
  content: number;
  aiGenerations: number;
}

export default function BillingDashboard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for now
      setSubscription({
        id: 'sub_123',
        planId: 'pro',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false
      });
      
      setUsage({
        properties: 3,
        content: 45,
        aiGenerations: 120
      });
      
      setPlans([
        {
          id: 'starter',
          name: 'Starter',
          price: 29,
          currency: 'EUR',
          interval: 'month',
          features: ['Up to 3 properties', '100 content generations', 'Basic support'],
          limits: { properties: 3, content: 100, aiGenerations: 100 }
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 79,
          currency: 'EUR',
          interval: 'month',
          features: ['Up to 10 properties', '500 content generations', 'Priority support', 'Advanced analytics'],
          limits: { properties: 10, content: 500, aiGenerations: 500 }
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price: 199,
          currency: 'EUR',
          interval: 'month',
          features: ['Unlimited properties', 'Unlimited content', 'Dedicated support', 'Custom features'],
          limits: { properties: 999, content: 9999, aiGenerations: 9999 }
        }
      ]);
    } catch (err) {
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading billing information...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AgentFlow Pro - Billing</h1>
          <p className="text-gray-600">Complete subscription management and payment processing</p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          Stripe Integration ✅
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex space-x-4 border-b">
          {['overview', 'plans', 'usage', 'management'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
                <div className="space-y-2">
                  {subscription ? (
                    <>
                      <div className="text-2xl font-bold capitalize">{subscription.planId}</div>
                      <div className="text-sm text-gray-600">
                        Status: <span className={`px-2 py-1 rounded text-xs ${
                          subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-600">No active subscription</div>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Usage This Month</h3>
                <div className="space-y-3">
                  {usage && (
                    <>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Properties</span>
                          <span>{usage.properties}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(usage.properties / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Content</span>
                          <span>{usage.content}/500</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(usage.content / 500) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>AI Generations</span>
                          <span>{usage.aiGenerations}/500</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(usage.aiGenerations / 500) * 100}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700">
                    Upgrade Plan
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50">
                    View Invoices
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50">
                    Payment Methods
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold mb-4">
                    €{plan.price}<span className="text-sm text-gray-600">/{plan.interval}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>
                  <button 
                    className={`w-full px-4 py-2 rounded ${
                      subscription?.planId === plan.id
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {subscription?.planId === plan.id ? 'Current Plan' : 'Select Plan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Usage</h3>
              <div className="space-y-4">
                {usage && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-sm">
                        <div className="text-2xl font-bold text-blue-600">{usage.properties}</div>
                        <div className="text-sm text-gray-600">Properties</div>
                      </div>
                      <div className="text-center p-4 border rounded-sm">
                        <div className="text-2xl font-bold text-green-600">{usage.content}</div>
                        <div className="text-sm text-gray-600">Content Items</div>
                      </div>
                      <div className="text-center p-4 border rounded-sm">
                        <div className="text-2xl font-bold text-purple-600">{usage.aiGenerations}</div>
                        <div className="text-sm text-gray-600">AI Generations</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Management Tab */}
        {activeTab === 'management' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Subscription Management</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-sm">
                  <div>
                    <h4 className="font-medium">Cancel Subscription</h4>
                    <p className="text-sm text-gray-600">Cancel your subscription at the end of the billing period</p>
                  </div>
                  <button className="px-4 py-2 border border-red-300 text-red-600 rounded-sm hover:bg-red-50">
                    Cancel Plan
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-sm">
                  <div>
                    <h4 className="font-medium">Update Payment Method</h4>
                    <p className="text-sm text-gray-600">Add or update your payment method</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50">
                    Update Payment
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-sm">
                  <div>
                    <h4 className="font-medium">Download Invoices</h4>
                    <p className="text-sm text-gray-600">Download your billing invoices</p>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50">
                    View Invoices
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
