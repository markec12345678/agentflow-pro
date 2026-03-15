'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/infrastructure/observability/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { skillsIntegration } from '@/lib/skills-integration';

interface Rezervacija {
  id: string;
  gost: string;
  soba: string;
  prihod: Date;
  odhod: Date;
  status: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  cena: number;
  avtomatskoOdobri: boolean;
}

export default function CemboljskeRezervacije() {
  const [rezervacije, setRezervacije] = useState<Rezervacija[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Naloži rezervacije
    const naloziRezervacije = async () => {
      try {
        setLoading(true);
        // Simuliraj API klic
        const mockRezervacije: Rezervacija[] = [
          {
            id: '1',
            gost: 'Janez Novak',
            soba: '101',
            prihod: new Date('2026-03-05T14:00:00'),
            odhod: new Date('2026-03-07T11:00:00'),
            status: 'confirmed',
            cena: 120,
            avtomatskoOdobri: true
          },
          {
            id: '2',
            gost: 'Maja Horvat',
            soba: '102',
            prihod: new Date('2026-03-05T16:00:00'),
            odhod: new Date('2026-03-08T10:00:00'),
            status: 'pending',
            cena: 95,
            avtomatskoOdobri: true
          },
          {
            id: '3',
            gost: 'Marko Novak',
            soba: '103',
            prihod: new Date('2026-03-06T15:00:00'),
            odhod: new Date('2026-03-09T12:00:00'),
            status: 'checked-in',
            cena: 150,
            avtomatskoOdobri: false
          }
        ];

        setRezervacije(mockRezervacije);
      } catch (error) {
        logger.error('Napaka pri nalaganju rezervacij:', error);
      } finally {
        setLoading(false);
      }
    };

    naloziRezervacije();
  }, []);

  const filteredRezervacije = rezervacije.filter(rez => {
    if (filter === 'all') return true;
    return rez.status === filter;
  });

  const handleAvtomatskoOdobri = async (rezervacija: Rezervacija) => {
    try {
      await skillsIntegration.executeSkill('cemboljski-automation', {
        process: 'rezervacije',
        task: `auto-approve rezervacija ${rezervacija.id}`
      });

      setRezervacije(rezervacije.map(r => 
        r.id === rezervacija.id 
          ? { ...r, status: 'confirmed' as const }
          : r
      ));
    } catch (error) {
      logger.error('Napaka pri avtomatskem odobritvi:', error);
    }
  };

  const handleManualOdobritev = async (rezervacija: Rezervacija, status: 'confirmed' | 'cancelled') => {
    try {
      await skillsIntegration.executeSkill('cemboljski-automation', {
        process: 'rezervacije',
        task: `manual approval ${rezervacija.id} - ${status}`
      });

      setRezervacije(rezervacije.map(r => 
        r.id === rezervacija.id 
          ? { ...r, status: status as const }
          : r
      ));
    } catch (error) {
      logger.error('Napaka pri ročni odobritvi:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">Čakajoče</Badge>;
      case 'confirmed': return <Badge variant="default">Potrjeno</Badge>;
      case 'checked-in': return <Badge variant="default">Prijavljen</Badge>;
      case 'checked-out': return <Badge variant="destructive">Odjavljen</Badge>;
      case 'cancelled': return <Badge variant="destructive">Preklicano</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'confirmed': return 'text-green-600';
      case 'checked-in': return 'text-blue-600';
      case 'checked-out': return 'text-gray-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Nalagam rezervacije...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Cemboljske Rezervacije</h1>
          <p className="text-gray-600">Management in avtomatizacija rezervacij</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtriraj status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Vse</SelectItem>
              <SelectItem value="pending">Čakajoče</SelectItem>
              <SelectItem value="confirmed">Potrjene</SelectItem>
              <SelectItem value="checked-in">Prijavljeni</SelectItem>
              <SelectItem value="checked-out">Odjavljeni</SelectItem>
              <SelectItem value="cancelled">Preklicane</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rezervacije */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRezervacije.map(rezervacija => (
            <Card key={rezervacija.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>#{rezervacija.soba} - {rezervacija.gost}</CardTitle>
                  {getStatusBadge(rezervacija.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Prihod</label>
                      <div className="text-sm text-gray-900">
                        {rezervacija.prihod.toLocaleString('sl-SI')}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Odhod</label>
                      <div className="text-sm text-gray-900">
                        {rezervacija.odhod.toLocaleString('sl-SI')}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cena</label>
                    <div className="text-lg font-bold text-green-600">€{rezervacija.cena}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto-odobri</label>
                    <div className="text-sm">
                      {rezervacija.avtomatskoOdobri ? (
                        <Badge variant="default">Da</Badge>
                      ) : (
                        <Badge variant="secondary">Ne</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className={`text-sm font-semibold ${getStatusColor(rezervacija.status)}`}>
                      {rezervacija.status.charAt(0).toUpperCase() + rezervacija.status.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {rezervacija.status === 'pending' && (
                    <Button 
                      onClick={() => handleAvtomatskoOdobri(rezervacija)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      ✅ Avtomatsko Odobri
                    </Button>
                  )}
                  
                  {rezervacija.status === 'pending' && (
                    <Button 
                      onClick={() => handleManualOdobritev(rezervacija, 'confirmed')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      ✅ Ročno Potrdi
                    </Button>
                  )}
                  
                  {rezervacija.status === 'pending' && (
                    <Button 
                      onClick={() => handleManualOdobritev(rezervacija, 'cancelled')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      ❌ Prekliči
                    </Button>
                  )}

                  {rezervacija.status === 'confirmed' && (
                    <Button 
                      onClick={() => handleManualOdobritev(rezervacija, 'cancelled')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      ❌ Prekliči
                    </Button>
                  )}

                  {rezervacija.status === 'checked-in' && (
                    <Button 
                      onClick={() => handleManualOdobritev(rezervacija, 'checked-out')}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      🚪 Odjavi
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
