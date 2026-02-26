/**
 * AgentFlow Pro - Billing Frontend Components
 * React components for subscription management and billing
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

// Types
interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    agents: number;
    runsPerMonth: number;
    storage: number;
    teamMembers: number;
  };
  formattedPrice: string;
}

interface UsageStats {
  currentPeriod: string;
  agentRuns: { used: number; limit: number; percentage: number };
  storage: { used: number; limit: number; percentage: number };
  teamMembers: { used: number; limit: number; percentage: number };
  overageCost: number;
}

interface Customer {
  customerId: string;
  email: string;
  name: string;
}

interface Subscription {
  subscriptionId: string;
  status: string;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  planId: string;
}

// Main Billing Dashboard Component
export function BillingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  
  // Form state
  const [newCustomer, setNewCustomer] = useState({
    email: '',
    name: ''
  });
  
  const [newSubscription, setNewSubscription] = useState({
    email: '',
    name: '',
    planId: 'starter' as const,
    trialPeriodDays: 14
  });

  // Load data on mount
  useEffect(() => {
    loadPlans();
    loadUsageStats();
  }, []);

  // API calls
  const loadPlans = async () => {
    try {
      const response = await fetch('/api/billing/complete?action=plans');
      const result = await response.json();
      
      if (result.success) {
        setPlans(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load plans');
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await fetch('/api/billing/complete?action=usage&userId=demo-user');
      const result = await response.json();
      
      if (result.success) {
        setUsageStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load usage stats');
    }
  };

  const createCustomer = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/billing/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_customer',
          ...newCustomer
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCustomer(result.data);
        setNewCustomer({ email: '', name: '' });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/billing/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_subscription',
          ...newSubscription
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSubscription(result.data);
        setNewSubscription({
          email: '',
          name: '',
          planId: 'starter',
          trialPeriodDays: 14
        });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  const trackUsage = async (type: 'agent_run' | 'storage' | 'team_member', value?: number) => {
    try {
      const response = await fetch('/api/billing/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_usage',
          userId: 'demo-user',
          type,
          value
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Reload usage stats
        loadUsageStats();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to track usage');
    }
  };

  const createCheckoutSession = async (planId: string) => {
    if (!customer) {
      setError('Please create a customer first');
      return;
    }

    try {
      const response = await fetch('/api/billing/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_checkout_session',
          customerId: customer.customerId,
          planId,
          successUrl: `${window.location.origin}/billing/success`,
          cancelUrl: `${window.location.origin}/billing/cancel`
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to Stripe Checkout
        window.location.href = result.data.url;
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create checkout session');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AgentFlow Pro - Billing</h1>
          <p className="text-muted-foreground">Complete subscription management and payment processing</p>
        </div>
        <Badge variant="secondary" className="text-green-600">
          Stripe Integration ✅
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold capitalize">{subscription.planId}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No active subscription</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
              </CardHeader>
              <CardContent>
                {usageStats ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Agent Runs</span>
                        <span>{usageStats.agentRuns.used}/{usageStats.agentRuns.limit}</span>
                      </div>
                      <Progress value={usageStats.agentRuns.percentage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Storage</span>
                        <span>{usageStats.storage.used}MB/{usageStats.storage.limit}MB</span>
                      </div>
                      <Progress value={usageStats.storage.percentage} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Team Members</span>
                        <span>{usageStats.teamMembers.used}/{usageStats.teamMembers.limit}</span>
                      </div>
                      <Progress value={usageStats.teamMembers.percentage} className="h-2" />
                    </div>
                    {usageStats.overageCost > 0 && (
                      <div className="text-sm text-orange-600">
                        Overage cost: ${(usageStats.overageCost / 100).toFixed(2)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Loading usage stats...</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Info</CardTitle>
              </CardHeader>
              <CardContent>
                {customer ? (
                  <div className="space-y-2">
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">{customer.email}</div>
                    <div className="text-sm text-muted-foreground">ID: {customer.customerId}</div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No customer created</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.id === 'pro' ? 'border-blue-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {plan.id === 'pro' && <Badge variant="default">Popular</Badge>}
                  </CardTitle>
                  <CardDescription>
                    <div className="text-2xl font-bold">{plan.formattedPrice}</div>
                    <div className="text-sm text-muted-foreground">per {plan.interval}</div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Features:</h4>
                    <ul className="text-sm space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Limits:</h4>
                    <div className="text-sm space-y-1">
                      <div>Agents: {plan.limits.agents === -1 ? 'Unlimited' : plan.limits.agents}</div>
                      <div>Runs/month: {plan.limits.runsPerMonth === -1 ? 'Unlimited' : plan.limits.runsPerMonth}</div>
                      <div>Storage: {plan.limits.storage === -1 ? 'Unlimited' : `${plan.limits.storage}MB`}</div>
                      <div>Team members: {plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers}</div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => createCheckoutSession(plan.id)}
                    disabled={!customer}
                  >
                    {customer ? 'Subscribe' : 'Create customer first'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Tracking</CardTitle>
              <CardDescription>Track and monitor your usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => trackUsage('agent_run')}>
                  Track Agent Run
                </Button>
                <Button onClick={() => trackUsage('storage', 2500)}>
                  Track Storage (2.5GB)
                </Button>
                <Button onClick={() => trackUsage('team_member', 3)}>
                  Track Team Members (3)
                </Button>
              </div>
              
              {usageStats && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Usage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{usageStats.agentRuns.used}</div>
                          <div className="text-sm text-muted-foreground">Agent Runs</div>
                          <Progress value={usageStats.agentRuns.percentage} className="mt-2" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{usageStats.storage.used}MB</div>
                          <div className="text-sm text-muted-foreground">Storage Used</div>
                          <Progress value={usageStats.storage.percentage} className="mt-2" />
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{usageStats.teamMembers.used}</div>
                          <div className="text-sm text-muted-foreground">Team Members</div>
                          <Progress value={usageStats.teamMembers.percentage} className="mt-2" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Customer</CardTitle>
                <CardDescription>Create a new Stripe customer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Customer Name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <Button onClick={createCustomer} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Customer'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create Subscription</CardTitle>
                <CardDescription>Create a new subscription (requires customer)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sub-email">Email</Label>
                  <Input
                    id="sub-email"
                    type="email"
                    placeholder="customer@example.com"
                    value={newSubscription.email}
                    onChange={(e) => setNewSubscription({...newSubscription, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="sub-name">Name</Label>
                  <Input
                    id="sub-name"
                    placeholder="Customer Name"
                    value={newSubscription.name}
                    onChange={(e) => setNewSubscription({...newSubscription, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="plan">Plan</Label>
                  <Select value={newSubscription.planId} onValueChange={(value: any) =>
                    setNewSubscription({...newSubscription, planId: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="trial">Trial Days</Label>
                  <Input
                    id="trial"
                    type="number"
                    placeholder="14"
                    value={newSubscription.trialPeriodDays}
                    onChange={(e) => setNewSubscription({...newSubscription, trialPeriodDays: parseInt(e.target.value)})}
                  />
                </div>
                <Button onClick={createSubscription} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Subscription'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export individual components
export { BillingDashboard as default };
