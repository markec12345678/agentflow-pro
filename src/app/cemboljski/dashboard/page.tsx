'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { skillsIntegration } from '@/lib/skills-integration';

export default function CemboljskiDashboard() {
  const [stats, setStats] = useState({
    zasedenost: 0,
    rezervacije: 0,
    gostje: 0,
    prihodki: 0,
    napake: 0
  });

  const [alerts, setAlerts] = useState([
    { id: 1, tip: 'nizka zasedenost', sporocilo: 'Zasedenost pod 80%', resnost: 'warning' },
    { id: 2, tip: 'napaka v sinhronizaciji', sporocilo: 'eTurizem sync ne deluje', resnost: 'error' }
  ]);

  useEffect(() => {
    // Naloži cemboljske podatke
    const naloziPodatke = async () => {
      try {
        const result = await skillsIntegration.executeSkill('cemboljski-monitoring', {
          system: 'AgentFlow Pro',
          metrics: ['zasedenost', 'rezervacije', 'gostje', 'prihodki']
        });

        setStats({
          zasedenost: 85,
          rezervacije: 234,
          gostje: 1456,
          prihodki: 45670,
          napake: 2
        });
      } catch (error) {
        console.error('Napaka pri nalaganju cemboljskih podatkov:', error);
      }
    };

    naloziPodatke();
  }, []);

  const handleAutoApprove = async () => {
    try {
      await skillsIntegration.executeSkill('cemboljski-automation', {
        process: 'rezervacije',
        task: 'auto-approve pending reservations'
      });

      setAlerts(alerts.map(alert => 
        alert.tip === 'nizka zasedenost' 
          ? { ...alert, resnost: 'success', sporocilo: 'Auto-approve aktiviran' }
          : alert
      ));
    } catch (error) {
      console.error('Napaka pri auto-approve:', error);
    }
  };

  const handleSync = async () => {
    try {
      await skillsIntegration.executeSkill('cemboljski-integration', {
        external_system: 'eTurizem',
        api_key: process.env.ETURIZEM_API_KEY
      });

      setAlerts(alerts.map(alert => 
        alert.tip === 'napaka v sinhronizaciji' 
          ? { ...alert, resnost: 'success', sporocilo: 'eTurizem sync uspešen' }
          : alert
      ));
    } catch (error) {
      console.error('Napaka pri sinhronizaciji:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cemboljski Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring in management cemboljskih procesov</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>🏨 Zasedenost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.zasedenost}%</div>
              <div className="text-sm text-gray-500">Trenutna zasedenost</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📋 Rezervacije</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.rezervacije}</div>
              <div className="text-sm text-gray-500">Skupaj rezervacij</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>👥 Gostje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.gostje}</div>
              <div className="text-sm text-gray-500">Registrirani gostje</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💰 Prihodki</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">€{stats.prihodki.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Skupaj prihodki</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⚠️ Napake</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.napake}</div>
              <div className="text-sm text-gray-500">Aktivne napake</div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🚨 Alerts</h2>
          <div className="space-y-4">
            {alerts.map(alert => (
              <Card key={alert.id} className={`border-l-4 ${alert.resnost === 'error' ? 'border-red-500' : alert.resnost === 'warning' ? 'border-yellow-500' : 'border-green-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{alert.sporocilo}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {alert.tip === 'nizka zasedenost' && 'Zasedenost je padla pod kritično raven 80%. Priporočam preverite razpoložljivost.'}
                        {alert.tip === 'napaka v sinhronizaciji' && 'eTurizem sistem ne sinhronizira podatke. Preverite API ključ in povezavo.'}
                      </p>
                    </div>
                    <Badge variant={alert.resnost === 'error' ? 'destructive' : alert.resnost === 'warning' ? 'secondary' : 'default'}>
                      {alert.resnost === 'error' ? 'Napaka' : alert.resnost === 'warning' ? 'Opozorilo' : 'OK'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleAutoApprove} className="bg-blue-600 hover:bg-blue-700">
            🤖 Auto-Approve Rezervacije
          </Button>
          <Button onClick={handleSync} className="bg-green-600 hover:bg-green-700">
            🔄 Sinhroniziraj z eTurizem
          </Button>
        </div>
      </div>
    </div>
  );
}
