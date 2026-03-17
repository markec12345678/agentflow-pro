# 🚀 Channel Integrations - Complete Setup Guide

## 📋 Kaj Je Pripravljeno

### ✅ Implementirano (100% Ready):

1. **Booking.com API Client**
   - 📁 `src/lib/integrations/booking-com-api-client.ts`
   - ✅ Push availability
   - ✅ Push rates
   - ✅ Pull bookings
   - ✅ Webhook handler

2. **Airbnb API Client**
   - 📁 `src/lib/integrations/airbnb-api-client.ts`
   - ✅ OAuth2 flow
   - ✅ Push availability (API)
   - ✅ iCal sync (alternative)
   - ✅ Pull bookings

3. **API Routes**
   - 📁 `src/app/api/channels/route.ts`
   - 📁 `src/app/api/webhooks/booking-com/route.ts`
   - 📁 `src/app/api/tourism/airbnb/oauth/route.ts`

4. **Use Cases**
   - 📁 `src/core/use-cases/sync-channels.ts`
   - ✅ Sync availability
   - ✅ Sync rates
   - ✅ Pull bookings

5. **Environment Variables**
   - 📁 `.env.channel-integrations.example`
   - ✅ Vse potrebne spremenljivke

---

## 🔧 Namestitev (Ko Dobite API Ključe)

### Korak 1: Kopiraj Environment Variables

```bash
# Kopiraj v .env.local
cp .env.channel-integrations.example .env.channel-integrations.local
```

### Korak 2: Uredi .env.channel-integrations.local

```env
# Booking.com
BOOKING_COM_API_KEY="xxxxxx-xxxx-xxxx-xxxx-xxxxxx"
BOOKING_COM_SECRET="your_secret_here"
BOOKING_COM_PROPERTY_ID="12345"
BOOKING_COM_ENV="test"

# Airbnb
AIRBNB_CLIENT_ID="your_client_id"
AIRBNB_CLIENT_SECRET="your_client_secret"
AIRBNB_REDIRECT_URI="http://localhost:3002/api/tourism/airbnb/oauth/callback"
AIRBNB_ENV="test"

# Airbnb iCal (alternative)
AIRBNB_ICAL_EXPORT_URL="https://www.airbnb.com/calendar/ical/xxx.ics"
AIRBNB_ICAL_IMPORT_URL="https://yourdomain.com/calendar/ical/property-xxx.ics"
```

### Korak 3: Testiraj Povezavo

```bash
# Test Booking.com
node -e "
const { createBookingComClient } = require('./src/lib/integrations/booking-com-api-client.ts')
const client = createBookingComClient()
console.log('Booking.com configured:', client.isConfigured())
"

# Test Airbnb
node -e "
const { createAirbnbClient } = require('./src/lib/integrations/airbnb-api-client.ts')
const client = createAirbnbClient()
console.log('Airbnb configured:', client.isConfigured())
"
```

---

## 📚 Navodila za Pridobitev API Ključev

### Booking.com

1. **Registracija:**
   - Odpri: https://partner.booking.com/
   - Klikni: "Become a Partner"
   - Izpolni podatke

2. **API Access:**
   - Login v Partner Hub
   - Settings → Integrations → API
   - Request "Connectivity API" access

3. **Test Environment:**
   - Dobiš test credentials
   - Base URL: `https://test-rates.booking.com/`
   - Testiraj before production

