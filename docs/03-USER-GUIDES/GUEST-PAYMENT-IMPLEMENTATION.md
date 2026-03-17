# 🚀 Guest Payment & Invoice Implementation Guide

**Datum:** 2026-03-10  
**Status:** ✅ IMPLEMENTIRANO

---

## 📊 Kaj Je Bilo Implementirano

### **1. Database Schema** ✅
- ✅ `Payment` model razširjen s Stripe integration
- ✅ `Invoice` model za avtomatsko generiranje računov
- ✅ Relacije: Reservation → Payments, Invoices

### **2. Stripe Guest Payment Service** ✅
**Datoteka:** `src/lib/stripe-guest-payments.ts`

**Funkcije:**
- `createGuestCustomer()` - Kreiraj Stripe customer
- `createPaymentIntent()` - Ustvari payment intent
- `chargeGuest()` - Charge ali pre-authorization
- `capturePayment()` - Capture pre-authorized payment
- `processRefund()` - Full/partial refunds
- `savePaymentMethod()` - Tokenization
- `cancelPayment()` - Release pre-auth

### **3. Payment API Endpoints** ✅

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tourism/payments/create-intent` | POST | Create payment intent |
| `/api/tourism/payments/charge` | POST | Charge guest card |
| `/api/tourism/payments/capture` | POST | Capture pre-auth |
| `/api/tourism/payments/refund` | POST | Process refund |

### **4. Invoice Generation** ✅
**Datoteka:** `src/lib/invoice-generation.ts`

**Features:**
- ✅ Auto-generate invoice numbers (INV-2024-00001)
- ✅ Multi-language templates (SL, EN, DE, IT)
- ✅ VAT calculation (default 22%)
- ✅ HTML generation for PDF
- ✅ Auto-create from reservation

### **5. Payment UI Component** ✅
**Datoteka:** `src/web/components/PaymentUI.tsx`

**Features:**
- ✅ Stripe Elements integration
- ✅ Card input
- ✅ Payment status tracking
- ✅ Success/error handling

### **6. Webhook Handlers** ✅

| Webhook | Purpose |
|---------|---------|
| `/api/webhooks/stripe` | Stripe payment events |
| `/api/tourism/channel-manager/webhook` | OTA updates (Booking, Airbnb) |

---

## 🔧 Setup Navodila

### **1. Environment Variables**

Dodaj v `.env.local`:

```bash
# Stripe (required)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional za Stripe Connect
STRIPE_CONNECT_CLIENT_ID=ca_...

# Channel manager webhooks
BOOKING_WEBHOOK_SECRET=your_booking_secret
AIRBNB_WEBHOOK_SECRET=your_airbnb_secret
EXPEDIA_WEBHOOK_SECRET=your_expedia_secret
```

### **2. Database Migration**

```bash
# Push schema changes to database
npx prisma db push

# Or create migration
npx prisma migrate dev --name add_payment_invoice_features
```

### **3. Stripe Setup**

1. **Create Stripe Account**: https://stripe.com
2. **Get API Keys**: Dashboard → Developers → API keys
3. **Setup Webhooks**: Dashboard → Developers → Webhooks
   - Endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

### **4. Install Stripe Dependencies**

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe
```

---

## 💳 Kako Uporabiti (Frontend)

### **Basic Payment Flow**

```typescript
import { PaymentUI } from "@/web/components/PaymentUI";

// In your reservation page
<PaymentUI
  reservationId="res-123"
  totalAmount={500}
  currency="EUR"
  onPaymentSuccess={(paymentId) => {
    console.log("Payment successful:", paymentId);
    // Refresh reservation data
  }}
/>
```

### **Advanced: Pre-authorization + Capture**

```typescript
// 1. Pre-authorize at booking (deposit)
const depositIntent = await fetch("/api/tourism/payments/create-intent", {
  method: "POST",
  body: JSON.stringify({
    reservationId: "res-123",
    amount: 200, // 50% deposit
    type: "deposit", // Manual capture
  }),
});

// 2. Charge guest card
const { clientSecret } = await depositIntent.json();

// Use Stripe Elements to confirm
await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});

// 3. Capture remaining amount at check-in
await fetch("/api/tourism/payments/charge", {
  method: "POST",
  body: JSON.stringify({
    reservationId: "res-123",
    paymentMethodId: "pm_123",
    amount: 300, // Remaining
    capture: true,
  }),
});
```

### **Generate Invoice**

```typescript
// Auto-generate from reservation
const invoice = await fetch("/api/tourism/invoices/generate", {
  method: "POST",
  body: JSON.stringify({
    reservationId: "res-123",
    language: "sl", // sl, en, de, it
    taxRate: 22, // VAT %
  }),
});

const { invoiceNumber, totalAmount } = await invoice.json();
```

