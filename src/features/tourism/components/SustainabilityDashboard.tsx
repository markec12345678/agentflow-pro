'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { Progress } from '@/web/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/web/components/ui/tabs';
import { Input } from '@/web/components/ui/input';
import { Label } from '@/web/components/ui/label';
import {
  Leaf,
  TrendingUp,
  Droplet,
  Zap,
  Recycle,
  Award,
  Download,
  Plus,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface SustainabilityDashboardProps {
  propertyId: string;
}

interface CarbonFootprint {
  totalCarbonKg: number;
  breakdown: {
    energy: number;
    water: number;
    waste: number;
    recycling: number;
  };
  perNight?: number;
  rating: 'A' | 'B' | 'C' | 'D' | 'E';
}

interface EcoPractice {
  id: string;
  name: string;
  category: string;
  implemented: boolean;
  impactLevel: string;
}

interface Certification {
  id: string;
  name: string;
  level: string;
  validUntil: string;
  status: string;
}

export default function SustainabilityDashboard({ propertyId }: SustainabilityDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [carbonFootprint, setCarbonFootprint] = useState<CarbonFootprint | null>(null);
  const [practices, setPractices] = useState<EcoPractice[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [metrics, setMetrics] = useState({
    energyKwh: 0,
    waterM3: 0,
    wasteKg: 0,
    recyclingKg: 0,
  });

  useEffect(() => {
    loadSustainabilityData();
  }, [propertyId]);

  const loadSustainabilityData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API calls
      // const [carbonRes, practicesRes, certsRes] = await Promise.all([
      //   fetch(`/api/tourism/sustainability/carbon-footprint?propertyId=${propertyId}`),
      //   fetch(`/api/tourism/sustainability/practices?propertyId=${propertyId}`),
      //   fetch(`/api/tourism/sustainability/certifications?propertyId=${propertyId}`),
      // ]);

      // Mock data
      setCarbonFootprint({
        totalCarbonKg: 1250,
        breakdown: {
          energy: 800,
          water: 250,
          waste: 200,
          recycling: -50,
        },
        perNight: 12.5,
        rating: 'B',
      });

      setMetrics({
        energyKwh: 3433,
        waterM3: 727,
        wasteKg: 400,
        recyclingKg: 167,
      });

      setPractices([
        { id: '1', name: 'LED Osvetljava', category: 'energy', implemented: true, impactLevel: 'medium' },
        { id: '2', name: 'Varčne Pipe', category: 'water', implemented: true, impactLevel: 'low' },
        { id: '3', name: 'Ločevanje Odpadkov', category: 'waste', implemented: true, impactLevel: 'medium' },
        { id: '4', name: 'Sončni Paneli', category: 'energy', implemented: false, impactLevel: 'high' },
        { id: '5', name: 'Kompostiranje', category: 'waste', implemented: false, impactLevel: 'low' },
      ]);

      setCertifications([
        {
          id: '1',
          name: 'EU Ecolabel',
          level: 'gold',
          validUntil: '2027-12-31',
          status: 'active',
        },
      ]);
    } catch (error) {
      logger.error('Failed to load sustainability data:', error);
      toast.error('Napaka pri nalaganju podatkov');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMetrics = async () => {
    try {
      // TODO: Call API to save metrics
      toast.success('Podatki shranjeni');
      loadSustainabilityData();
    } catch (error) {
      toast.error('Napaka pri shranjevanju');
    }
  };

  const getRatingColor = (rating: string) => {
    const colors: Record<string, string> = {
      A: 'bg-green-600',
      B: 'bg-green-500',
      C: 'bg-yellow-500',
      D: 'bg-orange-500',
      E: 'bg-red-500',
    };
    return colors[rating] || 'bg-gray-500';
  };

  const implementedCount = practices.filter(p => p.implemented).length;
  const implementationRate = practices.length > 0 
    ? Math.round((implementedCount / practices.length) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Nalaganje trajnostnih podatkov...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            Trajnostni Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Spremljanje ogljičnega odtisa in eco praks
          </p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Izvozi Poročilo
        </Button>
      </div>

      {/* Carbon Rating */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Ocena Trajnostnosti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Vaša trenutna ocena
              </p>
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 ${getRatingColor(carbonFootprint?.rating || 'C')} rounded-full flex items-center justify-center text-white text-3xl font-bold`}>
                  {carbonFootprint?.rating || '-'}
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {carbonFootprint?.perNight || 0} kg CO2e / nočitev
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Skupaj: {carbonFootprint?.totalCarbonKg || 0} kg CO2e ta mesec
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Implementirane prakse
              </p>
              <p className="text-2xl font-bold">
                {implementedCount}/{practices.length}
              </p>
              <Progress value={implementationRate} className="mt-2 h-2" />
              <p className="text-xs text-gray-500 mt-1">{implementationRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Input */}
      <Card>
        <CardHeader>
          <CardTitle>Vnos Metrik</CardTitle>
          <CardDescription>Mesečni podatki o porabi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="energy">
                <Zap className="w-4 h-4 inline mr-1" />
                Energija (kWh)
              </Label>
              <Input
                id="energy"
                type="number"
                value={metrics.energyKwh}
                onChange={e => setMetrics({ ...metrics, energyKwh: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="water">
                <Droplet className="w-4 h-4 inline mr-1" />
                Voda (m³)
              </Label>
              <Input
                id="water"
                type="number"
                value={metrics.waterM3}
                onChange={e => setMetrics({ ...metrics, waterM3: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waste">
                <Recycle className="w-4 h-4 inline mr-1" />
                Odpadki (kg)
              </Label>
              <Input
                id="waste"
                type="number"
                value={metrics.wasteKg}
                onChange={e => setMetrics({ ...metrics, wasteKg: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recycling">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Recikliranje (kg)
              </Label>
              <Input
                id="recycling"
                type="number"
                value={metrics.recyclingKg}
                onChange={e => setMetrics({ ...metrics, recyclingKg: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <Button onClick={handleSaveMetrics} className="mt-4">
            Shrani in Izračunaj
          </Button>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">
            <TrendingUp className="w-4 h-4 mr-2" />
            Razčlenitev
          </TabsTrigger>
          <TabsTrigger value="practices">
            <Leaf className="w-4 h-4 mr-2" />
            Eco Prakse
          </TabsTrigger>
          <TabsTrigger value="certifications">
            <Award className="w-4 h-4 mr-2" />
            Certifikati
          </TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ogljični Odtis po Kategorijah</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium">Energija</p>
                    <p className="text-sm text-gray-500">Elektrika, ogrevanje, hlajenje</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{carbonFootprint?.breakdown.energy || 0} kg</p>
                  <Progress 
                    value={(carbonFootprint?.breakdown.energy || 0) / (carbonFootprint?.totalCarbonKg || 1) * 100} 
                    className="h-2 mt-1 w-24" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Droplet className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Voda</p>
                    <p className="text-sm text-gray-500">Poraba in obdelava vode</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{carbonFootprint?.breakdown.water || 0} kg</p>
                  <Progress 
                    value={(carbonFootprint?.breakdown.water || 0) / (carbonFootprint?.totalCarbonKg || 1) * 100} 
                    className="h-2 mt-1 w-24" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Recycle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Odpadki</p>
                    <p className="text-sm text-gray-500">Komunalni odpadki</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{carbonFootprint?.breakdown.waste || 0} kg</p>
                  <Progress 
                    value={(carbonFootprint?.breakdown.waste || 0) / (carbonFootprint?.totalCarbonKg || 1) * 100} 
                    className="h-2 mt-1 w-24" 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Recikliranje</p>
                    <p className="text-sm text-gray-500">Kredit za recikliranje</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">-{Math.abs(carbonFootprint?.breakdown.recycling || 0)} kg</p>
                  <p className="text-xs text-green-600">Pozitiven vpliv</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Eco Prakse</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Prakso
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {practices.map(practice => (
                  <div
                    key={practice.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {practice.implemented ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                      <div>
                        <p className="font-medium">{practice.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          Kategorija: {practice.category} • Vpliv: {practice.impactLevel}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={practice.implemented ? 'default' : 'outline'}
                    >
                      {practice.implemented ? 'Implementirano' : 'Implementiraj'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Certifikati</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Certifikat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {certifications.map(cert => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-yellow-600" />
                      <div>
                        <p className="font-semibold">{cert.name}</p>
                        <p className="text-sm text-gray-500">
                          Nivo: {cert.level} • Velja do: {new Date(cert.validUntil).toLocaleDateString('sl-SI')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={cert.status === 'active' ? 'default' : 'secondary'}>
                      {cert.status === 'active' ? 'Aktiven' : 'Potekel'}
                    </Badge>
                  </div>
                ))}
                {certifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Nimate še nobenega certifikata</p>
                    <Button variant="link" className="mt-2">
                      Preveri pogoje za certifikate
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
