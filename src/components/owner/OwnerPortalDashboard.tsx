'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/web/components/ui/tabs';
import { Badge } from '@/web/components/ui/badge';
import { Progress } from '@/web/components/ui/progress';
import {
  Download,
  FileText,
  DollarSign,
  TrendingUp,
  Home,
  Users,
  Calendar,
  PieChart,
  Upload,
  Eye,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface OwnerDashboardProps {
  ownerId: string;
}

interface OwnerStats {
  totalRevenue: number;
  totalProperties: number;
  occupancyRate: number;
  avgDailyRate: number;
  pendingPayouts: number;
  totalPayouts: number;
}

interface RevenueShare {
  id: string;
  propertyName: string;
  revenue: number;
  ownerShare: number;
  percentage: number;
  period: string;
  status: 'pending' | 'paid' | 'processing';
  payoutDate?: string;
}

interface OwnerDocument {
  id: string;
  title: string;
  category: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  downloadCount: number;
}

interface OwnerReport {
  id: string;
  reportType: string;
  period: string;
  generatedAt: string;
  status: 'generated' | 'sent' | 'viewed';
  fileUrl?: string;
}

export default function OwnerPortalDashboard({ ownerId }: OwnerDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [revenueShares, setRevenueShares] = useState<RevenueShare[]>([]);
  const [documents, setDocuments] = useState<OwnerDocument[]>([]);
  const [reports, setReports] = useState<OwnerReport[]>([]);

  useEffect(() => {
    loadOwnerData();
  }, [ownerId]);

  const loadOwnerData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API calls
      // const [statsRes, revenueRes, docsRes, reportsRes] = await Promise.all([
      //   fetch(`/api/tourism/owner/${ownerId}/stats`),
      //   fetch(`/api/tourism/owner/${ownerId}/revenue-shares`),
      //   fetch(`/api/tourism/owner/${ownerId}/documents`),
      //   fetch(`/api/tourism/owner/${ownerId}/reports`),
      // ]);

      // Mock data for now
      setStats({
        totalRevenue: 45780,
        totalProperties: 3,
        occupancyRate: 78,
        avgDailyRate: 95,
        pendingPayouts: 3250,
        totalPayouts: 38500,
      });

      setRevenueShares([
        {
          id: '1',
          propertyName: 'Apartma Bled',
          revenue: 12500,
          ownerShare: 10000,
          percentage: 80,
          period: ' marec 2026',
          status: 'pending',
        },
        {
          id: '2',
          propertyName: 'Hotel Ljubljana',
          revenue: 28000,
          ownerShare: 19600,
          percentage: 70,
          period: ' marec 2026',
          status: 'processing',
        },
      ]);

      setDocuments([
        {
          id: '1',
          title: 'Pogodba o upravljanju',
          category: 'legal',
          fileType: 'pdf',
          fileSize: 524288,
          uploadedAt: '2026-03-01',
          downloadCount: 5,
        },
      ]);

      setReports([
        {
          id: '1',
          reportType: 'revenue',
          period: '2026-02',
          generatedAt: '2026-03-01',
          status: 'viewed',
        },
      ]);
    } catch (error) {
      logger.error('Failed to load owner data:', error);
      toast.error('Napaka pri nalaganju podatkov');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sl-SI', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleDownloadDocument = async (docId: string) => {
    try {
      // TODO: Implement actual download
      toast.success('Dokument prenesen');
    } catch (error) {
      toast.error('Napaka pri prenosu dokumenta');
    }
  };

  const handleRequestPayout = async (shareId: string) => {
    try {
      // TODO: Implement payout request
      toast.success('Zahtevek za izplačilo poslan');
    } catch (error) {
      toast.error('Napaka pri zahtevku');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Nalaganje podatkov...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Owner Portal</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Pregled prihodkov, poročil in dokumentov
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Naloži Dokument
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skupni Prihodki</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Vsi časi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zasedenost</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.occupancyRate || 0}%</div>
            <Progress value={stats?.occupancyRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neporavnana Izplačila</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.pendingPayouts || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Čaka na izplačilo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nepremičnine</CardTitle>
            <Home className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Aktivnih objektov</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">
            <DollarSign className="w-4 h-4 mr-2" />
            Prihodki
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 mr-2" />
            Poročila
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Share2 className="w-4 h-4 mr-2" />
            Dokumenti
          </TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Razdelitev Prihodkov</CardTitle>
              <CardDescription>Pregled prihodkov in lastniških deležev</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueShares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{share.propertyName}</h4>
                        <Badge variant={share.status === 'paid' ? 'default' : 'secondary'}>
                          {share.status === 'pending' && 'Čaka'}
                          {share.status === 'processing' && 'V obdelavi'}
                          {share.status === 'paid' && 'Izplačano'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Obdobje: {share.period} | Delež: {share.percentage}%
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <span className="text-xs text-gray-500">Prihodek:</span>
                          <span className="ml-2 font-medium">{formatCurrency(share.revenue)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Vaš delež:</span>
                          <span className="ml-2 font-bold text-green-600">
                            {formatCurrency(share.ownerShare)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {share.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleRequestPayout(share.id)}
                      >
                        Zahtevaj Izplačilo
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Poročila</CardTitle>
              <CardDescription>Mesečna in četrtletna poročila o uspešnosti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">
                          {report.reportType === 'revenue' && 'Poročilo o Prihodkih'}
                          {report.reportType === 'occupancy' && 'Poročilo o Zasedenosti'}
                          {report.reportType === 'performance' && 'Poročilo o Uspešnosti'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Obdobje: {report.period} | Generirano: {new Date(report.generatedAt).toLocaleDateString('sl-SI')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={report.status === 'viewed' ? 'default' : 'secondary'}>
                        {report.status === 'generated' && 'Generirano'}
                        {report.status === 'sent' && 'Poslano'}
                        {report.status === 'viewed' && 'Ogledano'}
                      </Badge>
                      {report.fileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(report.fileUrl, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ogled
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dokumenti</CardTitle>
              <CardDescription>Skupni dokumenti in pogodbe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-sm text-gray-500">
                          {doc.category.toUpperCase()} • {doc.fileType.toUpperCase()} •{' '}
                          {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {doc.downloadCount} prenosov
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadDocument(doc.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Prenesi
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
