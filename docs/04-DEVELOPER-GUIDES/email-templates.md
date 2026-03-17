# 📧 Email Templates Documentation

**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 📋 OVERVIEW

Professional email templates for all guest communication scenarios in AgentFlow Pro.

### Features

- ✅ 5 professional templates
- ✅ Variable substitution
- ✅ Mobile-responsive design
- ✅ Multi-language support
- ✅ Beautiful gradient headers
- ✅ Call-to-action buttons
- ✅ Professional styling

---

## 📦 AVAILABLE TEMPLATES

### 1. Welcome Email (`welcome`)

**Category:** Booking  
**Trigger:** On reservation creation  
**Purpose:** Confirm booking and provide check-in information

**Variables:**
- `guest_name`
- `property_name`
- `check_in_date`
- `check_out_date`
- `room_number`
- `guest_count`
- `property_address`
- `property_city`
- `property_country`
- `property_phone`
- `property_email`
- `check_in_link`

---

### 2. Pre-Arrival Email (`pre_arrival`)

**Category:** Pre-Arrival  
**Trigger:** 1 day before check-in  
**Purpose:** Remind guest about upcoming stay

**Variables:**
- `guest_name`
- `property_name`
- `parking_instructions`
- `access_instructions`
- `maps_link`
- `property_phone`

---

### 3. Post-Stay Email (`post_stay`)

**Category:** Post-Stay  
**Trigger:** After checkout  
**Purpose:** Request review and offer discount

**Variables:**
- `guest_name`
- `property_name`
- `review_link`
- `discount_code`
- `discount_expiry`
- `instagram_link`
- `facebook_link`

---

### 4. Payment Confirmation (`payment_confirmation`)

**Category:** Payment  
**Trigger:** After successful payment  
**Purpose:** Confirm payment receipt

**Variables:**
- `guest_name`
- `amount`
- `currency`
- `payment_date`
- `reservation_id`
- `payment_method`
- `invoice_link`

---

### 5. Cancellation Confirmation (`cancellation`)

**Category:** Cancellation  
**Trigger:** After reservation cancellation  
**Purpose:** Confirm cancellation and refund

**Variables:**
- `guest_name`
- `reservation_id`
- `cancellation_date`
- `refund_amount`
- `currency`

---

## 🚀 USAGE

### Basic Usage

```typescript
import { renderEmailTemplate } from '@/lib/email-templates';

// Render template
const { subject, body } = renderEmailTemplate('welcome', {
  guest_name: 'John Doe',
  property_name: 'Villa Bled',
  check_in_date: '2026-03-15',
  check_out_date: '2026-03-22',
  room_number: '301',
  guest_count: '2',
  property_address: 'Cesta svobode 1',
  property_city: 'Bled',
  property_country: 'Slovenia',
  property_phone: '+386 40 123 456',
  property_email: 'info@villabled.com',
  check_in_link: 'https://villabled.com/checkin/123'
});

// Send email
await sendEmail({
  to: 'john@example.com',
  subject,
  html: body
});
```

### Get Templates by Category

```typescript
import { getTemplatesByCategory } from '@/lib/email-templates';

// Get all booking templates
const bookingTemplates = getTemplatesByCategory('booking');

// Get all pre-arrival templates
const preArrivalTemplates = getTemplatesByCategory('pre-arrival');
```

### Get Template by ID

```typescript
import { getTemplateById } from '@/lib/email-templates';

// Get specific template
const welcomeTemplate = getTemplateById('welcome');

console.log(welcomeTemplate.subject);
// Output: "Dobrodošli v {{property_name}}! 🎉"
```

---

## 📊 TEMPLATE CATEGORIES

| Category | Templates | Purpose |
|----------|-----------|---------|
| **booking** | welcome, cancellation | Reservation management |
| **pre-arrival** | pre_arrival | Before guest arrives |
| **during-stay** | (coming soon) | During guest stay |
| **post-stay** | post_stay | After guest leaves |
| **payment** | payment_confirmation | Payment confirmations |

---

## 🎨 DESIGN FEATURES

### Responsive Design
- ✅ Mobile-optimized (max-width: 600px)
- ✅ Works on all email clients
- ✅ Graceful degradation

### Visual Elements
- ✅ Gradient headers
- ✅ Rounded corners
- ✅ Professional color scheme
- ✅ Clear call-to-action buttons
- ✅ Icons and emojis

### Accessibility
- ✅ Semantic HTML
- ✅ Alt text for images
- ✅ High contrast colors
- ✅ Readable font sizes

---

## 🔧 CUSTOMIZATION

### Changing Colors

Edit the gradient in each template:

```typescript
// Change from purple to blue
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// to
background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
```

### Adding New Templates

```typescript
// Add to EMAIL_TEMPLATES object
new_template: {
  id: 'new_template',
  name: 'New Template Name',
  category: 'booking',
  subject: 'Subject with {{variable}}',
  body: `<div>HTML content with {{variable}}</div>`,
  variables: ['variable1', 'variable2']
}
```

### Multi-Language Support

```typescript
// Add language property
export const EMAIL_TEMPLATES_SL: Record<string, EmailTemplate> = {
  welcome: {
    ...EMAIL_TEMPLATES.welcome,
    language: 'sl',
    subject: 'Dobrodošli v {{property_name}}!'
  }
};

export const EMAIL_TEMPLATES_DE: Record<string, EmailTemplate> = {
  welcome: {
    ...EMAIL_TEMPLATES.welcome,
    language: 'de',
    subject: 'Willkommen im {{property_name}}!'
  }
};
```

---

## 📈 BEST PRACTICES

### 1. Personalization

Always use guest name and property-specific information:

```typescript
renderEmailTemplate('welcome', {
  guest_name: guest.name, // ✅ Personalized
  property_name: property.name, // ✅ Property-specific
  // ... other variables
});
```

### 2. Timing

Send emails at appropriate times:

- **Welcome:** Immediately after booking
- **Pre-Arrival:** 1 day before check-in at 10:00
- **Post-Stay:** 1 day after checkout at 12:00
- **Payment:** Immediately after payment

### 3. Testing

Always test templates before sending:

```typescript
// Test template rendering
const test = renderEmailTemplate('welcome', {
  guest_name: 'Test Guest',
  property_name: 'Test Property',
  // ... all variables
});

console.log(test.subject);
console.log(test.body);
```

### 4. Variables

Always provide all required variables:

```typescript
// ✅ Good
renderEmailTemplate('welcome', {
  guest_name: 'John',
  property_name: 'Villa',
  // ... all 12 variables
});

// ❌ Bad - missing variables
renderEmailTemplate('welcome', {
  guest_name: 'John'
  // Missing 11 variables!
});
```

---

## 🔍 TROUBLESHOOTING

### Template Not Found

**Error:** `Template xyz not found`

**Solution:** Check template ID spelling:
```typescript
// ✅ Correct
renderEmailTemplate('welcome', variables);

// ❌ Incorrect
renderEmailTemplate('Welcome', variables);
```

### Variable Not Replaced

**Error:** `{{variable_name}}` appears in output

**Solution:** Check variable name spelling:
```typescript
// ✅ Correct
renderEmailTemplate('welcome', { guest_name: 'John' });

// ❌ Incorrect - variable name mismatch
renderEmailTemplate('welcome', { guestName: 'John' });
```

---

## 📞 SUPPORT

**Issues:** GitHub Issues  
**Documentation:** `/docs/email-templates`  
**Contact:** support@agentflow.pro

---

**Last Updated:** 2026-03-09  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
