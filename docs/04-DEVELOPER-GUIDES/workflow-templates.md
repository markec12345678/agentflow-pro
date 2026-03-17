# 🔄 Workflow Templates Documentation

**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 📋 OVERVIEW

Pre-built workflow templates for tourism automation. Each template includes triggers, actions, and conditions ready to deploy.

### Features

- ✅ 8 pre-built workflows
- ✅ Cron-based scheduling
- ✅ Event-driven triggers
- ✅ Multi-action sequences
- ✅ Variable substitution
- ✅ Category organization
- ✅ Time savings estimates

---

## 📦 AVAILABLE WORKFLOWS

### Guest Communication (3)

| ID | Name | Trigger | Time Saved |
|----|------|---------|------------|
| `auto_checkin_reminder` | Auto Check-in Reminder | Daily 10:00 | 15 min/booking |
| `auto_review_request` | Auto Review Request | Daily 11:00 | 10 min/guest |
| `payment_reminder` | Payment Reminder | Daily 9:00 | 15 min/booking |

### Operations (2)

| ID | Name | Trigger | Time Saved |
|----|------|---------|------------|
| `vip_guest_alert` | VIP Guest Alert | On booking | 20 min/VIP |
| `housekeeping_task_assignment` | Housekeeping Tasks | On checkout | 10 min/checkout |

### Revenue (2)

| ID | Name | Trigger | Time Saved |
|----|------|---------|------------|
| `low_occupancy_alert` | Low Occupancy Alert | Daily 8:00 | 30 min/day |
| `dynamic_price_adjustment` | Dynamic Pricing | Daily 6:00 | 2 hrs/week |

### Compliance (1)

| ID | Name | Trigger | Time Saved |
|----|------|---------|------------|
| `eturizem_auto_sync` | eTurizem Auto-Sync | Hourly | 1 hr/week |

---

## 🚀 USAGE

### Create Workflow from Template

```typescript
import { createWorkflowFromTemplate } from '@/lib/workflow-templates';

// Create auto check-in reminder workflow
const workflow = await createWorkflowFromTemplate(
  'auto_checkin_reminder',
  'property-123',
  'user-456'
);

console.log(`✅ Workflow created: ${workflow.name}`);
```

### Get Templates by Category

```typescript
import { getTemplatesByCategory } from '@/lib/workflow-templates';

// Get all guest communication workflows
const guestCommWorkflows = getTemplatesByCategory('guest-communication');

console.log(`Found ${guestCommWorkflows.length} workflows`);
```

### Get Template by ID

```typescript
import { getTemplateById } from '@/lib/workflow-templates';

// Get VIP guest alert template
const vipTemplate = getTemplateById('vip_guest_alert');

console.log(vipTemplate.name);
// Output: "VIP Gost Alert"
```

### Check Template Exists

```typescript
import { templateExists } from '@/lib/workflow-templates';

const exists = templateExists('auto_checkin_reminder');
console.log(exists); // true
```

### Get Workflow Variables

```typescript
import { getWorkflowVariables } from '@/lib/workflow-templates';

const variables = getWorkflowVariables('vip_guest_alert');
console.log(variables);
// Output: ['guest.name', 'guest.loyaltyTier', ...]
```

---

## 📊 WORKFLOW DETAILS

### 1. Auto Check-in Reminder

**Purpose:** Send check-in reminder 1 day before arrival

**Trigger:**
- Type: Scheduled
- Schedule: `0 10 * * *` (Daily at 10:00)
- Condition: Reservation check-in tomorrow AND status confirmed

**Actions:**
1. Send email (pre_arrival template)
2. Send SMS reminder
3. Create task for reception

**Variables:**
- `guest.email`, `guest.name`, `guest.phone`
- `property.name`
- `reservation.roomNumber`, `reservation.checkIn`

---

### 2. Auto Review Request

**Purpose:** Request review 1 day after checkout

**Trigger:**
- Type: Scheduled
- Schedule: `0 11 * * *` (Daily at 11:00)
- Condition: Reservation checkout yesterday AND status checked_out