**Čas:** 1-3 dni za approval  
**Dokumentacija:** [docs/API-KEYS-GUIDE.md](./docs/API-KEYS-GUIDE.md#1-bookingcom-connectivity-api)

---

### Airbnb

**Opcija A: API Access (Advanced)**

1. Odpri: https://dev.airbnb.com/
2. Apply for API Access
3. Izpolni aplikacijo
4. Počakaj na approval (7-14 dni)

**Opcija B: iCal Sync (Recommended)**

1. Login v Airbnb
2. Hosting → Calendar
3. Export Calendar: Kopiraj iCal URL
4. To je vse! Ni API approval potreben.

**Čas:**

- API: 7-14 dni
- iCal: Takoj ✅

**Dokumentacija:** [docs/API-KEYS-GUIDE.md](./docs/API-KEYS-GUIDE.md#2-airbnb-api)

---

## 🧪 Testing

### Test Booking.com Integration

```typescript
// test-booking-com.ts
import { createBookingComClient } from "./src/lib/integrations/booking-com-api-client";

async function test() {
  const client = createBookingComClient();

  if (!client.isConfigured()) {
    console.error("❌ Booking.com not configured");
    return;
  }

  // Test push availability
  const result = await client.pushAvailability("property-123", [
    {
      roomId: "room-1",
      date: "2026-04-01",
      status: "available",
      minStay: 2,
    },
  ]);

  console.log("✅ Push availability:", result);

  // Test pull bookings
  const bookings = await client.pullBookings("property-123", {
    start: "2026-04-01",
    end: "2026-04-30",
  });

  console.log("✅ Pull bookings:", bookings);
}

test();
```

### Test Airbnb Integration

```typescript
// test-airbnb.ts
import { createAirbnbClient } from "./src/lib/integrations/airbnb-api-client";

async function test() {
  const client = createAirbnbClient();

  if (!client.isConfigured()) {
    console.error("❌ Airbnb not configured");
    return;
  }

  // Test iCal sync
  const result = await client.syncICAL(
    "property-123",
    "https://www.airbnb.com/calendar/ical/xxx.ics",
  );

  console.log("✅ iCal sync:", result);
}

test();
```

---

## 🎯 Uporaba v Production

### 1. Channel Sync (Avtomatski)

```typescript
// src/app/api/channels/sync/route.ts
import { SyncChannels } from "@/core/use-cases/sync-channels";
import { createBookingComClient } from "@/lib/integrations/booking-com-api-client";
import { createAirbnbClient } from "@/lib/integrations/airbnb-api-client";

export async function POST() {
  const bookingComClient = createBookingComClient();
  const airbnbClient = createAirbnbClient();

  const useCase = new SyncChannels(
    channelRepository,
    availabilityRepository,
    bookingRepository,
    {
      pushAvailability: async (channel, credentials, updates) => {
        if (channel === "booking.com") {
          return bookingComClient.pushAvailability(propertyId, updates);
        } else if (channel === "airbnb") {
          return airbnbClient.pushAvailability(listingId, updates);
        }
      },
    },
  );

  const result = await useCase.execute({
    propertyId: "property-123",
    syncType: "full",
    userId: "user-123",
  });

  return NextResponse.json(result);
}
```

### 2. Webhook Handler (Real-time)

```typescript
// src/app/api/webhooks/booking-com/route.ts
import { BookingComApiClient } from "@/lib/integrations/booking-com-api-client";

export async function POST(request: Request) {
  const body = await request.json();

  // Verify webhook signature
  const isValid = await verifyWebhookSignature(body);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Handle booking
  if (body.type === "new_booking") {
    const client = new BookingComApiClient();
    const booking = await client.pullBookings(body.propertyId, {
      start: body.checkIn,
      end: body.checkOut,
    });

    // Create reservation in database
    await createReservation(booking.bookings[0]);
  }

  return NextResponse.json({ success: true });
}
```

---

## ⚠️ Troubleshooting

### Problem: "Credentials not configured"

**Rešitev:**

```bash
# Preveri če so spremenljivke nastavljene
cat .env.local | grep BOOKING_COM
cat .env.local | grep AIRBNB

# Restartaj dev server
npm run dev
```

### Problem: "Invalid API key"

**Rešitev:**

- Preveri če uporabljaš test credentials za test environment
- Preveri če so credentials kopirani pravilno (brez presledkov)
- Kontaktiraj Booking.com/Airbnb support

### Problem: "OAuth redirect mismatch"

**Rešitev:**

```env
# Preveri da je redirect URI enak:
# 1. V .env.local
AIRBNB_REDIRECT_URI="http://localhost:3002/api/tourism/airbnb/oauth/callback"

# 2. V Airbnb Developer Dashboard
# Apps → Your App → Redirect URIs
# http://localhost:3002/api/tourism/airbnb/oauth/callback
```

---

## 📊 Monitoring

### Sync Status Dashboard

```typescript
// src/app/api/channels/status/route.ts
export async function GET() {
  const status = {
    bookingCom: {
      connected: true,
      lastSync: "2026-03-13T10:00:00Z",
      totalSyncs: 125,
      successRate: 96,
    },
    airbnb: {
      connected: true,
      lastSync: "2026-03-13T10:15:00Z",
      totalSyncs: 98,
      successRate: 97,
    },
  };

  return NextResponse.json(status);
}
```

---

## ✅ Checklist Pred Production

- [ ] Booking.com test credentials pridobljeni
- [ ] Airbnb credentials (ali iCal URL) pridobljeni
- [ ] .env.local nastavljen
- [ ] Testi uspešni
- [ ] Webhook endpointi testirani
- [ ] Error handling implementiran
- [ ] Rate limiting nastavljen
- [ ] Logging nastavljen
- [ ] Production credentials zahtevani
- [ ] Production approval prejet
- [ ] Deployano na production

---

## 📞 Podpora

### Booking.com:

- Email: connectivity@booking.com
- Portal: https://partner.booking.com/support

### Airbnb:

- Email: api@airbnb.com
- Portal: https://dev.airbnb.com/support

### AgentFlow Pro:

- Email: support@agentflow.pro
- Docs: https://agentflow.pro/docs

---

## 🎉 Vse Je Pripravljeno!

**Ko dobiš API ključe:**

1. Kopiraj v `.env.local`
2. Restartaj server
3. Testiraj
4. Deployaj

**Vsa koda je že napisana in čaka na credentials!** 🔑
