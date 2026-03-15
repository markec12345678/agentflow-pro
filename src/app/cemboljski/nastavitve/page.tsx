'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/infrastructure/observability/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { skillsIntegration } from '@/lib/skills-integration';

interface Nastavitve {
  id: string;
  kljuc: string;
  vrednost: string | boolean | number;
  tip: 'string' | 'boolean' | 'number' | 'select';
  kategorija: 'cemboljski' | 'sistem' | 'ui' | 'integracije';
  opis: string;
}

export default function CemboljskeNastavitve() {
  const [nastavitve, setNastavitve] = useState<Nastavitve[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Naloži nastavitve
    const naloziNastavitve = async () => {
      try {
        setLoading(true);
        // Simuliraj API klic
        const mockNastavitve: Nastavitve[] = [
          {
            id: '1',
            kljuc: 'AUTO_APPROVE_THRESHOLD',
            vrednost: 80,
            tip: 'number',
            kategorija: 'cemboljski',
            opis: 'Zasedenost v % za avtomatsko odobritev'
          },
          {
            id: '2',
            kljuc: 'ETURIZEM_API_KEY',
            vrednost: 'your-api-key-here',
            tip: 'string',
            kategorija: 'integracije',
            opis: 'API ključ za eTurizem integracijo'
          },
          {
            id: '3',
            kljuc: 'AUTO_CHECKIN_ENABLED',
            vrednost: true,
            tip: 'boolean',
            kategorija: 'cemboljski',
            opis: 'Omogoči avtomatski check-in za goste'
          },
          {
            id: '4',
            kljuc: 'DASHBOARD_REFRESH_INTERVAL',
            vrednost: 30,
            tip: 'number',
            kategorija: 'sistem',
            opis: 'Interval osveževanja dashboarda v sekundah'
          },
          {
            id: '5',
            kljuc: 'THEME_COLOR',
            vrednost: '#3B82F6',
            tip: 'string',
            kategorija: 'ui',
            opis: 'Glavna barva teme'
          }
        ];

        setNastavitve(mockNastavitve);
      } catch (error) {
        logger.error('Napaka pri nalaganju nastavitev:', error);
      } finally {
        setLoading(false);
      }
    };

    naloziNastavitve();
  }, []);

  const handleValueChange = async (nastavitev: Nastavitve, vrednost: string | boolean | number) => {
    try {
      await skillsIntegration.executeSkill('cemboljski-automation', {
        process: 'nastavitve',
        task: `update ${nastavitev.kljuc} to ${vrednost}`
      });

      setNastavitve(nastavitve.map(n => 
        n.id === nastavitev.id 
          ? { ...n, vrednost: vrednost as const }
          : n
      ));
    } catch (error) {
      logger.error('Napaka pri posodobitvi nastavitve:', error);
    }
  };

  const handleToggle = async (nastavitev: Nastavitve) => {
    try {
      const novaVrednost = typeof nastavitev.vrednost === 'boolean' 
        ? !nastavitev.vrednost 
        : nastavitev.vrednost;

      await skillsIntegration.executeSkill('cemboljski-automation', {
        process: 'nastavitve',
        task: `toggle ${nastavitev.kljuc} to ${novaVrednost}`
      });

      setNastavitve(nastavitve.map(n => 
        n.id === nastavitev.id 
          ? { ...n, vrednost: novaVrednost as const }
          : n
      ));
    } catch (error) {
      logger.error('Napaka pri preklopu nastavitve:', error);
    }
  };

  const renderValueInput = (nastavitev: Nastavitve) => {
    switch (nastavitev.tip) {
      case 'string':
        return (
          <Input
            value={nastavitev.vrednost as string}
            onChange={(e) => handleValueChange(nastavitev, e.target.value)}
            className="w-full"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={nastavitev.vrednost as number}
            onChange={(e) => handleValueChange(nastavitev, parseInt(e.target.value))}
            className="w-full"
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={nastavitev.vrednost as boolean}
            onCheckedChange={(checked) => handleToggle(nastavitev, checked)}
          />
        );
      case 'select':
        return (
          <Select value={nastavitev.vrednost as string} onValueChange={(value) => handleValueChange(nastavitev, value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Svetla</SelectItem>
              <SelectItem value="dark">Temna</SelectItem>
              <SelectItem value="auto">Samodejna</SelectItem>
            </SelectContent>
          </Select>
        );
      default:
        return (
          <Input
            value={String(nastavitev.vrednost)}
            onChange={(e) => handleValueChange(nastavitev, e.target.value)}
            className="w-full"
          />
        );
    }
  };

  const filteredNastavitve = nastavitve.filter(n => 
    n.kategorija === 'cemboljski' || 
    n.kategorija === 'sistem' || 
    n.kategorija === 'ui' || 
    n.kategorija === 'integracije'
  );

  const getCategoryColor = (kategorija: string) => {
    switch (kategorija) {
      case 'cemboljski': return 'text-blue-600';
      case 'sistem': return 'text-green-600';
      case 'ui': return 'text-purple-600';
      case 'integracije': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Nalagam nastavitve...</div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Cemboljske Nastavitve</h1>
          <p className="text-gray-600">Konfiguracija cemboljskega sistema</p>
        </div>

        {/* Nastavitve */}
        <div className="space-y-6">
          {/* Cemboljske nastavitve */}
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">🏨 Cemboljske nastavitve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredNastavitve
                .filter(n => n.kategorija === 'cemboljski')
                .map(nastavitev => (
                  <div key={nastavitev.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{nastavitev.kljuc}</label>
                      <div className="text-xs text-gray-500">{nastavitev.opis}</div>
                    </div>
                    <div className="w-full">
                      {renderValueInput(nastavitev)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Sistemske nastavitve */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">🖥 Sistemske nastavitve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredNastavitve
                .filter(n => n.kategorija === 'sistem')
                .map(nastavitev => (
                  <div key={nastavitev.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{nastavitev.kljuc}</label>
                      <div className="text-xs text-gray-500">{nastavitev.opis}</div>
                    </div>
                    <div className="w-full">
                      {renderValueInput(nastavitev)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* UI nastavitve */}
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-600">🎨 UI nastavitve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredNastavitve
                .filter(n => n.kategorija === 'ui')
                .map(nastavitev => (
                  <div key={nastavitev.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{nastavitev.kljuc}</label>
                      <div className="text-xs text-gray-500">{nastavitev.opis}</div>
                    </div>
                    <div className="w-full">
                      {renderValueInput(nastavitev)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Integracijske nastavitve */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">🔗 Integracijske nastavitve</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredNastavitve
                .filter(n => n.kategorija === 'integracije')
                .map(nastavitev => (
                  <div key={nastavitev.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">{nastavitev.kljuc}</label>
                      <div className="text-xs text-gray-500">{nastavitev.opis}</div>
                    </div>
                    <div className="w-full">
                      {renderValueInput(nastavitev)}
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
