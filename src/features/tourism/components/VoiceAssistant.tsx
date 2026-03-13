'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  MessageSquare,
  Brain,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface VoiceAssistantProps {
  propertyId?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  type: 'text' | 'voice';
  content: string;
  intent?: string;
  confidence?: number;
  timestamp: Date;
  audioUrl?: string;
}

export default function VoiceAssistant({ propertyId }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionId] = useState(`session-${Date.now()}`);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        type: 'text',
        content: 'Pozdravljeni! Sem vaš glasovni asistent. Lahko mi zastavite vprašanje ali pa me prosite za pomoč pri rezervacijah.',
        timestamp: new Date(),
      },
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Poslušam...');
    } catch (error) {
      toast.error('Napaka pri dostopu do mikrofona');
      console.error('Microphone access error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.info('Obdelava govora...');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], 'voice.wav', { type: 'audio/wav' });

      // TODO: Call actual API
      // const formData = new FormData();
      // formData.append('audio', audioFile);
      // formData.append('propertyId', propertyId || '');
      // formData.append('sessionId', sessionId);
      //
      // const response = await fetch('/api/tourism/voice/interact', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();

      // Mock response
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        type: 'voice',
        content: 'Imam vprašanje o rezervaciji za naslednji teden',
        timestamp: new Date(),
      };

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        type: 'voice',
        content: 'Seveda! Za kateri datum in koliko nočitev vas zanima?',
        intent: 'booking_inquiry',
        confidence: 0.95,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);

      // Play audio response if available
      if (soundEnabled && assistantMessage.audioUrl) {
        const audio = new Audio(assistantMessage.audioUrl);
        await audio.play();
      }
    } catch (error) {
      toast.error('Napaka pri obdelavi govora');
      console.error('Voice processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const sendTextMessage = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    try {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        type: 'text',
        content: textInput,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setTextInput('');

      // TODO: Call actual API
      // const response = await fetch('/api/tourism/voice/text-interact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     text: textInput,
      //     propertyId,
      //     sessionId,
      //   }),
      // });
      // const data = await response.json();

      // Mock response
      await new Promise(resolve => setTimeout(resolve, 1000));

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        content: 'Hvala za vaše vprašanje! Kako vam lahko pomagam?',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Napaka pri pošiljanju sporočila');
    } finally {
      setIsProcessing(false);
    }
  };

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'booking_inquiry':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pricing_question':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'amenity_question':
        return <HelpCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Brain className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Glasovni Asistent
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Govorite ali pišite za pomoč
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <div className="flex flex-col h-full">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  {message.type === 'voice' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Mic className="w-3 h-3 opacity-70" />
                      <span className="text-xs opacity-70">Govor</span>
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  
                  {message.intent && (
                    <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                      {getIntentIcon(message.intent)}
                      <span className="capitalize">{message.intent.replace('_', ' ')}</span>
                      {message.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(message.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
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
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 space-y-3">
          {/* Voice Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              className={`rounded-full w-16 h-16 ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isProcessing}
            >
              {isRecording ? (
                <MicOff className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </Button>
          </div>
          <p className="text-center text-xs text-gray-500">
            {isRecording
              ? 'Izpusti za konec snemanja...'
              : 'Pritisni in drži za govor'}
          </p>

          {/* Text Input */}
          <div className="flex items-center gap-2">
            <Input
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendTextMessage()}
              placeholder="Ali pišite sporočilo..."
              disabled={isProcessing || isRecording}
              className="flex-1"
            />
            <Button
              onClick={sendTextMessage}
              disabled={!textInput.trim() || isProcessing || isRecording}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Input({ value, onChange, onKeyDown, placeholder, disabled, className }: any) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    />
  );
}
