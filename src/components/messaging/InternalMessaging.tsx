'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Input } from '@/web/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/web/components/ui/avatar';
import { Badge } from '@/web/components/ui/badge';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import {
  Send,
  Search,
  Users,
  MessageSquare,
  FileText,
  Image,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  online: boolean;
  role: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'file' | 'image';
  attachments?: Array<{ url: string; type: string; name: string }>;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
}

interface InternalMessagingProps {
  userId: string;
}

export default function InternalMessaging({ userId }: InternalMessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      // TODO: Implement actual API call
      // const res = await fetch('/api/tourism/messaging/conversations');
      // const data = await res.json();

      // Mock data
      setConversations([
        {
          id: '1',
          participant: {
            id: 'user1',
            name: 'Ana Novak',
            email: 'ana@example.com',
            avatar: '/avatars/ana.jpg',
            online: true,
            role: 'Housekeeping',
          },
          lastMessage: {
            id: 'm1',
            senderId: 'user1',
            content: 'Soba 205 je pripravljena',
            messageType: 'text',
            createdAt: new Date().toISOString(),
            read: false,
          },
          unreadCount: 2,
        },
        {
          id: '2',
          participant: {
            id: 'user2',
            name: 'Marko Zupan',
            email: 'marko@example.com',
            avatar: '/avatars/marko.jpg',
            online: false,
            role: 'Maintenance',
          },
          lastMessage: {
            id: 'm2',
            senderId: 'user2',
            content: 'Popravilo kopalnice končano',
            messageType: 'text',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            read: true,
          },
          unreadCount: 0,
        },
      ]);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // TODO: Implement actual API call
      // const res = await fetch(`/api/tourism/messaging/conversations/${conversationId}/messages`);
      // const data = await res.json();

      // Mock data
      setMessages([
        {
          id: 'm1',
          senderId: 'user1',
          content: 'Dober dan! Imam vprašanje.',
          messageType: 'text',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          read: true,
        },
        {
          id: 'm2',
          senderId: userId,
          content: 'Seveda, kako vam lahko pomagam?',
          messageType: 'text',
          createdAt: new Date(Date.now() - 7100000).toISOString(),
          read: true,
        },
        {
          id: 'm3',
          senderId: 'user1',
          content: 'Soba 205 je pripravljena za gosta',
          messageType: 'text',
          createdAt: new Date(Date.now() - 300000).toISOString(),
          read: false,
        },
      ]);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // TODO: Implement actual API call
      // await fetch('/api/tourism/messaging/messages', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     conversationId: selectedConversation,
      //     content: newMessage,
      //     messageType: 'text',
      //   }),
      // });

      const message: Message = {
        id: `new-${Date.now()}`,
        senderId: userId,
        content: newMessage,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        read: false,
      };

      setMessages([...messages, message]);
      setNewMessage('');

      // Update conversation last message
      setConversations(convs =>
        convs.map(conv =>
          conv.id === selectedConversation
            ? { ...conv, lastMessage: message }
            : conv
        )
      );

      toast.success('Sporočilo poslano');
    } catch (error) {
      toast.error('Napaka pri pošiljanju sporočila');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Danes';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Včeraj';
    } else {
      return date.toLocaleDateString('sl-SI');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedParticipant = conversations.find(
    c => c.id === selectedConversation
  )?.participant;

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-80 border-r flex flex-col">
          <CardHeader className="border-b p-4">
            <CardTitle className="text-lg">Sporočila</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Išči..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>

          <ScrollArea className="flex-1">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-b ${
                  selectedConversation === conv.id
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
              >
                <Avatar>
                  <AvatarImage src={conv.participant.avatar} />
                  <AvatarFallback>
                    {conv.participant.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">
                      {conv.participant.name}
                    </p>
                    {conv.participant.online && (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {conv.lastMessage?.content || 'Ni sporočil'}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedParticipant?.avatar} />
                    <AvatarFallback>
                      {selectedParticipant?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedParticipant?.name}</p>
                    <p className="text-xs text-gray-500">
                      {selectedParticipant?.role}
                      {selectedParticipant?.online && ' • Online'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message, i) => {
                    const isOwn = message.senderId === userId;
                    const showDate =
                      i === 0 ||
                      formatDate(messages[i - 1].createdAt) !==
                        formatDate(message.createdAt);

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            isOwn ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-blue-200' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Image className="w-4 h-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Napiši sporočilo..."
                    className="flex-1"
                  />
                  <Button size="icon" variant="ghost">
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Izberite pogovor za začetek komunikacije</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
