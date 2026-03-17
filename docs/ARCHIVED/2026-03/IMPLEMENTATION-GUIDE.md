# 🚀 Implementation Guide - New Features

## Overview

This document provides implementation guidance for 8 new features added to AgentFlow Pro. Each feature includes:
- Database schema (✅ Completed)
- API routes (skeleton provided)
- UI components (skeleton provided)
- Implementation priorities

---

## ✅ Completed: Database Schema

All new models have been added to `prisma/schema.prisma` and Prisma client has been generated.

### New Models Added:
1. **Messaging**: `Message`, `MessageGroup`, `MessageGroupMember`
2. **Owner Portal**: `Owner`, `RevenueSplit`, `OwnerPayout`
3. **Shift Scheduling**: `StaffSchedule`, `ShiftSwapRequest`
4. **Sustainability**: `SustainabilityMetric`, `EcoPractice`, `GuestPreference`

---

## 1. Internal Messaging System 🟢 HIGH PRIORITY

### API Routes

#### `GET /api/messages` - Get user's messages
```typescript
// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all"; // all, direct, group

  let where = {};

  if (type === "direct") {
    where = {
      OR: [
        { senderId: session.user.id },
        { recipientId: session.user.id }
      ]
    };
  } else if (type === "group") {
    const memberships = await prisma.messageGroupMember.findMany({
      where: { userId: session.user.id },
      select: { groupId: true }
    });
    where = { groupId: { in: memberships.map(m => m.groupId) } };
  }

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true, image: true } },
      recipient: { select: { id: true, name: true, image: true } },
      group: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({ messages });
}
```

#### `POST /api/messages` - Send message
```typescript
// src/app/api/messages/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, recipientId, groupId, attachments } = body;

  if (!content && !attachments) {
    return NextResponse.json(
      { error: "Content or attachments required" },
      { status: 400 }
    );
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      recipientId,
      groupId,
      content,
      attachments,
      messageType: groupId ? "group" : "direct"
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      recipient: { select: { id: true, name: true, image: true } }
    }
  });

  // TODO: Send WebSocket notification to recipient

  return NextResponse.json({ message }, { status: 201 });
}
```

#### `PUT /api/messages/[id]/read` - Mark message as read
```typescript
// src/app/api/messages/[id]/read/route.ts
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const message = await prisma.message.update({
    where: { id: params.id },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });

  return NextResponse.json({ message });
}
```

### UI Component

#### `src/components/messaging/MessageInbox.tsx`
```typescript
"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface Message {
  id: string;
  content: string;
  messageType: "direct" | "group";
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; image?: string };
  recipient?: { id: string; name: string };
}

export default function MessageInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const loadMessages = async () => {
    const res = await fetch("/api/messages?type=direct");
    const data = await res.json();
    setMessages(data.messages);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newMessage,
        recipientId: "recipient-id" // TODO: Get from selected conversation
      })
    });

    setNewMessage("");
    loadMessages();
  };

  const markAsRead = async (messageId: string) => {
    await fetch(`/api/messages/${messageId}/read`, {
      method: "PUT"
    });
    loadMessages();
  };

  return (
    <div className="flex h-[600px] border border-gray-300 dark:border-gray-700 rounded-lg">
      {/* Message List */}
      <div className="w-1/3 border-r border-gray-300 dark:border-gray-700 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => {
              setSelectedMessage(msg.id);
              markAsRead(msg.id);
            }}
            className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
              !msg.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm">
                {msg.sender.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {msg.content}
            </p>
          </div>
        ))}
      </div>

      {/* Message Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
          {selectedMessage ? (
            <div className="space-y-4">
              {/* Messages */}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Izberite sporočilo
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-300 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Napišite sporočilo..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Pošlji
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 2. Revenue Distribution 🟡 MEDIUM PRIORITY

### API Routes Skeleton

#### `POST /api/revenue-splits/calculate` - Calculate revenue split for reservation
```typescript
// src/app/api/revenue-splits/calculate/route.ts
export async function POST(request: NextRequest) {
  const { reservationId, ownerId, propertyId } = await request.json();

  // Get reservation details
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      property: true,
      payments: true
    }
  });

  // Get owner revenue share
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId }
  });

  // Calculate split
  const grossAmount = reservation.totalPrice;
  const platformFee = grossAmount * 0.15; // 15% platform fee
  const netAmount = grossAmount - platformFee;
  const ownerShare = netAmount * owner.revenueShare;
  const managementFee = netAmount * (1 - owner.revenueShare);
  const finalPayout = ownerShare;

  // Create revenue split record
  const split = await prisma.revenueSplit.create({
    data: {
      ownerId,
      propertyId,
      reservationId,
      grossAmount,
      platformFee,
      netAmount,
      ownerShare,
      managementFee,
      finalPayout,
      status: "pending"
    }
  });

  return NextResponse.json({ split });
}
```

---

## 3. Owner Portal 🟡 MEDIUM PRIORITY

### UI Component Skeleton

#### `src/app/owner/dashboard/page.tsx`
```typescript
"use client";

