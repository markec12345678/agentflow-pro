'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { Progress } from '@/web/components/ui/progress';
import {
  CreditCard,
  Download,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  planName: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'uncollectible' | 'void';
  created: Date;
  invoiceUrl?: string;
}

interface BillingPortalProps {
  userId: string;
}

export default function BillingPortal({ userId }: BillingPortalProps) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, [userId]);

  const loadBillingData = async () => {
    try {
      const res = await fetch('/api/billing/portal');
      const data = await res.json();
      
      setSubscription(data.subscription);
      setInvoices(data.invoices || []);
    } catch (error) {
      logger.error('Failed to load billing data:', error);
      toast.error('Napaka pri nalaganju billing podatkov');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast.error('Napaka pri odpiranju billing portala');
    } finally {
      setPortalLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceUrl?: string) => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    } else {
      toast.info('Invoice PDF ni na voljo');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Ali ste prepričani, da želite preklicati naročnino?')) return;

    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
      });
      
      if (res.ok) {
        toast.success('Naročnina bo preklicana na koncu obračunskega obdobja');
        loadBillingData();
      } else {
        toast.error('Napaka pri preklicu naročnine');
      }
    } catch (error) {
      toast.error('Napaka pri preklicu naročnine');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'trialing':
        return 'bg-blue-500';
      case 'past_due':
        return 'bg-red-500';
      case 'canceled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('sl-SI', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('sl-SI', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Nalaganje billing podatkov...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Naročnina</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upravljanje naročnine in plačil
          </p>
        </div>
        <Button onClick={handleOpenPortal} disabled={portalLoading}>
          <Settings className="w-4 h-4 mr-2" />
          {portalLoading ? 'Odpiranje...' : 'Uredi Naročnino'}
        </Button>
      </div>

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Trenutna Naročnina
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{subscription.planName}</p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(subscription.amount, subscription.currency)} / {subscription.interval}
                  </p>
                </div>
                <Badge className={getStatusColor(subscription.status)}>
                  {subscription.status === 'active' && 'Aktivno'}
                  {subscription.status === 'trialing' && 'Preizkusno'}
                  {subscription.status === 'past_due' && 'Zapadlo'}
                  {subscription.status === 'canceled' && 'Preklicano'}
                </Badge>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Naslednje plačilo: {formatDate(subscription.currentPeriodEnd)}</span>
                </div>
                
                {subscription.cancelAtPeriodEnd && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ Naročnina bo preklicana na koncu obračunskega obdobja
                    </p>
                  </div>
                )}
              </div>

              {!subscription.cancelAtPeriodEnd && subscription.status !== 'canceled' && (
                <Button variant="outline" onClick={handleCancelSubscription} className="w-full">
                  Prekliči Naročnino
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-gray-600 dark:text-gray-400">
                Nimate aktivne naročnine
              </p>
              <Button className="mt-4" onClick={handleOpenPortal}>
                Izberi Naročnino
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      {subscription && subscription.status === 'active' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Uporaba Ta Mesec
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>AI Klici</span>
                <span className="text-gray-500">847 / 1000</span>
              </div>
              <Progress value={84.7} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Workflow Executions</span>
                <span className="text-gray-500">234 / 500</span>
              </div>
              <Progress value={46.8} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Shramba</span>
                <span className="text-gray-500">2.3 GB / 5 GB</span>
              </div>
              <Progress value={46} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Računi
          </CardTitle>
          <CardDescription>
            Pregled vseh plačanih računov
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(invoice.created)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                  >
                    {invoice.status === 'paid' && 'Plačano'}
                    {invoice.status === 'open' && 'Odprto'}
                    {invoice.status === 'uncollectible' && 'Neizterljivo'}
                    {invoice.status === 'void' && 'Stornirano'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceUrl)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {invoices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>Še nimate nobenega računa</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plačilna Metoda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-xs text-gray-500">Poteče: 12/2026</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenPortal}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Uredi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
