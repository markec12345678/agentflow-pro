# 📧 Unified Inbox - Implementation Plan

**Datum:** 2026-03-10  
**Status:** 🔄 IN PROGRESS  
**Cilj:** Vsa sporočila na enem mestu z AI avtomatizacijo

---

## 📊 Arhitektura

```
┌─────────────────────────────────────────────────────────────────┐
│  Unified Inbox                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Search]  [Filters]  [New Message]                            │
├──────────────┬──────────────────────────────────────────────────┤
│  Channels    │  Conversation List                               │
│  ☑ WhatsApp  │  ┌────────────────────────────────────┐         │
│  ☑ SMS       │  │ John Smith (Booking.com)           │         │
│  ☑ Email     │  │ "Kdaj je check-in?"                │         │
│  ☑ Booking   │  │ 10 min ago ● Unread                │         │
│  ☑ Airbnb    │  └────────────────────────────────────┘         │
│  ☑ Expedia   │  ┌────────────────────────────────────┐         │
│              │  │ Maria Garcia (Airbnb)              │         │
│              │  │ "Imate parking?"                   │         │
│              │  │ 1 hour ago ● AI replied            │         │
│              │  └────────────────────────────────────┘         │
├──────────────┴──────────────────────────────────────────────────┤
│  Message Thread                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Guest: "Kdaj je check-in?"                                 │ │
│  │                                                            │ │
│  │ [AI Suggestion: "Check-in je od 14:00. Veselimo..."]      │ │
│  │ [Send] [Edit] [Ignore]                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Features

### **1. Multi-Channel Support**

| Channel | Icon | Color | Status |
|---------|------|-------|--------|
| WhatsApp | 💬 | Green | ✅ |
| SMS | 📱 | Blue | ✅ |
| Email | 📧 | Red | ✅ |
| Booking.com | 🏨 | Blue | ✅ |
| Airbnb | 🏠 | Rose | ✅ |
| Expedia | ✈️ | Yellow | ✅ |
| Direct | 🌐 | Green | ✅ |

---

### **2. Conversation List**

**Display:**
- Guest name
- Channel badge
- Last message preview
- Timestamp
- Status (unread, read, AI replied)
- Priority indicator

**Sorting:**
- Unread first
- By timestamp
- By priority
- By channel

**Filtering:**
- By channel
- By status (unread/read)
- By property
- By date

---

### **3. Message Thread**

**Features:**
- Full conversation history
- Guest info sidebar
- Booking context
- AI suggestions
- Quick replies
- Templates
- Attachments

---

### **4. AI-Powered Responses**

**AI Suggestion Types:**

#### **A. Check-in/Check-out Questions**
```
Guest: "Kdaj je check-in?"

AI Suggestion:
"Pozdravljeni! Check-in je možen od 14:00 dalje, 
check-out pa do 10:00. Če potrebujete zgodnji 
check-in, nam sporočite vnaprej. Veselimo se 
vašega obiska! 🏨"

[Send] [Edit] [Ignore]
```

#### **B. Parking Questions**
```
Guest: "Imate parking?"

AI Suggestion:
"Da, imamo brezplačno parkirišče za goste. 
Na voljo je na lokaciji [naslov]. Priporočamo 
rezervacijo parkirnega mesta vnaprej. 🚗"

[Send] [Edit] [Ignore]
```

#### **C. WiFi Questions**
```
Guest: "Ali je WiFi na voljo?"

AI Suggestion:
"Seveda! Brezplačen WiFi je na voljo v vseh 
sobah in skupnih prostorih. Hitrost je do 
100 Mbps. WiFi ime: [SSID], Geslo: [PASSWORD] 📶"

[Send] [Edit] [Ignore]
```

#### **D. Breakfast Questions**
```
Guest: "Je zajtrk vključen?"

AI Suggestion:
"Zajtrk je na voljo od 7:00 do 10:00 v naši 
dvorani. [Vključen/Na voljo za €15]. Postrežemo 
sveže lokalne izdelke. 🥐☕"