---

## 🧪 Testing

### **Test Stripe Payments (Test Mode)**

```bash
# Use Stripe test cards
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### **Test Scenarios**

1. **Full Payment** ✅
   ```
   POST /api/tourism/payments/create-intent
   { "reservationId": "res-123", "amount": 500, "type": "full_payment" }
   ```

2. **Deposit (Pre-auth)** ✅
   ```
   POST /api/tourism/payments/create-intent
   { "reservationId": "res-123", "amount": 200, "type": "deposit" }
   ```

3. **Capture Pre-auth** ✅
   ```
   POST /api/tourism/payments/capture
   { "paymentId": "pay-123" }
   ```

4. **Refund** ✅
   ```
   POST /api/tourism/payments/refund
   { "paymentId": "pay-123", "amount": 100 }
   ```

5. **Generate Invoice** ✅
   ```
   POST /api/tourism/invoices/generate
   { "reservationId": "res-123" }
   ```

---

## 📋 Invoice Templates

### **Slovenian (SL)**
```
RAČUN #INV-2024-00001
Podatki o nastanitvi: Hotel Slovenija
Podatki o gostu: John Doe
Skupaj: €549.00
```

### **English (EN)**
```
INVOICE #INV-2024-00001
Property Information: Hotel Slovenija
Guest Information: John Doe
Totals: €549.00
```

### **German (DE)**
```
RECHNUNG #INV-2024-00001
Unterkunftsinformationen: Hotel Slovenija
Gastinformationen: John Doe
Gesamt: €549.00
```

### **Italian (IT)**
```
FATTURA #INV-2024-00001
Informazioni sulla struttura: Hotel Slovenija
Informazioni sull'ospite: John Doe
Totali: €549.00
```

---

## 🔐 Security & Compliance

### **PCI DSS Compliance**
- ✅ Stripe Elements (SAQ A)
- ✅ No card data touches your server
- ✅ Tokenization via Stripe
- ✅ Secure webhook verification

### **GDPR**
- ✅ Guest data encryption
- ✅ Invoice data retention policies
- ✅ Right to be forgotten (anonymize invoices)

### **VAT Compliance**
- ✅ Slovenian VAT (22%)
- ✅ Reverse charge for EU B2B
- ✅ Tax invoice requirements met

---

## 📊 Payment Flow Diagram

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Guest     │      │  AgentFlow   │      │   Stripe    │
│             │      │              │      │             │
│  1. Book    │─────>│  2. Create   │─────>│  3. Create  │
│  Room       │      │  Intent      │      │  Payment    │
│             │      │              │      │  Intent     │
│  4. Enter   │<─────│  5. Return   │<─────│             │
│  Card       │      │  clientSecret│      │             │
│             │      │              │      │             │
│  6. Confirm │─────>│  7. Confirm  │─────>│  8. Charge  │
│  Payment    │      │  Payment     │      │  Card       │
│             │      │              │      │             │
│  9. Success │<─────│  10. Webhook │<─────│  11. Notify │
│  Message    │      │  Success     │      │  Success    │
│             │      │              │      │             │
│  12. Email  │<─────│  13. Generate│      │             │
│  Invoice    │      │  Invoice     │      │             │
└─────────────┘      └──────────────┘      └─────────────┘
```

---

## 🚨 Troubleshooting

### **Payment Fails**
- Check Stripe API keys are correct
- Verify webhook endpoint is accessible
- Check Stripe dashboard for errors

### **Invoice Not Generating**
- Verify reservation has totalPrice
- Check taxRate is valid number
- Ensure propertyId and guestId exist

### **Webhook Not Working**
- Verify webhook secret is correct
- Check endpoint is publicly accessible (use ngrok for local testing)
- Verify signature in Stripe dashboard

---

## 📈 Next Steps

### **Phase 1 (Done)** ✅
- [x] Payment processing
- [x] Invoice generation
- [x] Webhook handlers

### **Phase 2 (Next)**
- [ ] Payment UI integration na vse reservation pages
- [ ] Email invoice delivery
- [ ] Payment reminders (automated)

### **Phase 3 (Future)**
- [ ] Stripe Connect for property owners
- [ ] Multi-currency support
- [ ] Payment plans/installments
- [ ] Chargeback handling

---

## 📞 Support

**Stripe Documentation:**
- https://stripe.com/docs/payments
- https://stripe.com/docs/api

**Internal Contacts:**
- Developer: @admin
- Support: support@agentflow.pro

---

**Vse kritične payment features so implementirane in pripravljene za production!** 🎉
