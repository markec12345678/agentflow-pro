'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { skillsIntegration } from '@/lib/skills-integration';

interface Gost {
  id: string;
  ime: string;
  priimek: string;
  email: string;
  telefon: string;
  drzava: string;
  datumRojstva: Date;
  rezervacije: number;
  status: 'active' | 'inactive' | 'blacklisted';
}

export default function CemboljskiGostje() {
  const [gostje, setGostje] = useState<Gost[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Naloži goste
    const naloziGoste = async () => {
      try {
        setLoading(true);
        // Simuliraj API klic
        const mockGosti: Gost[] = [
          {
            id: '1',
            ime: 'Janez',
            priimek: 'Novak',
            email: 'janez.novak@email.com',
            telefon: '+386 41 123 456',
            drzava: 'Slovenija',
            datumRojstva: new Date('1985-03-15'),
            rezervacije: 12,
            status: 'active'
          },
          {
            id: '2',
            ime: 'Maja',
            priimek: 'Horvat',
            email: 'maja.horvat@email.com',
            telefon: '+386 41 234 567',
            drzava: 'Slovenija',
            datumRojstva: new Date('1990-07-22'),
            rezervacije: 8,
            status: 'active'
          },
          {
            id: '3',
            ime: 'Marko',
            priimek: 'Novak',
            email: 'marko.novak@email.com',
            telefon: '+386 41 345 678',
            drzava: 'Hrvaška',
            datumRojstva: new Date('1992-11-30'),
            rezervacije: 15,
            status: 'inactive'
          }
        ];

        setGostje(mockGosti);
      } catch (error) {
        console.error('Napaka pri nalaganju gostov:', error);
      } finally {
        setLoading(false);
      }
    };

    naloziGoste();
  }, []);

  const filteredGostje = gostje.filter(gost => 
    gost.ime.toLowerCase().includes(filter.toLowerCase()) ||
    gost.priimek.toLowerCase().includes(filter.toLowerCase()) ||
    gost.email.toLowerCase().includes(filter.toLowerCase())
  );

  const handleStatusChange = async (gost: Gost, status: 'active' | 'inactive' | 'blacklisted') => {
    try {
      await skillsIntegration.executeSkill('cemboljski-automation', {
        process: 'gostje',
        task: `update status ${gost.id} to ${status}`
      });

      setGostje(gostje.map(g => 
        g.id === gost.id 
          ? { ...g, status: status as const }
          : g
      ));
    } catch (error) {
      console.error('Napaka pri spremembi statusa:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="default">Aktiven</Badge>;
      case 'inactive': return <Badge variant="secondary">Neaktiven</Badge>;
      case 'blacklisted': return <Badge variant="destructive">Blacklist</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-gray-600';
      case 'blacklisted': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Nalagam goste...</div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Cemboljski Gostje</h1>
          <p className="text-gray-600">Management registriranih gostov</p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Išči goste..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full max-w-md"
          />
        </div>

        {/* Gostje */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGostje.map(gost => (
            <Card key={gost.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{gost.ime} {gost.priimek}</CardTitle>
                  {getStatusBadge(gost.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="text-sm text-gray-900">{gost.email}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Telefon</label>
                      <div className="text-sm text-gray-900">{gost.telefon}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Država</label>
                      <div className="text-sm text-gray-900">{gost.drzava}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Datum rojstva</label>
                      <div className="text-sm text-gray-900">{gost.datumRojstva.toLocaleDateString('sl-SI')}</div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Rezervacije</label>
                    <div className="text-lg font-bold text-blue-600">{gost.rezervacije}</div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className={`text-sm font-semibold ${getStatusColor(gost.status)}`}>
                      {gost.status.charAt(0).toUpperCase() + gost.status.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  {gost.status === 'inactive' && (
                    <Button 
                      onClick={() => handleStatusChange(gost, 'active')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      ✅ Aktiviraj
                    </Button>
                  )}
                  
                  {gost.status === 'active' && (
                    <Button 
                      onClick={() => handleStatusChange(gost, 'inactive')}
                      className="bg-gray-600 hover:bg-gray-700"
                    >
                      ⏸️ Deaktiviraj
                    </Button>
                  )}
                  
                  {gost.status !== 'blacklisted' && (
                    <Button 
                      onClick={() => handleStatusChange(gost, 'blacklisted')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      🚫 Blacklist
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
