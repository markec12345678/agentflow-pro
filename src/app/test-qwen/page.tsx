"use client";

import { useState } from 'react';
import { createGeminiAI, validateGeminiKey, GEMINI_MODELS } from '@/lib/gemini-ai';

export default function TestGeminiPage() {
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackKey, setFallbackKey] = useState('');
  
  // Warning if no API key is set
  const showKeyWarning = !apiKey && !process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const handleTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // 1. Validate API key
      const validation = await validateGeminiKey(apiKey);
      
      if (!validation.valid) {
        setTestResult({
          success: false,
          error: validation.error,
        });
        setMessage('❌ API key ni veljaven');
        setLoading(false);
        return;
      }

      setMessage('✅ API key veljaven! Testiram model...');

      // 2. Test generation
      const gemini = createGeminiAI(apiKey, selectedModel);
      const startTime = Date.now();
      
      const response = await gemini.generateText(
        'Pozdrav! Sem testno sporočilo. Odgovori na kratko v slovenščini.'
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      setTestResult({
        success: true,
        response,
        duration,
        model: selectedModel,
        availableModels: validation.models,
      });
      setMessage('✅ Gemini deluje popolnoma!');
      
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setMessage('❌ Napaka pri testiranju');
    } finally {
      setLoading(false);
    }
  };

  const handleConciergeTest = async () => {
    setLoading(true);
    
    try {
      const gemini = createGeminiAI(apiKey, selectedModel);
      
      const conversation = `User: Imam hotel Slon v Ljubljani s 12 sobami`;
      
      const entities = await gemini.extractEntities(conversation);
      
      setTestResult({
        success: true,
        type: 'entity_extraction',
        entities,
      });
      setMessage('✅ Entity extraction deluje!');
      
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🧪 Test Qwen AI</h1>
        
        {/* API Key Input */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. API Key</h2>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
          <p className="text-sm text-gray-500 mt-2">
            Tvoj key: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {apiKey ? `${apiKey.slice(0, 10)}...` : 'ni vnesen'}
            </code>
          </p>
        </div>

        {/* Model Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Izberi Gemini Model</h2>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            {Object.entries(GEMINI_MODELS).map(([id, info]) => (
              <option key={id} value={id}>
                {info.name} - ${info.price}/1M tokens ({info.best})
              </option>
            ))}
          </select>
        </div>

        {/* Test Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">3. Testiraj</h2>
          <div className="flex gap-4">
            <button
              onClick={handleTest}
              disabled={loading || !apiKey}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
            >
              {loading ? 'Testiram...' : '🧪 Test Generation'}
            </button>
            <button
              onClick={handleConciergeTest}
              disabled={loading || !apiKey}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
            >
              {loading ? 'Testiram...' : '🤖 Test Concierge'}
            </button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
          }`}>
            <p className="font-medium">{message}</p>
          </div>
        )}

        {/* Results */}
        {testResult && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Rezultati</h2>
            
            {testResult.success ? (
              <div className="space-y-4">
                <div className="text-green-600">✅ Uspešno!</div>
                
                {testResult.type === 'entity_extraction' ? (
                  <div>
                    <h3 className="font-semibold mb-2">Extracted Entities:</h3>
                    <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto text-sm">
                      {JSON.stringify(testResult.entities, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500">
                      Model: {testResult.model} | Čas: {testResult.duration}ms
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Response:</h3>
                      <p className="whitespace-pre-wrap">{testResult.response}</p>
                    </div>
                  </>
                )}
                
                {testResult.availableModels && (
                  <div>
                    <h3 className="font-semibold mb-2">Dostopni Qwen modeli:</h3>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                      {testResult.availableModels.slice(0, 10).map((m: string) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Napaka: {testResult.error}
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-semibold mb-2">💡 Google Gemini Prednosti:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Gemini 2.0 Flash je hiter in poceni</li>
            <li>1M tokenov konteksta (največ na trgu!)</li>
            <li>Odlična podpora za slovenščino</li>
            <li>10x ceneje od GPT-4</li>
            <li>Integracija z Google ekosistemom</li>
            <li>Popoln za AI Concierge</li>
          </ul>
        </div>

        {/* Quota Info */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-xl p-6 mt-6">
          <h3 className="font-semibold mb-2">⚠️ Quota Limits (Free Tier):</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>15 requests na minuto</li>
            <li>1M tokenov na minuto</li>
            <li>1500 requests na dan</li>
          </ul>
          <p className="text-sm mt-2">
            💡 Če dobiš quota error, počakaj 60 sekund ali uporabi drug API key.
          </p>
        </div>

        {/* Fallback Option */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6">
          <h3 className="font-semibold mb-4">🔄 Fallback Option (če Gemini ne deluje)</h3>
          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useFallback}
                onChange={(e) => setUseFallback(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Uporabi OpenRouter fallback</span>
            </label>
          </div>
          {useFallback && (
            <input
              type="text"
              value={fallbackKey}
              onChange={(e) => setFallbackKey(e.target.value)}
              placeholder="sk-or-v1-... (OpenRouter API key)"
              className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          )}
        </div>
      </div>
    </div>
  );
}
