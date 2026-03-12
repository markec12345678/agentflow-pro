"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChannelType = 'whatsapp' | 'sms' | 'email' | 'booking.com' | 'airbnb' | 'expedia' | 'direct';
type MessageStatus = 'unread' | 'read' | 'ai-replied';
type Priority = 'high' | 'medium' | 'low';

interface Message {
  id: string;
  sender: 'guest' | 'host' | 'ai' | 'system';
  content: string;
  timestamp: string;
  aiGenerated?: boolean;
}

interface Conversation {
  id: string;
  guestName: string;
  guestAvatar?: string;
  channel: ChannelType;
  property: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: MessageStatus;
  priority: Priority;
  bookingId?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    guestName: "John Smith",
    channel: "booking.com",
    property: "Room 201",
    lastMessage: "Kdaj je check-in?",
    lastMessageAt: "10 min ago",
    unreadCount: 1,
    status: "unread",
    priority: "high",
    bookingId: "BK123456",
  },
  {
    id: "2",
    guestName: "Maria Garcia",
    channel: "airbnb",
    property: "Suite 5",
    lastMessage: "Imate parking?",
    lastMessageAt: "1 hour ago",
    unreadCount: 0,
    status: "ai-replied",
    priority: "medium",
    bookingId: "BK123457",
  },
  {
    id: "3",
    guestName: "Thomas Mueller",
    channel: "direct",
    property: "Room 105",
    lastMessage: "Hvala za vse!",
    lastMessageAt: "2 hours ago",
    unreadCount: 0,
    status: "read",
    priority: "low",
    bookingId: "BK123458",
  },
  {
    id: "4",
    guestName: "Anna Novak",
    channel: "expedia",
    property: "Room 302",
    lastMessage: "Ali je WiFi na voljo?",
    lastMessageAt: "3 hours ago",
    unreadCount: 0,
    status: "ai-replied",
    priority: "medium",
    bookingId: "BK123459",
  },
  {
    id: "5",
    guestName: "Pierre Dubois",
    channel: "whatsapp",
    property: "Room 201",
    lastMessage: "Lahko dobim pozni check-out?",
    lastMessageAt: "5 hours ago",
    unreadCount: 0,
    status: "read",
    priority: "low",
    bookingId: "BK123460",
  },
];

const MESSAGES: Message[] = [
  { id: "1", sender: "guest", content: "Pozdravljeni! Imam vprašanje.", timestamp: "10:00" },
  { id: "2", sender: "host", content: "Pozdravljeni! Z veseljem vam pomagam. Kaj vas zanima?", timestamp: "10:05" },
  { id: "3", sender: "guest", content: "Kdaj je check-in?", timestamp: "10:10" },
];

const AI_SUGGESTION = `Pozdravljeni! Check-in je možen od 14:00 dalje, check-out pa do 10:00. 

Če potrebujete zgodnji check-in ali pozni check-out, nam sporočite vnaprej in preverili bomo razpoložljivost.

Veselimo se vašega obiska! 🏨`;

// ─── Helper Components ────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: ChannelType }) {
  const colors = {
    'whatsapp': 'bg-green-100 text-green-700',
    'sms': 'bg-blue-100 text-blue-700',
    'email': 'bg-red-100 text-red-700',
    'booking.com': 'bg-blue-100 text-blue-700',
    'airbnb': 'bg-rose-100 text-rose-700',
    'expedia': 'bg-yellow-100 text-yellow-700',
    'direct': 'bg-green-100 text-green-700',
  };

  const icons = {
    'whatsapp': '💬',
    'sms': '📱',
    'email': '📧',
    'booking.com': '🏨',
    'airbnb': '🏠',
    'expedia': '✈️',
    'direct': '🌐',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors[channel]}`}>
      <span>{icons[channel]}</span>
      <span className="hidden sm:inline">{channel}</span>
    </span>
  );
}

function PriorityIndicator({ priority }: { priority: Priority }) {
  const colors = {
    'high': 'bg-red-500',
    'medium': 'bg-yellow-500',
    'low': 'bg-blue-500',
  };

  return (
    <div className={`w-2 h-2 rounded-full ${colors[priority]}`} title={`${priority} priority`} />
  );
}

function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick 
}: { 
  conversation: Conversation; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-blue-50 border-l-4 border-l-blue-600' 
          : 'hover:bg-gray-50 border-l-4 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <PriorityIndicator priority={conversation.priority} />
          <h3 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
            {conversation.guestName}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <ChannelBadge channel={conversation.channel} />
          <span className="text-xs text-gray-500">{conversation.lastMessageAt}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <p className={`text-sm truncate ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
          {conversation.lastMessage}
        </p>
        {conversation.unreadCount > 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {conversation.unreadCount}
          </span>
        )}
        {conversation.status === 'ai-replied' && (
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
            🤖 AI replied
          </span>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500">
        {conversation.property} {conversation.bookingId && `• ${conversation.bookingId}`}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isGuest = message.sender === 'guest';
  const isAI = message.sender === 'ai';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isGuest ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isGuest
            ? 'bg-white border border-gray-200 text-gray-900'
            : isAI
            ? 'bg-green-50 border border-green-200 text-green-900'
            : 'bg-blue-600 text-white'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <div className={`text-xs mt-2 ${isGuest ? 'text-gray-500' : isAI ? 'text-green-600' : 'text-blue-200'}`}>
          {message.timestamp} {isAI && '• 🤖 AI Generated'}
        </div>
      </div>
    </div>
  );
}

