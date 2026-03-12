/**
 * Internal Messaging Component
 * Complete messaging interface for staff communication
 */

"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { sl } from "date-fns/locale";
import {
  Send,
  Users,
  MessageSquare,
  Plus,
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Check,
  CheckCheck
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Message {
  id: string;
  content: string;
  messageType: "direct" | "group";
  isRead: boolean;
  createdAt: string;
  sender: User;
  recipient?: User;
  group?: {
    id: string;
    name: string;
  };
}

interface MessageGroup {
  id: string;
  name: string;
  description?: string;
  members: Array<{
    user: User;
    role: string;
  }>;
}

export default function MessagingSystem() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [messageType, setMessageType] = useState<"all" | "direct" | "group">("all");

  // Load messages and groups
  useEffect(() => {
    loadData();
  }, [messageType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [messagesRes, groupsRes] = await Promise.all([
        fetch(`/api/messages?type=${messageType}`),
        fetch("/api/message-groups")
      ]);

      const messagesData = await messagesRes.json();
      const groupsData = await groupsRes.json();

      setMessages(messagesData.messages || []);
      setGroups(groupsData.groups || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          recipientId: selectedConversation // For direct messages
          // groupId would be used for group messages
        })
      });

      if (res.ok) {
        setNewMessage("");
        loadData();
      }
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}/read`, {
        method: "PUT"
      });
      loadData();
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const res = await fetch("/api/message-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName
        })
      });

      if (res.ok) {
        setNewGroupName("");
        setShowNewGroupModal(false);
        loadData();
      }
    } catch (error) {
      console.error("Create group error:", error);
    }
  };

  const getConversationName = (message: Message) => {
    if (message.messageType === "group") {
      return message.group?.name || "Group";
    }
    // For direct messages, show the other person's name
    const isSender = message.sender.id === "current-user-id"; // TODO: Get from session
    return isSender ? message.recipient?.name || "Unknown" : message.sender.name;
  };

  const getLastMessage = (conversationId: string) => {
    return messages
      .filter(m => {
        if (m.messageType === "group") {
          return m.group?.id === conversationId;
        }
        return m.sender.id === conversationId || m.recipient?.id === conversationId;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Nalaganje sporočil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[700px] flex border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-gray-300 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-300 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Sporočila
            </h2>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="Nova skupina"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Išči..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setMessageType("all")}
              className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                messageType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Vsa
            </button>
            <button
              onClick={() => setMessageType("direct")}
              className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                messageType === "direct"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Direktne
            </button>
            <button
              onClick={() => setMessageType("group")}
              className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                messageType === "group"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Skupine
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              Ni sporočil
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedConversation(
                    msg.messageType === "group" ? msg.group?.id || "" : msg.sender.id
                  );
                  markAsRead(msg.id);
                }}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  !msg.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                    {msg.sender.image ? (
                      <img
                        src={msg.sender.image}
                        alt={msg.sender.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                        {msg.sender.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm truncate">
                        {getConversationName(msg)}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(msg.createdAt), {
                          addSuffix: true,
                          locale: sl
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {msg.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Message Header */}
            <div className="p-4 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold">
                {selectedConversation /* TODO: Show conversation name */}
              </h3>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages
                .filter(m => {
                  if (m.messageType === "group") {
                    return m.group?.id === selectedConversation;
                  }
                  return m.sender.id === selectedConversation || m.recipient?.id === selectedConversation;
                })
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.sender.id === "current-user-id" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold">
                        {msg.sender.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        msg.sender.id === "current-user-id"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <span className="text-xs opacity-75">
                          {formatDistanceToNow(new Date(msg.createdAt), {
                            addSuffix: true,
                            locale: sl
                          })}
                        </span>
                        {msg.sender.id === "current-user-id" && (
                          <span className="text-xs">
                            {msg.isRead ? (
                              <CheckCheck className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-300 dark:border-gray-700">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Napišite sporočilo..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Pošlji
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Izberite pogovor za ogled sporočil</p>
            </div>
          </div>
        )}
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Ustvari Novo Skupino</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Ime skupine"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={createGroup}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ustvari
              </button>
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Prekliči
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
