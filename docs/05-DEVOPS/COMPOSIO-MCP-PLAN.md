# Composio MCP Integracije - Načrt Izvedbe

## 🎯 Trenutno Stanje

Imaš že konfiguriranih **10 MCP strežnikov** v `opencode.json`:
- Gmail, Google Calendar, Notion, Google Sheets
- Supabase, Airtable, YouTube, Slack, Facebook
- Composio Core (300+ app integracij)

## 🚀 Predlogi za Implementacijo

### 1. AI Agenti z Composio Orodji

#### A) Content Creation Agent z Avtomatsko Objavo
```typescript
// src/agents/composio-content-agent.ts
import { ComposioToolSet } from '@composio/vercel';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export class ComposioContentAgent {
  private toolset: ComposioToolSet;

  constructor() {
    this.toolset = new ComposioToolSet({
      apiKey: process.env.COMPOSIO_API_KEY,
    });
  }

  async createAndPublishContent(topic: string) {
    // 1. Research trends
    const trends = await this.toolset.execute('google_trends_search', {
      query: topic,
      timeframe: 'now 7-d',
    });

    // 2. Generate content
    const { text: article } = await generateText({
      model: openai('gpt-4o'),
      prompt: `Write article about ${topic} based on trends: ${JSON.stringify(trends)}`,
    });

    // 3. Publish to Notion
    await this.toolset.execute('notion_create_page', {
      title: topic,
      content: article,
      parent_database_id: process.env.NOTION_DB_ID,
    });

    // 4. Share on social media
    await this.toolset.execute('facebook_create_post', {
      message: `New article: ${topic}`,
      link: articleUrl,
    });

    // 5. Send newsletter
    await this.toolset.execute('gmail_send_email', {
      to: 'subscribers@list.com',
      subject: `New: ${topic}`,
      body: article,
    });

    // 6. Track in Sheets
    await this.toolset.execute('google_sheets_append_row', {
      spreadsheet_id: process.env.SHEET_ID,
      range: 'Sheet1!A:D',
      values: [topic, new Date().toISOString(), 'published', articleUrl],
    });

    return { success: true, url: articleUrl };
  }
}
```

#### B) Smart Booking Agent
```typescript
// src/agents/booking-agent.ts
export class BookingAgent {
  async processReservation(reservation: Reservation) {
    // Check calendar availability
    const availability = await this.toolset.execute(
      'google_calendar_check_availability',
      {
        calendar_id: 'primary',
        start_time: reservation.checkIn,
        end_time: reservation.checkOut,
      }
    );

    if (!availability.available) {
      throw new Error('Property not available');
    }

    // Create calendar event
    await this.toolset.execute('google_calendar_create_event', {
      summary: `Booking: ${reservation.guestName}`,
      start: { dateTime: reservation.checkIn },
      end: { dateTime: reservation.checkOut },
      guests: reservation.guestEmail,
    });

    // Send confirmation email
    await this.toolset.execute('gmail_send_email', {
      to: reservation.guestEmail,
      subject: 'Booking Confirmation',
      html: this.generateConfirmationEmail(reservation),
    });

    // Add to CRM (Airtable)
    await this.toolset.execute('airtable_create_record', {
      base_id: process.env.AIRTABLE_BASE_ID,
      table_name: 'Guests',
      fields: {
        Name: reservation.guestName,
        Email: reservation.guestEmail,
        'Check-in': reservation.checkIn,
        'Check-out': reservation.checkOut,
      },
    });

    // Notify team on Slack
    await this.toolset.execute('slackbot_post_message', {
      channel: '#bookings',
      text: `New booking: ${reservation.guestName} (${reservation.checkIn} - ${reservation.checkOut})`,
    });

    return { success: true };
  }
}
```

#### C) Revenue Optimization Agent
```typescript
// src/agents/revenue-agent.ts
export class RevenueAgent {
  async dailyOptimization() {
    // Get current occupancy
    const occupancy = await prisma.reservation.groupBy({
      by: ['date'],
      _count: true,
    });

    // Get competitor prices
    const competitorPrices = await this.toolset.execute(
      'web_search',
      {
        query: 'hotel prices Ljubljana next month',
        num_results: 10,
      }
    );

    // Calculate optimal prices
    const newPrices = this.calculateOptimalPrices(occupancy, competitorPrices);

    // Update pricing in system
    await prisma.property.updateMany({
      data: { basePrice: newPrices.average },
    });

    // Generate report in Sheets
    await this.toolset.execute('google_sheets_update_cells', {
      spreadsheet_id: process.env.REVENUE_SHEET_ID,
      range: 'Sheet1!A2',
      values: [
        [new Date().toISOString(), occupancy._count, newPrices.average, 'optimized'],
      ],
    });

    // Send report to owner
    await this.toolset.execute('gmail_send_email', {
      to: 'owner@property.com',
      subject: 'Daily Revenue Optimization Report',
      html: this.generateReport(occupancy, newPrices),
    });

    return { success: true, newPrices };
  }
}
```

