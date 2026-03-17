# 🏨 AgentFlow Pro - Base + Module System

## 🎯 Concept

**One core for everyone + specialized modules by property type.**

---

## 📊 Structure:

### **Base Package (For Everyone)**
```
Price: €29/month
Includes:
✅ Booking management
✅ Calendar
✅ Guest database
✅ Basic statistics
✅ Email communication
✅ Pricing and availability
✅ eTurizem connection
✅ Basic content (AI)
```

### **Modules (Additional)**

#### 🏨 Hotel Module (+€15/month)
```
For: Hotels, guesthouses, boutique hotels
Features:
✅ Housekeeping management
✅ Room status (clean/dirty)
✅ Multi-property support
✅ Room service ordering
✅ Shift management
✅ Reports by floors
```

#### ⛺ Camp Module (+€15/month)
```
For: Campsites, glamping resorts
Features:
✅ Parcel management (A1, A2, B1...)
✅ Equipment (electricity, water, sewage)
✅ Daily rates by season
✅ Equipment reservation
✅ Sanitary facilities tracking
✅ Activities (bikes, boats...)
```

#### 🏡 Farm Module (+€15/month)
```
For: Tourist farms, wineries
Features:
✅ Activities (horseback riding, tastings)
✅ Product sales (cheese, wine, honey)
✅ Experience booking
✅ Restaurant/table
✅ Bike/activity rental
✅ Tour booking
```

#### 🏠 Apartment Module (+€10/month)
```
For: Apartments, rooms, studios
Features:
✅ Simplified interface
✅ Self check-in instructions
✅ Lock codes
✅ No housekeeping
✅ Simplified reports
```

---

## 💰 Pricing:

| Package | Price | Annual | Savings |
|---------|-------|--------|---------|
| **Base** | €29/month | €290 | 2 months free |
| **Base + Hotel** | €44/month | €440 | 2 months free |
| **Base + Camp** | €44/month | €440 | 2 months free |
| **Base + Farm** | €44/month | €440 | 2 months free |
| **Base + Apartment** | €39/month | €390 | 2 months free |
| **Base + All** | €69/month | €690 | 2 months free |

---

## 🎯 Onboarding Flow:

### Step 1: Sign Up
```
Email + Password
→
```

### Step 2: Property Type
```
"What type of property do you have?"

[🏨 Hotel]
[⛺ Camp]
[🏡 Farm]
[🏠 Apartment]
[Other]

→
```

### Step 3: Basic Info
```
Name: _______________
Location: _______________
Number of rooms/units: _______________

→
```

### Step 4: Customization
```
Based on type:

Hotel:
- Number of floors
- Housekeeping team size
- Room types

Camp:
- Number of parcels
- Connection types
- Season

Farm:
- Activities
- Product sales
- Restaurant

Apartment:
- Number of apartments
- Self check-in?

→
```

### Step 5: Complete!
```
✅ Account created
✅ Interface customized
✅ Recommended modules

[Go to Dashboard] [Add Modules]
```

---

## 📊 Dashboard Customizations:

### Base (Everyone Sees):
```
🏠 Overview
📅 Calendar
🏨 Properties
💰 Pricing
📊 Statistics
👥 Guests
⚙️ Settings
```

### + Hotel:
```
Additional:
🧹 Housekeeping
📊 By floors
🛎️ Room service
👥 Shifts
```

### + Camp:
```
Additional:
🏕️ Parcels
⚡ Equipment
📅 Seasonal calendar
🚴 Activities
```

### + Farm:
```
Additional:
🍷 Tastings
🐴 Activities
🧀 Sales
🍽️ Restaurant
```

### + Apartment:
```
Simplified:
- Fewer menus
- Self check-in instructions
- Simple statistics
```

---

## 🔧 Technical Implementation:

### Database Schema:
```prisma
model Property {
  id             String @id @default(cuid())
  propertyType   String // "hotel", "kamp", "kmetija", "apartma"
  modules        Json?  // ["housekeeping", "parcels", "activities"]
  // ... other fields
}
```

### UI Logic:
```typescript
// Show modules based on type
const showModule = (type: string, module: string) => {
  if (type === 'hotel' && module === 'housekeeping') return true;
  if (type === 'kamp' && module === 'parcels') return true;
  if (type === 'kmetija' && module === 'activities') return true;
  if (type === 'apartma') return false; // simplified
  return false;
};
```

---

## 📈 Upsell Strategy:

### During Onboarding:
```
1. User selects type
2. System recommends modules
3. 14-day trial for modules
4. After trial: upgrade or stay Base
```

### During Use:
```
1. Usage tracking
2. When limit reached → upgrade suggestion
3. Feature gating (some features locked)
4. "Upgrade to unlock" buttons
```

### Email Campaigns:
```
Day 1: Welcome + Base features
Day 3: Did you know? (Module features)
Day 7: Special offer (20% discount on modules)
Day 14: Trial ends tomorrow
Day 15: Upgrade now
```

---

## 🎯 Roadmap:

### Phase 1 (Now):
- ✅ Base system for everyone
- ✅ Property type in database
- ✅ Onboarding question
- ✅ Simple interface

### Phase 2 (1-2 months):
- ⏳ Hotel module
- ⏳ Camp module
- ⏳ Farm module
- ⏳ Apartment module

### Phase 3 (3-4 months):
- ⏳ Module pricing page
- ⏳ Upgrade flow
- ⏳ Usage tracking
- ⏳ Email automation

---

## ✅ Benefits:

```
✅ One codebase (Base)
✅ Can start immediately
✅ Add modules gradually
✅ Upsell opportunities
✅ Customizable for each user
✅ Not too complex at start
```

---

**Version:** 1.0.0
**Status:** ✅ Implementation starting
**Last Updated:** 2026-03-09
