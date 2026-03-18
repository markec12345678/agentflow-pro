# 🚀 HOUSEKEEPING & BILLING FEATURE IMPLEMENTATION PLAN

**Datum:** 2026-03-17
**Status:** Ready for Implementation
**Priority:** High (Q2 2026 MVP)

---

## 📋 **OVERVIEW**

This plan implements two critical missing features using **agentic workflow principles** inspired by Windsurf's Cascade:

1. **Housekeeping Feature** - Room cleaning, maintenance, staff assignment
2. **Billing Feature** - Invoices, payments, refunds, subscription management

**Approach:** Autonomous research + multi-file editing + terminal execution

---

## 🤖 **AGENTIC WORKFLOW METHODOLOGY**

Based on Windsurf Cascade best practices:

### **1. Codebase-Wide Context**
- ✅ Index entire project structure
- ✅ Understand existing patterns (Tourism, Agents features)
- ✅ Maintain consistency with codebase conventions

### **2. Multi-File Operations**
- ✅ Plan changes across components, hooks, API clients
- ✅ Execute simultaneously rather than sequentially
- ✅ Handle dependencies automatically

### **3. Autonomous Research**
- ✅ Research Stripe API documentation
- ✅ Research best practices for housekeeping management
- ✅ Extract patterns from existing code

### **4. Terminal Integration**
- ✅ Run migrations automatically
- ✅ Install required packages
- ✅ Execute test suites

---

## 📦 **FEATURE 1: HOUSEKEEPING**

### **Scope**
- Room cleaning schedules
- Maintenance requests
- Staff assignments
- Task completion tracking
- Real-time status updates

### **Database Schema** (Prisma)

```prisma
// Add to prisma/schema/02-tourism/housekeeping.prisma

model HousekeepingTask {
  id          String   @id @default(cuid())
  taskId      String   @unique
  type        TaskType @default(CLEANING) // CLEANING, MAINTENANCE, INSPECTION
  status      TaskStatus @default(PENDING) // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  priority    Priority @default(MEDIUM) // LOW, MEDIUM, HIGH, URGENT
  
  // Assignment
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id])
  roomId      String?
  room        Room? @relation(fields: [roomId], references: [id])
  assignedTo  String?  // User ID
  assignedBy  String?  // User ID
  
  // Scheduling
  scheduledAt DateTime
  dueBy       DateTime?
  startedAt   DateTime?
  completedAt DateTime?
  
  // Details
  title       String
  description String?
  checklist   Json?    // Array of checklist items
  notes       String?  @db.Text
  photos      String[] // Array of photo URLs
  
  // Time tracking
  estimatedMinutes Int @default(30)
  actualMinutes    Int?
  
  // Metadata
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([propertyId])
  @@index([status])
  @@index([assignedTo])
  @@index([scheduledAt])
  @@map("housekeeping_tasks")
}

model MaintenanceRequest {
  id          String   @id @default(cuid())
  requestId   String   @unique
  
  // Property & Room
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id])
  roomId      String?
  room        Room? @relation(fields: [roomId], references: [id])
  
  // Issue details
  category    MaintenanceCategory // PLUMBING, ELECTRICAL, HVAC, APPLIANCE, FURNITURE, OTHER
  urgency     UrgencyLevel @default(MEDIUM)
  status      MaintenanceStatus @default(OPEN)
  
  // Description
  title       String
  description String @db.Text
  photos      String[]
  
  // Assignment
  assignedTo  String?  // Staff ID or external contractor
  assignedBy  String?
  vendorId    String?  // External vendor
  vendorName  String?
  vendorContact String?
  
  // Timeline
  reportedAt  DateTime @default(now())
  dueBy       DateTime?
  startedAt   DateTime?
  resolvedAt  DateTime?
  
  // Resolution
  resolution  String? @db.Text
  cost        Decimal? @db.Decimal(10, 2)
  warrantyInfo String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([propertyId])
  @@index([status])
  @@index([category])
  @@map("maintenance_requests")
}

model StaffAssignment {
  id          String   @id @default(cuid())
  staffId     String   // User ID
  staff       User     @relation(fields: [staffId], references: [id])
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id])
  
  // Schedule
  date        DateTime
  shiftStart  DateTime
  shiftEnd    DateTime
  
  // Assignments
  tasks       HousekeepingTask[]
  maxTasks    Int @default(10)
  completedTasks Int @default(0)
  
  // Performance
  rating      Int?     // 1-5
  notes       String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([staffId, date, shiftStart])
  @@index([propertyId])
  @@index([date])
  @@map("staff_assignments")
}

enum TaskType {
  CLEANING
  MAINTENANCE
  INSPECTION
  TURNDOWN
  DEEP_CLEAN
}

enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum MaintenanceCategory {
  PLUMBING
  ELECTRICAL
  HVAC
  APPLIANCE
  FURNITURE
  COSMETIC
  SAFETY
  OTHER
}

enum UrgencyLevel {
  LOW
  MEDIUM
  HIGH
  EMERGENCY
}

enum MaintenanceStatus {
  OPEN
  IN_PROGRESS
  WAITING_PARTS
  RESOLVED
  CLOSED
}
```

