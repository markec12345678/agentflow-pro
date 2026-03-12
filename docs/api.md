# AgentFlow Pro - Tourism API Documentation

**Version:** 1.0.0  
**Base URL:** `/api/tourism`  
**Last Updated:** 2026-03-10

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Properties](#properties)
- [Reservations](#reservations)
- [Guests](#guests)
- [FAQ Chatbot](#faq-chatbot)
- [Revenue Analytics](#revenue-analytics)
- [Housekeeping](#housekeeping)
- [Channel Manager](#channel-manager)
- [Payments](#payments)
- [Invoices](#invoices)

---

## Authentication

Most endpoints require authentication via NextAuth session cookies.

**Headers:**
```
Cookie: next-auth.session-token=<token>
```

**Response Codes:**
- `401` - Authentication required
- `403` - Forbidden (insufficient permissions)

---

## Rate Limiting

- **Anonymous:** 60 requests/minute per IP
- **Authenticated:** 1000 requests/minute per user

**Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
Retry-After: 30
```

**Response:** `429 Too Many Requests`

---

## Properties

### GET `/properties`

List all properties for authenticated user.

**Response:**
```json
{
  "properties": [
    {
      "id": "prop-123",
      "name": "Hotel Slovenija",
      "location": "Bled, Slovenia",
      "type": "hotel",
      "basePrice": 120,
      "currency": "EUR"
    }
  ]
}
```

---

## Reservations

### GET `/reservations`

List reservations with optional filters.

**Query Parameters:**
- `propertyId` (string, optional)
- `status` (string, optional): `confirmed`, `cancelled`, `pending`, `checked_in`, `checked_out`
- `checkIn` (date, optional)

**Response:**
```json
{
  "reservations": [
    {
      "id": "res-456",
      "propertyId": "prop-123",
      "guestId": "guest-789",
      "roomId": "room-001",
      "checkIn": "2024-04-01T15:00:00Z",
      "checkOut": "2024-04-05T11:00:00Z",
      "status": "confirmed",
      "totalPrice": 480,
      "channel": "direct"
    }
  ]
}
```

### POST `/reservations`

Create new reservation.

**Request Body:**
```json
{
  "propertyId": "prop-123",
  "roomId": "room-001",
  "checkIn": "2024-04-01",
  "checkOut": "2024-04-05",
  "guests": 2,
  "guestName": "John Doe",
  "guestEmail": "john@example.com"
}
```

**Response:** `201 Created`
```json
{
  "id": "res-456",
  "status": "confirmed",
  "totalPrice": 480
}
```

---

## Guests

### GET `/guests/:id`

Get guest details.

**Response:**
```json
{
  "id": "guest-789",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+38640123456",
  "countryCode": "SI",
  "isVip": false,
  "gdprConsent": true,
  "preferences": "Non-smoking room"
}
```

### POST `/guest-communication`

Send automated guest communication.

**Request Body:**
```json
{
  "propertyId": "prop-123",
  "guestId": "guest-789",
  "type": "pre-arrival",
  "channel": "email",
  "language": "en"
}
```

---

## FAQ Chatbot

### GET `/faq`

Get FAQ list.

**Query Parameters:**
- `category` (string, optional): Filter by category
- `format` (string, optional): `json` or `jsonld`

**Response:**
```json
{
  "faqs": [
    {
      "question": "What is check-in time?",
      "answer": "Check-in is from 15:00.",
      "category": "General",
      "keywords": ["check-in", "time", "arrival"]
    }
  ],
  "categories": ["General", "Booking", "Services"]
}
```

### POST `/faq` ⭐ **CACHED**

Ask FAQ chatbot question.

**Caching:** High-confidence answers (≥0.8) are cached for 5 minutes.

**Request Body:**
```json
{
  "question": "What time is check-in?",
  "propertyId": "prop-123",
  "guestId": "guest-789",
  "useMultiAgent": false
}
```

**Response:**
```json
{
  "answer": "Check-in is from 15:00. Early check-in may be available upon request.",
  "confidence": 0.95,
  "sources": ["property-policy", "faq-db"],
  "faqLogId": "log-123",
  "escalated": false
}
```

**Performance:**
- **Cache Hit:** 50-100ms
- **Cache Miss:** 2-5s (AI generation)
- **Hit Rate:** ~80% for common questions

---

## Revenue Analytics

### GET `/revenue/analytics`

Get revenue metrics.

**Query Parameters:**
- `propertyId` (string, required)
- `startDate` (date, required)
- `endDate` (date, required)

**Response:**
```json
{
  "revenue": {
    "totalRevenue": 15420.50,
    "totalNights": 145,
    "occupiedRoomNights": 132
  },
  "kpis": {
    "occupancyRate": 91.03,
    "adr": 116.82,
    "revpar": 106.35
  },
  "revenueByChannel": {
    "direct": { "revenue": 8500, "bookings": 45 },
    "booking.com": { "revenue": 5200, "bookings": 28 },
    "airbnb": { "revenue": 1720.50, "bookings": 12 }
  }
}
```

### GET `/revenue/forecast`

Get occupancy and revenue forecast.

**Query Parameters:**
- `propertyId` (string, required)
- `days` (integer, default: 30)

**Response:**
```json
{
  "forecast": [
    {
      "date": "2024-04-01",
      "predictedOccupied": 15,
      "totalRooms": 20,
      "predictedOccupancyRate": 75,
      "predictedRevenue": 1800,
      "confidence": 85
    }
  ],
  "summary": {
    "totalPredictedRevenue": 45000,
    "avgPredictedOccupancy": 72.5,
    "trend": 0.08
  }
}
```

---

## Housekeeping

### GET `/housekeeping/my-tasks`

Get housekeeping tasks for current employee.

**Query Parameters:**
- `date` (date, optional): Default today

**Response:**
```json
{
  "tasks": [
    {
      "id": "task-123",
      "roomName": "Room 101",
      "roomType": "Double",
      "taskType": "check_out_clean",
      "priority": "high",
      "status": "pending",
      "estimatedTime": 45,
      "scheduledDate": "2024-04-01T09:00:00Z"
    }
  ]
}
```

### POST `/housekeeping/tasks`

Create housekeeping task.

**Request Body:**
```json
{
  "propertyId": "prop-123",
  "roomId": "room-101",
  "taskType": "check_out_clean",
  "priority": "high",
  "scheduledDate": "2024-04-01",
  "estimatedTime": 45,
  "notes": "Guest requested late checkout"
}
```

### PUT `/housekeeping/tasks/:id/status`

Update task status.

**Request Body:**
```json
{
  "status": "completed",
  "actualTime": 40,
  "notes": "Room cleaned successfully"
}
```

---

## Channel Manager

### POST `/channel-manager/sync`

Trigger sync with OTAs (Booking.com, Airbnb).

**Request Body:**
```json
{
  "propertyId": "prop-123",
  "syncType": "full"
}
```

**syncType Options:**
- `availability` - Sync room availability
- `rates` - Sync pricing
- `reservations` - Pull reservations
- `full` - Full sync (all of above)

**Response:**
```json
{
  "success": true,
  "syncType": "full",
  "results": {
    "booking": {
      "availabilityUpdated": 180,
      "ratesUpdated": 180,
      "reservationsSynced": 12
    },
    "airbnb": {
      "calendarUpdated": 90,
      "pricingUpdated": 90,
      "reservationsSynced": 5
    }
  },
  "errors": []
}
```

---

## Payments

### POST `/payments/create-intent`

Create Stripe payment intent.

**Request Body:**
```json
{
  "reservationId": "res-456",
  "amount": 480,
  "type": "deposit"
}
```

**type Options:**
- `deposit` - Pre-authorization (capture later)
- `full_payment` - Immediate charge
- `incidental` - Additional charges

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "requiresAction": false
}
```

### POST `/payments/charge`

Charge guest card.

**Request Body:**
```json
{
  "reservationId": "res-456",
  "paymentMethodId": "pm_xxx",
  "amount": 480,
  "capture": true
}
```

**capture:**
- `true` - Charge immediately
- `false` - Pre-authorize only

### POST `/payments/refund`

Process refund.

**Request Body:**
```json
{
  "paymentId": "pay-123",
  "amount": 100,
  "reason": "requested_by_customer"
}
```

---

## Invoices

### POST `/invoices/generate`

Generate invoice from reservation.

**Request Body:**
```json
{
  "reservationId": "res-456",
  "dueDate": "2024-04-01",
  "taxRate": 22,
  "language": "sl"
}
```

**language Options:** `sl`, `en`, `de`, `it`

**Response:**
```json
{
  "invoiceId": "inv-789",
  "invoiceNumber": "INV-2024-00001",
  "totalAmount": 549.00
}
```

### GET `/invoices/:id/html`

Get invoice HTML for PDF generation.

**Response:** `text/html`

---

## Error Handling

All endpoints return errors in consistent format:

```json
{
  "error": "Error message",
  "details": { ... }
}
```

**Common Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., room already booked)
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Webhooks

### POST `/webhooks/stripe`

Stripe webhook endpoint for payment events.

**Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`
- `customer.created`

### POST `/tourism/channel-manager/webhook`

OTA webhook for reservation updates.

**Events:**
- `new_reservation`
- `modify_reservation`
- `cancel_reservation`
- `availability_update`

---

## Caching

### FAQ Cache

- **TTL:** 5 minutes
- **Condition:** Confidence ≥ 0.8
- **Hit Rate:** ~80%
- **Performance:** 50-100ms (hit) vs 2-5s (miss)

### Cache Headers

```
Cache-Control: public, max-age=300
ETag: "abc123"
```

---

## Support

**Email:** support@agentflow.pro  
**Documentation:** https://agentflow-pro.docs  
**Status:** https://status.agentflow.pro
