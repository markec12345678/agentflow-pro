'use client';

/**
 * AgentFlow Pro - AI Help Bot
 * In-app AI-powered assistance
 */

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function HelpBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: 'Hi! I\'m your AgentFlow assistant. How can I help you today? 👋',
      timestamp: new Date(),
      suggestions: [
        'How do I create a workflow?',
        'What agents are available?',
        'How do I connect Booking.com?',
        'Show me tutorials',
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response (in production, call actual AI)
    setTimeout(() => {
      const botResponse = getBotResponse(content);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (question: string): Message => {
    const lowerQuestion = question.toLowerCase();

    // FAQ responses
    if (lowerQuestion.includes('create') && lowerQuestion.includes('workflow')) {
      return {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: 'To create a workflow:\n\n1. Go to Workflows → Builder\n2. Drag a trigger from the left panel\n3. Add agent/action nodes\n4. Connect nodes by dragging\n5. Configure each node\n6. Click Save!\n\nWant me to start the interactive tutorial?',
        timestamp: new Date(),
        suggestions: ['Start tutorial', 'Show video', 'Go to builder'],
      };
    }

    if (lowerQuestion.includes('what agents') || lowerQuestion.includes('available agents')) {
      return {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: 'We have 9 AI agents:\n\n🔍 Research - Web search & data\n📝 Content - Blog posts, emails\n💻 Code - Code generation\n🚀 Deploy - Deployments\n💬 Communication - Guest messaging\n📊 Optimization - SEO & pricing\n🎯 Personalization - Custom content\n🏨 Reservation - Booking management\n🤖 Concierge - Onboarding assistant',
        timestamp: new Date(),
        suggestions: ['Try Research agent', 'Try Content agent', 'See all agents'],
      };
    }

    if (lowerQuestion.includes('booking.com') || lowerQuestion.includes('connect')) {
      return {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: 'To connect Booking.com:\n\n1. Go to Settings → Integrations\n2. Click "Connect Booking.com"\n3. Enter your credentials\n4. Enable 2-way sync\n5. Map your rooms\n\nNote: You\'ll need a Booking.com extranet account.',
        timestamp: new Date(),
        suggestions: ['Go to integrations', 'Show guide', 'Contact support'],
      };
    }

    if (lowerQuestion.includes('tutorial') || lowerQuestion.includes('guide')) {
      return {
        id: `bot_${Date.now()}`,
        type: 'bot',
        content: 'I can show you interactive tutorials for:\n\n• Workflow Builder\n• Creating Bookings\n• AI Agents\n• Dashboard Basics\n\nWhich would you like?',
        timestamp: new Date(),
        suggestions: ['Workflow tutorial', 'Booking tutorial', 'Agents tutorial'],
      };
    }

    // Default response
    return {
      id: `bot_${Date.now()}`,
      type: 'bot',
      content: 'I\'m here to help! You can ask me about:\n\n• Creating workflows\n• Using AI agents\n• Channel integrations\n• Reservations & bookings\n• Dashboard features\n\nOr type "help" for more options.',
      timestamp: new Date(),
      suggestions: ['Show all features', 'Contact support', 'Documentation'],
    };
  };

  return (
    <>
      {/* Floating Help Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl transition-transform hover:scale-110"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold">AgentFlow Assistant</h3>
              <p className="text-xs text-blue-100">Always here to help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-blue-100 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  
                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSend(suggestion)}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputValue);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ➤
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-2 text-center">
              Powered by AI • Responses may vary
            </div>
          </div>
        </div>
      )}
    </>
  );
}