### **File Structure to Create**

```
src/features/housekeeping/
├── components/
│   ├── HousekeepingDashboard.tsx
│   ├── TaskList.tsx
│   ├── TaskCard.tsx
│   ├── TaskDetail.tsx
│   ├── TaskForm.tsx
│   ├── CleaningSchedule.tsx
│   ├── MaintenanceRequestForm.tsx
│   ├── MaintenanceList.tsx
│   ├── StaffAssignmentBoard.tsx
│   ├── StaffCard.tsx
│   └── index.ts
├── hooks/
│   ├── useTasks.ts
│   ├── useMaintenance.ts
│   ├── useStaffAssignments.ts
│   ├── useCleaningSchedule.ts
│   └── index.ts
├── api-client/
│   ├── housekeepingApi.ts
│   └── index.ts
├── types.ts
└── index.ts

src/app/api/housekeeping/
├── tasks/
│   ├── route.ts (GET, POST)
│   └── [taskId]/route.ts (GET, PUT, DELETE)
├── maintenance/
│   ├── route.ts (GET, POST)
│   └── [requestId]/route.ts (GET, PUT, DELETE)
└── staff-assignments/
    ├── route.ts (GET, POST)
    └── [assignmentId]/route.ts (GET, PUT, DELETE)
```

### **Implementation Steps**

#### **Step 1: Database Migration** (15 min)
```bash
# Create migration file
npx prisma migrate dev --name add_housekeeping_models

# Verify migration
npx prisma studio
```

#### **Step 2: API Routes** (2 hours)
- Create task CRUD endpoints
- Create maintenance request endpoints
- Create staff assignment endpoints
- Add validation with Zod schemas

#### **Step 3: React Hooks** (2 hours)
- `useTasks` - Task management
- `useMaintenance` - Maintenance requests
- `useStaffAssignments` - Staff scheduling
- `useCleaningSchedule` - Schedule optimization

#### **Step 4: UI Components** (4 hours)
- HousekeepingDashboard - Main view
- TaskList + TaskCard - Task management
- CleaningSchedule - Calendar view
- MaintenanceRequestForm - Create requests
- StaffAssignmentBoard - Kanban board

#### **Step 5: Integration** (1 hour)
- Wire to existing Property module
- Add to navigation
- Create sample data
- Test end-to-end

**Total Time:** ~9-10 hours

---

## 💰 **FEATURE 2: BILLING**

### **Scope**
- Invoice generation (PDF)
- Payment processing (Stripe)
- Refund management
- Subscription billing
- Tax compliance (Slovenian DDV)

### **Research: Stripe API Best Practices**

Based on Stripe documentation 2026:

```typescript
// Key Stripe Integration Patterns

// 1. Payment Intents (recommended over Charges)
const paymentIntent = await stripe.paymentIntents.create({
  amount: amountInCents,
  currency: 'eur',
  automatic_payment_methods: { enabled: true },
  metadata: {
    invoiceId: invoice.id,
    propertyId: property.id,
  },
});

// 2. Invoices with Line Items
const invoice = await stripe.invoices.create({
  customer: customerId,
  auto_advance: true,
  collection_method: 'charge_automatically',
});

await stripe.invoiceItems.create({
  customer: customerId,
  amount: 2000, // €20.00
  currency: 'eur',
  description: 'Hotel stay - 2 nights',
});

// 3. Subscriptions for Recurring Billing
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: 'price_id' }],
  billing_cycle_anchor: 'now',
});

// 4. Refunds
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
  amount: amountInCents, // Partial or full
  reason: 'requested_by_customer',
});

// 5. Tax Compliance (EU VAT)
const taxRate = await stripe.taxRates.create({
  display_name: 'DDV',
  inclusive: false,
  percentage: 22, // Slovenian VAT
  tax_type: 'vat',
  country: 'SI',
});
```