function AISuggestionCard({ 
  suggestion, 
  onSend, 
  onEdit, 
  onIgnore 
}: { 
  suggestion: string; 
  onSend: () => void; 
  onEdit: () => void; 
  onIgnore: () => void;
}) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🤖</span>
        <div>
          <h4 className="font-semibold text-green-900">AI Suggestion</h4>
          <p className="text-xs text-green-700">95% confidence</p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 mb-3 border border-green-200">
        <p className="text-sm text-gray-900 whitespace-pre-wrap">{suggestion}</p>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={onSend}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ✓ Send
        </button>
        <button
          onClick={onEdit}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ✏️ Edit
        </button>
        <button
          onClick={onIgnore}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ✕ Ignore
        </button>
      </div>
    </div>
  );
}

// ─── Main Inbox Component ─────────────────────────────────────────────────────

export default function InboxPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>("1");
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai-replied'>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showAISuggestion, setShowAISuggestion] = useState(true);

  const filteredConversations = CONVERSATIONS.filter(conv => {
    if (filter === 'unread' && conv.unreadCount === 0) return false;
    if (filter === 'ai-replied' && conv.status !== 'ai-replied') return false;
    if (channelFilter !== 'all' && conv.channel !== channelFilter) return false;
    if (searchQuery && !conv.guestName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // TODO: Send message logic
    setMessageInput('');
  };

  const handleSendAISuggestion = () => {
    // TODO: Send AI suggestion
    setShowAISuggestion(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📧 Unified Inbox</h1>
            <p className="text-sm text-gray-500 mt-1">
              All guest messages in one place • {CONVERSATIONS.length} conversations
            </p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            ➕ New Message
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar - Filters */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="mb-6">
            <input
              type="text"
              placeholder="🔍 Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Filters</h3>
            <button
              onClick={() => setFilter('all')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              📋 All Conversations
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔴 Unread
            </button>
            <button
              onClick={() => setFilter('ai-replied')}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                filter === 'ai-replied'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              🤖 AI Replied
            </button>
          </div>

          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Channels</h3>
            {(['all', 'whatsapp', 'sms', 'email', 'booking.com', 'airbnb', 'expedia', 'direct'] as const).map((channel) => (
              <button
                key={channel}
                onClick={() => setChannelFilter(channel)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  channelFilter === channel
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {channel === 'all' ? '📋 All Channels' : <ChannelBadge channel={channel} />}
              </button>
            ))}
          </div>
        </div>

        {/* Middle - Conversation List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Conversations</h2>
            <p className="text-xs text-gray-500 mt-1">
              {filteredConversations.length} conversations
            </p>
          </div>
          {filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={selectedConversation === conv.id}
              onClick={() => setSelectedConversation(conv.id)}
            />
          ))}
        </div>

        {/* Right - Message Thread */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {CONVERSATIONS.find(c => c.id === selectedConversation)?.guestName}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <ChannelBadge channel={CONVERSATIONS.find(c => c.id === selectedConversation)?.channel || 'direct'} />
                      <span className="text-sm text-gray-500">
                        {CONVERSATIONS.find(c => c.id === selectedConversation)?.property}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/bookings/${CONVERSATIONS.find(c => c.id === selectedConversation)?.bookingId}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Booking →
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {showAISuggestion && (
                  <AISuggestionCard
                    suggestion={AI_SUGGESTION}
                    onSend={handleSendAISuggestion}
                    onEdit={() => {}}
                    onIgnore={() => setShowAISuggestion(false)}
                  />
                )}

                {MESSAGES.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>

              {/* Message Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    Send 📤
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <button className="text-gray-500 hover:text-gray-700 text-xs">
                    📎 Attach file
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 text-xs">
                    📝 Use template
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 text-xs">
                    🤖 Generate with AI
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