export default function OwnerDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard</h1>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold">€0.00</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Pending Payout
          </h3>
          <p className="text-3xl font-bold">€0.00</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Next Payout Date
          </h3>
          <p className="text-3xl font-bold">-</p>
        </div>
      </div>

      {/* Property List */}
      {/* Revenue Splits Table */}
      {/* Payout History */}
    </div>
  );
}
```

---

## 4. Shift Scheduling 🟡 MEDIUM PRIORITY

### API Routes Skeleton

#### `GET /api/shifts` - Get staff schedules
```typescript
// src/app/api/shifts/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const employeeId = searchParams.get("employeeId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const schedules = await prisma.staffSchedule.findMany({
    where: {
      propertyId: propertyId || undefined,
      employeeId: employeeId || undefined,
      shiftDate: {
        gte: startDate ? new Date(startDate) : new Date(),
        lte: endDate ? new Date(endDate) : undefined
      }
    },
    include: {
      employee: true,
      swapRequests: true
    }
  });

  return NextResponse.json({ schedules });
}
```

---

## 5. Carbon Footprint Calculator 🟡 MEDIUM PRIORITY

### API Routes Skeleton

#### `POST /api/sustainability/metrics` - Log sustainability metrics
```typescript
// src/app/api/sustainability/metrics/route.ts
export async function POST(request: NextRequest) {
  const { propertyId, date, energyKwh, waterM3, wasteKg, recyclingKg } = await request.json();

  // Calculate carbon footprint (simplified)
  // CO2 factors (kg CO2 per unit):
  // - Electricity: 0.233 kg CO2/kWh (EU average)
  // - Water: 0.344 kg CO2/m3
  // - Waste: 0.5 kg CO2/kg (landfill)
  const carbonKg = (
    energyKwh * 0.233 +
    waterM3 * 0.344 +
    wasteKg * 0.5 -
    recyclingKg * 0.3 // Recycling reduces carbon
  );

  const metric = await prisma.sustainabilityMetric.create({
    data: {
      propertyId,
      date: new Date(date),
      energyKwh,
      waterM3,
      wasteKg,
      recyclingKg,
      carbonKg,
      source: "manual"
    }
  });

  return NextResponse.json({ metric });
}
```

---

## 6. Guest Sustainability Preferences 🟢 LOW PRIORITY

### UI Component Skeleton

#### `src/components/sustainability/GuestPreferenceForm.tsx`
```typescript
export default function GuestPreferenceForm({ bookingId }: { bookingId: string }) {
  const [preferences, setPreferences] = useState({
    noTowelWash: false,
    noRoomCleaning: false,
    vegetarianMeals: false,
    localProducts: false,
    carbonOffset: false
  });

  const savePreferences = async () => {
    await fetch("/api/guest-preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        preferences: [
          { key: "no_towel_wash", value: preferences.noTowelWash.toString() },
          { key: "no_room_cleaning", value: preferences.noRoomCleaning.toString() },
          // ...
        ]
      })
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Sustainability Preferences</h3>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={preferences.noTowelWash}
          onChange={(e) => setPreferences({ ...preferences, noTowelWash: e.target.checked })}
        />
        No daily towel wash
      </label>
      {/* More options */}
    </div>
  );
}
```

---

## 7. TripAdvisor Real Integration 🟡 MEDIUM PRIORITY

### Implementation Steps

1. **Get API Credentials**
   - Apply for TripAdvisor Partner API access
   - Requires business verification

2. **Replace Mock Implementation**
   - Update `src/lib/unified-booking.ts` TripAdvisorAPI class
   - Add real API calls with OAuth

3. **Add Review Sync**
   - Cron job to fetch new reviews daily
   - Store in database

---

## 8. Enhanced Chatbot 🟡 MEDIUM PRIORITY

### Implementation Steps

1. **Add Context Retention**
   - Store conversation history in `ConversationThread`
   - Use AI to maintain context across messages

2. **Improve NLP**
   - Integrate with existing AI agents
   - Add intent classification model

3. **Add Escalation Flow**
   - Auto-escalate to human when confidence < threshold
   - Create `ChatEscalation` record

---

## Next Steps

### Immediate (This Week)
1. ✅ Database schema - **DONE**
2. Implement Internal Messaging API - **IN PROGRESS**
3. Create basic MessageInbox UI - **IN PROGRESS**

### Short-term (Next 2 Weeks)
4. Implement Revenue Distribution
5. Create Owner Portal dashboard
6. Add Shift Scheduling UI

### Medium-term (Next Month)
7. Carbon Footprint Calculator
8. Enhanced Chatbot with context
9. TripAdvisor real integration

---

## Testing

Run tests for new features:
```bash
# Once tests are created
npm run test -- tests/api/messages.test.ts
npm run test -- tests/api/revenue-splits.test.ts
npm run test -- tests/api/shifts.test.ts
npm run test -- tests/api/sustainability.test.ts
```

---

**Version:** 1.0.0  
**Last Updated:** 2026-03-11  
**Status:** Database schema complete, API routes & UI in progress
