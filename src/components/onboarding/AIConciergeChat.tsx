'use client';

import { useState, useEffect, useRef } from 'react';
import { useConcierge, Message as HookMessage } from '@/hooks/use-concierge';

interface Message extends HookMessage {
  timestamp?: string;
}

interface CreatedResource {
  type: string;
  name: string;
  id?: string;
}

interface AIConciergeChatProps {
  userId: string;
  onComplete?: (data: any) => void;
}

export function AIConciergeChat({ userId, onComplete }: AIConciergeChatProps) {
  const {
    messages,
    loading,
    progress,
    createdResources,
    sendMessage,
    clearConversation,
  } = useConcierge(userId);
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for onboarding complete
  useEffect(() => {
    if (progress === 100 && onComplete) {
      setTimeout(() => {
        onComplete({ progress, createdResources });
      }, 2000);
    }
  }, [progress, createdResources, onComplete]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  // Generate contextual quick replies based on current step
  const getQuickReplies = () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return [];

    const content = lastMessage.content.toLowerCase();

    if (content.includes('tip') || content.includes('imenuje')) {
      return [
        '🏨 Hotel Slon v Ljubljani',
        '🏠 Apartma Bled z 10 sobami',
        '🏡 Kmetija Vinograd',
        '⛺ Kamp Jezero',
      ];
    }

    if (content.includes('sob') || content.includes('cene')) {
      return [
        '12 sob, povprečno 85€',
        '8 double sob in 4 suite',
        'Vse sobe so enake, 70€',
        '5 sob z zajtrkom vključenim',
      ];
    }

    if (content.includes('naslov') || content.includes('lokacija')) {
      return [
        'Slovenska cesta 34, Ljubljana',
        'Blejski otok 1, Bled',
        'Piran, Obala 15',
        'Bohinj, Jezero 5',
      ];
    }

    if (content.includes('nudite') || content.includes('amenities')) {
      return [
        'WiFi, parkirišče, zajtrk',
        'Vse osnovno',
        'WiFi, bazen, spa, restavracija',
        'Parkirišče in zajtrk',
      ];
    }

    if (content.includes('eturizem') || content.includes('email')) {
      return [
        'Da, vse vklopi',
        'Samo eTurizem',
        'Samo avtomatski emaili',
        'Ne, hvala',
      ];
    }

    return [];
  };

  const quickReplies = getQuickReplies();

  return (
    <div className="max-w-2xl mx-auto h-[80vh] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header with Progress */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-white font-bold">AgentFlow Asistent</h2>
              <p className="text-blue-100 text-xs">Nastavitev nastanitve</p>
            </div>
          </div>
          <span className="text-white font-bold text-sm">{progress}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none border border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

              {/* Real-time feedback for actions */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {msg.actions.map((action, j) => (
                    <div
                      key={j}
                      className={`text-xs flex items-center gap-1 ${
                        action.status === 'success'
                          ? 'text-green-600 dark:text-green-400'
                          : action.status === 'pending'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      <span>
                        {action.status === 'pending' && '⏳'}
                        {action.status === 'success' && '✅'}
                        {action.status === 'error' && '❌'}
                      </span>
                      <span>{action.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Created resources preview */}
        {createdResources.length > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2 text-sm">
              ✅ Ustvarjeno:
            </h4>
            <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
              {createdResources.map((resource, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span>{resource.type}</span>
                  <span className="font-medium">{resource.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies (contextual suggestions) */}
      {quickReplies.length > 0 && !loading && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Hitri odgovori:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, i) => (
              <button
                key={i}
                onClick={() => handleQuickReply(reply)}
                disabled={loading}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-400 rounded-full text-xs transition border border-gray-300 dark:border-gray-600"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Odgovorite naravno... (npr. 'Imam 12 sob v Ljubljani')"
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {loading ? '⏳' : 'Pošlji →'}
          </button>
        </div>
      </div>
    </div>
  );
}