### **Database Schema** (Prisma)

```prisma
// Add to prisma/schema/11-invoicing/billing.prisma

model Invoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique // Format: YYYY-XXXX
  invoiceId       String   @unique // Internal ID
  
  // Property & Guest
  propertyId      String
  property        Property @relation(fields: [propertyId], references: [id])
  guestId         String?
  guest           Guest? @relation(fields: [guestId], references: [id])
  reservationId   String?
  reservation     Reservation? @relation(fields: [reservationId], references: [id])
  
  // Stripe Integration
  stripeCustomerId String?
  stripeInvoiceId  String?
  stripePaymentIntentId String?
  
  // Amounts
  subtotal        Decimal  @db.Decimal(10, 2)
  taxRate         Decimal  @default(22) // Slovenian DDV
  taxAmount       Decimal  @db.Decimal(10, 2)
  total           Decimal  @db.Decimal(10, 2)
  amountPaid      Decimal  @default(0) @db.Decimal(10, 2)
  amountDue       Decimal  @db.Decimal(10, 2)
  currency        String   @default('EUR')
  
  // Line Items
  lineItems       InvoiceLineItem[]
  
  // Status
  status          InvoiceStatus @default(DRAFT) // DRAFT, SENT, PAID, PARTIAL, OVERDUE, CANCELLED, REFUNDED
  
  // Dates
  issueDate       DateTime @default(now())
  dueDate         DateTime
  paidAt          DateTime?
  
  // PDF
  pdfUrl          String?
  pdfGeneratedAt  DateTime?
  
  // Payment
  paymentMethod   PaymentMethod? // CARD, BANK_TRANSFER, CASH
  paymentDetails  Json?
  
  // Refunds
  refunds         InvoiceRefund[]
  
  // Metadata
  notes           String? @db.Text
  metadata        Json?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([propertyId])
  @@index([status])
  @@index([guestId])
  @@index([issueDate])
  @@map("invoices")
}

model InvoiceLineItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  
  // Item details
  description String
  quantity    Decimal  @default(1) @db.Decimal(10, 2)
  unitPrice   Decimal  @db.Decimal(10, 2)
  amount      Decimal  @db.Decimal(10, 2)
  taxRate     Decimal  @default(22)
  
  // Categorization
  category    LineItemCategory // ACCOMMODATION, FOOD, SERVICE, OTHER
  metadata    Json?
  
  createdAt   DateTime @default(now())
  
  @@index([invoiceId])
  @@map("invoice_line_items")
}

model InvoiceRefund {
  id              String   @id @default(cuid())
  refundId        String   @unique
  
  invoiceId       String
  invoice         Invoice  @relation(fields: [invoiceId], references: [id])
  
  // Stripe
  stripeRefundId  String?
  
  // Amount
  amount          Decimal  @db.Decimal(10, 2)
  reason          String
  
  // Status
  status          RefundStatus @default(PENDING) // PENDING, PROCESSING, COMPLETED, FAILED
  
  // Processing
  processedBy     String?  // User ID
  processedAt     DateTime?
  approvedBy      String?  // User ID
  approvedAt      DateTime?
  
  // Metadata
  notes           String? @db.Text
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([invoiceId])
  @@index([status])
  @@map("invoice_refunds")
}

model Subscription {
  id              String   @id @default(cuid())
  subscriptionId  String   @unique
  
  // Customer
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  stripeCustomerId String
  stripeSubscriptionId String
  
  // Plan
  planId          String
  planName        String
  status          SubscriptionStatus @default(ACTIVE)
  
  // Billing
  amount          Decimal  @db.Decimal(10, 2)
  currency        String   @default('EUR')
  interval        BillingInterval @default(MONTHLY)
  
  // Period
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
  canceledAt      DateTime?
  
  // Usage tracking
  usageRecords    Json?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
  @@index([status])
  @@map("subscriptions")
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  PARTIAL
  OVERDUE
  CANCELLED
  REFUNDED
}

enum PaymentMethod {
  CARD
  BANK_TRANSFER
  CASH
  STRIPE
}

enum LineItemCategory {
  ACCOMMODATION
  FOOD
  SERVICE
  AMENITY
  OTHER
}

enum RefundStatus {
  PENDING
  APPROVED
  PROCESSING
  COMPLETED
  FAILED
}

enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELED
  EXPIRED
}

enum BillingInterval {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}
```