### 2. API Endpoints za Composio Akcije

```typescript
// src/app/api/composio/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ComposioToolSet } from '@composio/vercel';

export async function POST(request: NextRequest) {
  const { action, params } = await request.json();

  const toolset = new ComposioToolSet({
    apiKey: process.env.COMPOSIO_API_KEY,
  });

  try {
    const result = await toolset.execute(action, params);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### 3. UI za Upravljanje Integracij

```typescript
// src/components/composio/IntegrationManager.tsx
export function IntegrationManager() {
  const [integrations, setIntegrations] = useState([]);

  // List all available Composio apps
  useEffect(() => {
    const toolset = new ComposioToolSet();
    toolset.getApps().then(setIntegrations);
  }, []);

  const connectApp = async (appId: string) => {
    const toolset = new ComposioToolSet();
    const connection = await toolset.initiateConnection({ appId });
    // Redirect user to authorization URL
    window.open(connection.redirectUrl, '_blank');
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {integrations.map(app => (
        <Card key={app.id}>
          <img src={app.logo} alt={app.name} />
          <h3>{app.name}</h3>
          <Button onClick={() => connectApp(app.id)}>
            Connect
          </Button>
        </Card>
      ))}
    </div>
  );
}
```

## 📋 Implementacijski Koraki

### Faza 1: Osnovna Integracija (2-3 ure)
- [ ] Nastavi Composio API key v .env
- [ ] Ustvari `/api/composio/execute` endpoint
- [ ] Testiraj osnovne akcije (Gmail, Sheets)

### Faza 2: AI Agenti (4-6 ur)
- [ ] Content Agent z avtomatsko objavo
- [ ] Booking Agent z calendar/email integracijo
- [ ] Revenue Agent z optimizacijo cen

### Faza 3: UI Dashboard (3-4 ure)
- [ ] Integration Manager komponenta
- [ ] Status prikaz povezav
- [ ] Log akcij

### Faza 4: Napredne Funkcije (8-10 ur)
- [ ] Workflow builder z Composio akcijami
- [ ] Scheduled tasks (npr. dnevni reports)
- [ ] Multi-step avtomatizacije

## 🔐 Varnostne Nastavitve

```env
# .env.local
COMPOSIO_API_KEY=your_api_key_here
COMPOSIO_ENTITY_ID=default_entity

# Omeji dostopne akcije
COMPOSIO_ALLOWED_APPS=gmail,calendar,notion,sheets,slack
COMPOSIO_RESTRICTED_ACTIONS=delete,permanent_remove
```

## 📊 Uporaba v Praksi

### Primer 1: Avtomatski Guest Journey
```
1. Guest books → Calendar event created
2. 3 days before → Email with instructions
3. Check-in day → Slack notification to team
4. During stay → YouTube video of local tips
5. Check-out → Email with invoice
6. Post-stay → Request review on Facebook
7. Analytics → Update Sheets with feedback
```

### Primer 2: Content Marketing Automation
```
1. Research trends → Google Trends + Search
2. Generate article → LLM
3. Publish → Notion/WordPress
4. Share → Facebook, LinkedIn, Twitter
5. Track → Sheets analytics
6. Newsletter → Gmail to subscribers
7. Follow-up → Slack if engagement high
```

## 🎯 Next Steps

1. **Takoj** (15 min):
   - Preveri Composio API key v dashboardu
   - Testiraj enostavno akcijo z MCP

2. **Danes** (2 uri):
   - Ustvari `/api/composio/execute` endpoint
   - Implementiraj Gmail send test

3. **Ta teden**:
   - Dodaj Content Agent
   - Poveži z existing workflows

## 📚 Dokumentacija

- [Composio Docs](https://docs.composio.dev/)
- [Composio Vercel SDK](https://github.com/ComposioHQ/composio-js)
- [Available Apps](https://app.composio.dev/apps)
- [MCP Protocol](https://modelcontextprotocol.io/)

## 💡 Ideje za Razširitve

1. **Voice Assistant** - Slack + Gmail za voice commands
2. **Auto Reporting** - Daily/Weekly reports v Sheets + Email
3. **Social Media Manager** - Multi-platform posting
4. **CRM Automation** - Lead tracking v Airtable
5. **Knowledge Base** - Auto-documentation v Notion
6. **Video Marketing** - Auto-upload to YouTube
7. **Team Collaboration** - Slack notifications za vse akcije

---

**TL;DR:** Imaš orožje za 300+ integracij! Lahko ustvariš avtonomne agente ki dejansko **delajo stvari** v realnem svetu. Začni z Gmail/Calendar, nato razširi na ostale.