[Send] [Edit] [Ignore]
```

---

### **5. Message Templates**

**Categories:**

#### **Pre-Arrival**
- Booking confirmation
- Check-in instructions
- Directions
- Parking info

#### **During Stay**
- Welcome message
- WiFi instructions
- Breakfast info
- Local recommendations

#### **Post-Departure**
- Thank you message
- Review request
- Come back offer

#### **Operational**
- Payment reminder
- Invoice
- Special request confirmation
- Maintenance notification

---

### **6. Automation Rules**

**Triggers:**
```
IF booking_created → Send booking confirmation
IF 24h_before_arrival → Send check-in instructions
IF 2h_after_checkin → Send welcome message
IF 1_day_before_departure → Send check-out reminder
IF 1_day_after_departure → Send thank you + review request
```

**Conditions:**
- Time-based
- Booking status-based
- Channel-based
- Property type-based

---

## 📁 Struktura Datotek

```
src/
├── app/
│   └── inbox/
│       ├── page.tsx (Main inbox)
│       └── [conversationId]/
│           └── page.tsx (Single conversation)
├── components/
│   └── inbox/
│       ├── UnifiedInbox.tsx
│       ├── ConversationList.tsx
│       ├── MessageThread.tsx
│       ├── AISuggestions.tsx
│       ├── MessageTemplates.tsx
│       ├── ChannelFilter.tsx
│       └── GuestSidebar.tsx
├── lib/
│   └── messaging/
│       ├── ai-responses.ts
│       ├── templates.ts
│       ├── triggers.ts
│       └── channels.ts
└── types/
    └── messaging.ts
```

---

## 🔧 Tehnična Implementacija

### **1. Data Model**

```typescript
interface Conversation {
  id: string;
  guestId: string;
  guestName: string;
  guestAvatar?: string;
  channel: ChannelType;
  propertyId: string;
  bookingId?: string;
  messages: Message[];
  unreadCount: number;
  lastMessageAt: string;
  status: 'unread' | 'read' | 'ai-replied';
  priority: 'high' | 'medium' | 'low';
}

interface Message {
  id: string;
  conversationId: string;
  sender: 'guest' | 'host' | 'ai' | 'system';
  content: string;
  type: 'text' | 'image' | 'file' | 'template';
  timestamp: string;
  read: boolean;
  aiGenerated?: boolean;
  templateId?: string;
}

type ChannelType = 
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'booking.com'
  | 'airbnb'
  | 'expedia'
  | 'direct';
```

---

### **2. AI Response Generator**

```typescript
async function generateAIResponse(
  message: string,
  context: MessageContext
): Promise<AIResponse> {
  // 1. Analyze message intent
  const intent = await analyzeIntent(message);
  
  // 2. Get relevant context
  const propertyInfo = await getPropertyInfo(context.propertyId);
  const bookingInfo = await getBookingInfo(context.bookingId);
  
  // 3. Generate response
  const response = await llm.generate({
    prompt: buildPrompt(intent, propertyInfo, bookingInfo),
    model: 'claude-sonnet-4.5',
    temperature: 0.7,
  });
  
  // 4. Add confidence score
  const confidence = calculateConfidence(response);
  
  return {
    text: response,
    confidence,
    suggestedTemplates: [],
    requiresHumanReview: confidence < 0.8,
  };
}
```

---

### **3. Automation Engine**

```typescript
class MessagingAutomation {
  async checkTriggers() {
    const bookings = await getTodayBookings();
    
    for (const booking of bookings) {
      // 24h before arrival
      if (this.is24hBeforeArrival(booking)) {
        await this.sendCheckInInstructions(booking);
      }
      
      // 2h after check-in
      if (this.is2hAfterCheckIn(booking)) {
        await this.sendWelcomeMessage(booking);
      }
      
      // 1 day before departure
      if (this.is1DayBeforeDeparture(booking)) {
        await this.sendCheckOutReminder(booking);
      }
    }
  }
  
  async sendCheckInInstructions(booking: Booking) {
    const template = await getTemplate('check-in-instructions');
    const message = template.render({ booking });
    await sendMessage(booking.guestId, message);
  }
}
```

---

## 📊 Metrike

| Metrika | Before | Cilj | Izboljšanje |
|---------|--------|------|-------------|
| Response time | 2h | 5min | -96% |
| AI automation | 0% | 93% | +93% |
| Guest satisfaction | 4.2⭐ | 4.8⭐ | +14% |
| Host time saved | 0h | 2h/day | +100% |

---

## 🚀 Implementation Timeline

| Phase | Task | Time | Status |
|-------|------|------|--------|
| **1** | Basic inbox UI | 2h | ⏳ |
| **2** | Conversation list | 1h | ⏳ |
| **3** | Message thread | 2h | ⏳ |
| **4** | AI responses | 3h | ⏳ |
| **5** | Templates | 1h | ⏳ |
| **6** | Automation | 2h | ⏳ |
| **7** | Testing | 1h | ⏳ |

**SKUPAJ:** 12 ur

---

**Ready to implement!** 🚀