### **File Structure to Create**

```
src/features/billing/
├── components/
│   ├── BillingDashboard.tsx
│   ├── InvoiceList.tsx
│   ├── InvoiceDetail.tsx
│   ├── InvoiceForm.tsx
│   ├── InvoicePDF.tsx
│   ├── PaymentForm.tsx
│   ├── PaymentStatus.tsx
│   ├── RefundForm.tsx
│   ├── RefundList.tsx
│   ├── SubscriptionManagement.tsx
│   ├── StripeElements.tsx
│   └── index.ts
├── hooks/
│   ├── useInvoices.ts
│   ├── usePayments.ts
│   ├── useRefunds.ts
│   ├── useSubscriptions.ts
│   ├── useStripe.ts
│   └── index.ts
├── api-client/
│   ├── billingApi.ts
│   ├── stripeApi.ts
│   └── index.ts
├── lib/
│   ├── invoice-generator.ts
│   ├── pdf-generator.ts
│   ├── stripe-client.ts
│   ├── tax-calculator.ts
│   └── index.ts
├── types.ts
└── index.ts

src/app/api/billing/
├── invoices/
│   ├── route.ts (GET, POST)
│   ├── [invoiceId]/route.ts (GET, PUT, DELETE)
│   ├── [invoiceId]/pdf/route.ts (GET)
│   └── [invoiceId]/send/route.ts (POST)
├── payments/
│   ├── route.ts (POST)
│   └── [paymentId]/route.ts (GET)
├── refunds/
│   ├── route.ts (GET, POST)
│   └── [refundId]/route.ts (GET, PUT)
└── subscriptions/
    ├── route.ts (GET, POST)
    └── [subscriptionId]/route.ts (GET, PUT, DELETE)

src/app/api/webhooks/
└── stripe/route.ts (POST - Stripe webhooks)
```

### **Implementation Steps**

