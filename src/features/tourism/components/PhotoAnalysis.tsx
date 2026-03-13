'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { Progress } from '@/web/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/web/components/ui/tabs';
import { Upload, Image as ImageIcon, CheckCircle, AlertTriangle, XCircle, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PhotoAnalysisProps {
  propertyId: string;
}

interface AnalysisResult {
  qualityScore: number;
  qualityMetrics: {
    brightness: number;
    sharpness: number;
    composition: number;
    professionalism: number;
  };
  amenities: Array<{
    name: string;
    confidence: number;
    category: string;
  }>;
  damage: {
    detected: boolean;
    type?: string;
    severity?: string;
    description?: string;
    confidence?: number;
  };
  suggestions: string[];
}

export default function PhotoAnalysis({ propertyId }: PhotoAnalysisProps) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Prosim izberite slikovno datoteko');
      return;
    }

    setUploading(true);
    try {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);

      // TODO: Upload to actual storage and get URL
      // For now, we'll use the blob URL
      toast.success('Slika naložena');
    } catch (error) {
      toast.error('Napaka pri nalaganju slike');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    try {
      // TODO: Call actual API
      // const response = await fetch('/api/tourism/photo-analysis', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     propertyId,
      //     imageUrl: selectedImage,
      //     analysisTypes: ['quality', 'amenity', 'damage'],
      //   }),
      // });
      // const data = await response.json();

      // Mock analysis result
      const mockResult: AnalysisResult = {
        qualityScore: 85,
        qualityMetrics: {
          brightness: 90,
          sharpness: 85,
          composition: 80,
          professionalism: 85,
        },
        amenities: [
          { name: 'WiFi Router', confidence: 0.95, category: 'technology' },
          { name: 'Flat-screen TV', confidence: 0.98, category: 'entertainment' },
          { name: 'Air Conditioner', confidence: 0.92, category: 'comfort' },
          { name: 'Mini Bar', confidence: 0.88, category: 'kitchen' },
        ],
        damage: {
          detected: false,
        },
        suggestions: [
          'Povečajte osvetlitev za zmanjšanje senc',
          'Poravnajte okvir za boljšo kompozicijo',
        ],
      };

      setAnalysisResult(mockResult);
      toast.success('Analiza končana');
    } catch (error) {
      toast.error('Napaka pri analizi slike');
    } finally {
      setAnalyzing(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 90) return 'Odlično';
    if (score >= 75) return 'Dobro';
    if (score >= 60) return 'Povprečno';
    return 'Potrebuje Izboljšanje';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Analiza Fotografij</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Analiza kakovosti, opreme in poškodb s pomočjo umetne inteligence
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Naloži Fotografijo</CardTitle>
            <CardDescription>Izberite fotografijo za analizo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800">
              <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button asChild disabled={uploading}>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Nalaganje...' : 'Izberi Sliko'}
                  </span>
                </Button>
              </label>
              <p className="text-sm text-gray-500 mt-2">
                PNG, JPG do 10MB
              </p>
            </div>

            {selectedImage && (
              <div className="mt-4">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full mt-4"
                >
                  {analyzing ? 'Analiziranje...' : 'Zaženi Analizo'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistika Analiz</CardTitle>
            <CardDescription>Pregled analiziranih fotografij</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">24</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Analiziranih</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600">18</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Kakovostnih</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">4</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Srednje</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600">2</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Slabih</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Povprečna kakovost</span>
                <span className="text-sm font-bold">76/100</span>
              </div>
              <Progress value={76} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <Tabs defaultValue="quality" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quality">
              <ImageIcon className="w-4 h-4 mr-2" />
              Kakovost
            </TabsTrigger>
            <TabsTrigger value="amenities">
              <CheckCircle className="w-4 h-4 mr-2" />
              Oprema
            </TabsTrigger>
            <TabsTrigger value="damage">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Poškodbe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Analiza Kakovosti
                  <Badge className={getQualityColor(analysisResult.qualityScore)}>
                    {getQualityLabel(analysisResult.qualityScore)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-bold">{analysisResult.qualityScore}</div>
                  <div className="text-gray-600 dark:text-gray-400">od 100</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Osvetlitev</span>
                      <span className="text-sm font-medium">
                        {analysisResult.qualityMetrics.brightness}%
                      </span>
                    </div>
                    <Progress value={analysisResult.qualityMetrics.brightness} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Ostrina</span>
                      <span className="text-sm font-medium">
                        {analysisResult.qualityMetrics.sharpness}%
                      </span>
                    </div>
                    <Progress value={analysisResult.qualityMetrics.sharpness} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Kompozicija</span>
                      <span className="text-sm font-medium">
                        {analysisResult.qualityMetrics.composition}%
                      </span>
                    </div>
                    <Progress value={analysisResult.qualityMetrics.composition} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Profesionalnost</span>
                      <span className="text-sm font-medium">
                        {analysisResult.qualityMetrics.professionalism}%
                      </span>
                    </div>
                    <Progress value={analysisResult.qualityMetrics.professionalism} className="h-2" />
                  </div>
                </div>

                {analysisResult.suggestions.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Priporočila za Izboljšavo:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {analysisResult.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="amenities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zaznana Oprema</CardTitle>
                <CardDescription>
                  {analysisResult.amenities.length} elementov zaznanih na sliki
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.amenities.map((amenity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium">{amenity.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{amenity.category}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {Math.round(amenity.confidence * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="damage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detekcija Poškodb</CardTitle>
              </CardHeader>
              <CardContent>
                {analysisResult.damage.detected ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-800 mb-1">
                          Poškodba Zaznana
                        </h4>
                        <p className="text-sm text-red-700">
                          {analysisResult.damage.description || 'Neznana poškodba'}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <Badge variant="destructive">
                            Vrsta: {analysisResult.damage.type || 'Neznano'}
                          </Badge>
                          <Badge variant="secondary">
                            Resnost: {analysisResult.damage.severity || 'Neznano'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-800">
                          Ni Zaznanih Poškodb
                        </h4>
                        <p className="text-sm text-green-700">
                          Slika ne kaže nobenih vidnih poškodb ali težav
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
