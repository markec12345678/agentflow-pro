'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/infrastructure/observability/logger';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: Array<{
    type: string;
    text: string;
    status: 'pending' | 'success' | 'error';
  }>;
}

export interface Resource {
  type: string;
  name: string;
  id?: string;
}

export function useConcierge(userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdResources, setCreatedResources] = useState<Resource[]>([]);
  const [context, setContext] = useState<any>(null);
  
  // Initialize conversation on mount
  useEffect(() => {
    // Add initial greeting after a short delay
    setTimeout(() => {
      setMessages([{
        role: 'assistant',
        content: `👋 Dobrodošli v AgentFlow Pro!

Jaz sem vaš osebni asistent in vam bom pomagal nastaviti vašo nastanitev v samo nekaj minutah.

Za začetek mi povejte:
• Kako se imenuje vaša nastanitev?
• Kakšen tip nastanitve imate? (hotel, apartma, kmetija, kamp)

Primer: "Hotel Slon v Ljubljani" ali "Apartma Bled z 10 sobami"`,
      }]);
    }, 500);
  }, []);

  const sendMessage = async (userMessage: string) => {
    setLoading(true);

    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Get session token from cookies
      const sessionToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('next-auth.session-token='))
        ?.split('=')[1];

      // Call Concierge Agent API
      const response = await fetch('/api/v1/agents/concierge/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          context,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Add AI response to UI
      const aiMessage: Message = { 
        role: 'assistant', 
        content: result.response,
      };
      
      // Add real-time feedback actions
      if (result.step === 'property_info' && result.extractedData?.propertyName) {
        aiMessage.actions = [
          {
            type: 'create_property',
            text: `Ustvarjam "${result.extractedData.propertyName}"...`,
            status: 'pending',
          },
          {
            type: 'create_property',
            text: `✅ Nastanitev ustvarjena`,
            status: 'success',
          },
        ];
      }
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update context
      setContext(result.context || context);
      
      // Update progress
      setProgress(result.progress);
      
      // Track created resources
      if (result.createdResources && result.createdResources.length > 0) {
        const newResources: Resource[] = [];
        
        if (result.createdResources.includes('property_initialized')) {
          newResources.push({
            type: '🏨 Nastanitev',
            name: result.extractedData?.propertyName || 'Unknown',
          });
        }
        
        if (result.createdResources.includes('rooms_initialized')) {
          newResources.push({
            type: '🛏️ Sobe',
            name: `${result.extractedData?.roomCount || 0} sob`,
          });
        }

        if (result.createdResources.includes('onboarding_complete')) {
          newResources.push({
            type: '✅ Onboarding',
            name: 'Zaključeno',
          });
        }

        setCreatedResources(prev => [...prev, ...newResources]);
      }
      
    } catch (error) {
      logger.error('Error in useConcierge:', error);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Oprostite, prišlo je do napake. Poskusite znova.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setProgress(0);
    setCreatedResources([]);
    setContext(null);
  };
  
  return {
    messages,
    loading,
    progress,
    createdResources,
    sendMessage,
    clearConversation,
    context,
  };
}