#### **Step 1: Stripe Setup** (30 min)
```bash
# Install Stripe packages
npm install stripe @stripe/stripe-js @stripe/react-stripe-js

# Add to .env.local
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **Step 2: Database Migration** (15 min)
```bash
npx prisma migrate dev --name add_billing_models
```

#### **Step 3: Stripe Integration** (2 hours)
- Create Stripe client wrapper
- Implement Payment Intents
- Set up webhook handlers
- Create customer sync logic

#### **Step 4: Invoice Generation** (3 hours)
- PDF generation with @react-pdf/renderer
- Slovenian tax compliance (DDV breakdown)
- Sequential invoice numbering
- Email delivery

#### **Step 5: API Routes** (3 hours)
- Invoice CRUD
- Payment processing
- Refund management
- Subscription billing

#### **Step 6: React Hooks** (2 hours)
- `useInvoices` - Invoice management
- `usePayments` - Payment processing
- `useRefunds` - Refund handling
- `useSubscriptions` - Subscription billing
- `useStripe` - Stripe integration

#### **Step 7: UI Components** (4 hours)
- BillingDashboard - Overview
- InvoiceList + InvoiceDetail
- PaymentForm with Stripe Elements
- RefundForm
- SubscriptionManagement

#### **Step 8: Testing** (2 hours)
- Stripe test mode integration
- Webhook testing
- PDF generation testing
- End-to-end flows

**Total Time:** ~18-20 hours

---

## 🔄 **AGENTIC EXECUTION WORKFLOW**

### **Phase 1: Research & Planning** (Autonomous)
```
Agent Actions:
1. ✅ Read existing codebase patterns
2. ✅ Research Stripe API documentation
3. ✅ Research housekeeping management best practices
4. ✅ Generate database schemas
5. ✅ Plan file structure
```

### **Phase 2: Database & Backend** (Semi-Autonomous)
```
Agent Actions:
1. ⏳ Create Prisma schema files
2. ⏳ Run migrations (requires user confirmation)
3. ⏳ Generate Prisma client
4. ⏳ Create API routes
5. ⏳ Add validation logic
```

### **Phase 3: Frontend Components** (Semi-Autonomous)
```
Agent Actions:
1. ⏳ Create React hooks
2. ⏳ Create UI components
3. ⏳ Wire to API routes
4. ⏳ Add error handling
5. ⏳ Style with TailwindCSS
```

### **Phase 4: Integration & Testing** (Collaborative)
```
Agent Actions:
1. ⏳ Integrate with existing modules
2. ⏳ Create sample data
3. ⏳ Run test suites (requires user review)
4. ⏳ Fix issues iteratively
5. ⏳ Git commit (requires user approval)
```

---

## 📊 **TIMELINE & EFFORT ESTIMATE**

| Phase | Task | Time | Dependencies |
|-------|------|------|--------------|
| **Housekeeping** | | **9-10 hours** | |
| - Database | Schema + Migration | 15 min | None |
| - Backend | API Routes | 2 hours | Database |
| - Frontend | Hooks | 2 hours | Backend |
| - Frontend | Components | 4 hours | Hooks |
| - Integration | Testing + Polish | 1 hour | All |
| **Billing** | | **18-20 hours** | |
| - Stripe Setup | Config + Client | 30 min | None |
| - Database | Schema + Migration | 15 min | None |
| - Backend | Stripe Integration | 2 hours | Setup |
| - Backend | Invoice Generation | 3 hours | Database |
| - Backend | API Routes | 3 hours | All above |
| - Frontend | Hooks | 2 hours | Backend |
| - Frontend | Components | 4 hours | Hooks |
| - Testing | E2E + Stripe Test | 2 hours | All |
| **Total** | | **27-30 hours** | |

### **Suggested Schedule**

| Day | Focus | Deliverable |
|-----|-------|-------------|
| **Day 1** | Housekeeping Database + Backend | API ready |
| **Day 2** | Housekeeping Frontend | UI ready |
| **Day 3** | Housekeeping Integration | Feature complete |
| **Day 4** | Billing Stripe + Database | Infrastructure ready |
| **Day 5** | Billing Backend | API + PDF ready |
| **Day 6** | Billing Frontend | UI ready |
| **Day 7** | Billing Testing + Polish | Feature complete |

**Total:** 7 days (part-time) or 3-4 days (full-time)

---

## 🎯 **SUCCESS CRITERIA**

### **Housekeeping Feature**
- ✅ Create, read, update, delete tasks
- ✅ Visual cleaning schedule calendar
- ✅ Staff assignment board (Kanban)
- ✅ Maintenance request workflow
- ✅ Real-time status updates
- ✅ Mobile-responsive UI

### **Billing Feature**
- ✅ Generate invoices with PDF export
- ✅ Process payments via Stripe
- ✅ Handle refunds (partial/full)
- ✅ Subscription billing
- ✅ Slovenian tax compliance (22% DDV)
- ✅ Stripe webhook integration
- ✅ Payment status tracking

---

## 🚀 **NEXT ACTIONS**

### **Immediate (Today)**
1. ⏳ Review and approve this plan
2. ⏳ Create `.env.local` entries for Stripe
3. ⏳ Start Housekeeping database migration

### **This Week**
1. ⏳ Complete Housekeeping feature
2. ⏳ Start Billing feature
3. ⏳ Set up Stripe test account

### **Next Week**
1. ⏳ Complete Billing feature
2. ⏳ Run full test suite
3. ⏳ Deploy to staging
4. ⏳ User acceptance testing

---

## 📝 **NOTES**

### **Stripe Test Mode**
- Use test keys for development
- Test card: `4242 4242 4242 4242`
- Webhook testing via Stripe CLI

### **Slovenian Compliance**
- 22% DDV (VAT) standard rate
- Sequential invoice numbering (YYYY-XXXX)
- eDavki XML export (future enhancement)

### **Performance Considerations**
- Index all foreign keys
- Cache frequently accessed data
- Use React Query for server state
- Optimize PDF generation (lazy load)

---

**Plan Created:** 2026-03-17
**Status:** Ready for Implementation
**Next:** User approval → Start Phase 1