**Actions:**
1. Send email (post_stay template)
2. Send WhatsApp message
3. Update guest profile

**Variables:**
- `guest.email`, `guest.phone`, `guest.id`
- `property.name`
- `reviewLink`

---

### 3. VIP Guest Alert

**Purpose:** Alert staff when VIP guest books

**Trigger:**
- Type: Event
- Event: `reservation.created`
- Condition: Guest loyalty tier is gold OR platinum

**Actions:**
1. Notify reception (high priority)
2. Notify housekeeping (medium priority)
3. Create VIP welcome task
4. Create VIP room cleaning task

**Variables:**
- `guest.name`, `guest.loyaltyTier`
- `reservation.roomNumber`, `reservation.checkIn`

---

### 4. Low Occupancy Alert

**Purpose:** Alert director when occupancy is low

**Trigger:**
- Type: Scheduled
- Schedule: `0 8 * * *` (Daily at 8:00)
- Condition: Occupancy next 7 days < 30%

**Actions:**
1. Send high priority notification
2. Send email to director
3. Create last-minute promotion workflow

**Variables:**
- `occupancy.next_7_days`
- `rooms.available`
- `director.email`
- `property.name`

---

### 5. eTurizem Auto-Sync

**Purpose:** Sync reservations with eTurizem hourly

**Trigger:**
- Type: Scheduled
- Schedule: `0 * * * *` (Hourly)
- Condition: Property eTurizem enabled

**Actions:**
1. Sync with eTurizem (full sync)
2. Log activity
3. Send notification (only on error)

**Variables:**
- `property.id`, `property.name`

---

## 🔧 CUSTOMIZATION

### Modify Schedule

```typescript
const template = getTemplateById('auto_checkin_reminder');

// Change from 10:00 to 14:00
template.trigger.schedule = '0 14 * * *';
```

### Add Action

```typescript
const template = getTemplateById('vip_guest_alert');

template.actions.push({
  type: 'send_email',
  config: {
    to: '{{manager.email}}',
    subject: 'VIP Guest Alert: {{guest.name}}',
    body: 'VIP guest booking detected...',
  },
});
```

### Change Condition

```typescript
const template = getTemplateById('low_occupancy_alert');

// Change threshold from 30% to 40%
template.trigger.condition = 'occupancy.next_7_days < 40';
```

---

## 📈 TIME SAVINGS

### Total Time Saved Per Month

| Workflow | Frequency | Time Saved | Monthly |
|----------|-----------|------------|---------|
| Auto Check-in | Per booking | 15 min | 75 min |
| Auto Review | Per guest | 10 min | 50 min |
| VIP Alert | Per VIP | 20 min | 40 min |
| Low Occupancy | Daily | 30 min | 15 hrs |
| eTurizem Sync | Weekly | 1 hr | 4 hrs |
| Housekeeping | Per checkout | 10 min | 50 min |
| Dynamic Pricing | Weekly | 2 hrs | 8 hrs |

**Total Monthly Savings: ~30 hours**

---

## 🎯 BEST PRACTICES

### 1. Test Before Activating

```typescript
// Test workflow with sample data
const testWorkflow = await testWorkflowExecution({
  templateId: 'auto_checkin_reminder',
  testData: {
    guest: { name: 'Test', email: 'test@example.com' },
    property: { name: 'Test Property' },
    reservation: { roomNumber: '101', checkIn: new Date() },
  },
});
```

### 2. Monitor Execution

```typescript
// Get workflow execution logs
const logs = await prisma.workflowExecution.findMany({
  where: { workflowId: workflow.id },
  orderBy: { executedAt: 'desc' },
  take: 10,
});
```

### 3. Handle Errors

```typescript
try {
  await createWorkflowFromTemplate('auto_checkin_reminder', propertyId, userId);
} catch (error) {
  console.error('Failed to create workflow:', error);
  // Send alert to admin
}
```

---

## 📞 SUPPORT

**Issues:** GitHub Issues  
**Documentation:** `/docs/workflow-templates`  
**Contact:** support@agentflow.pro

---

**Last Updated:** 2026-03-09  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
