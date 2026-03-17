# 📊 Dashboard Templates Documentation

**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 📋 OVERVIEW

Pre-built dashboard templates and widget components for role-based personalization.

### Features

- ✅ 18 widget templates
- ✅ 5 role-based dashboard templates
- ✅ Auto-refresh configuration
- ✅ Responsive grid layout
- ✅ Category organization
- ✅ Size configuration

---

## 📦 AVAILABLE WIDGETS

### Revenue Widgets (6)

| Type | Title | Refresh | Category |
|------|-------|---------|----------|
| `revenue_mtd` | Prihodki Ta Mesec | 5 min | revenue |
| `adr_trend` | ADR Trend | 10 min | revenue |
| `revpar` | RevPAR | 10 min | revenue |
| `revenue_forecast` | Forecast Prihodkov | 1 hr | revenue |
| `budget_vs_actual` | Budžet vs Dejansko | 1 hr | revenue |
| `occupancy_trend` | Trend Zasedenosti | 15 min | revenue |

### Operations Widgets (8)

| Type | Title | Refresh | Category |
|------|-------|---------|----------|
| `occupancy_rate` | Zasedenost | 5 min | operations |
| `today_arrivals` | Prihodi Danes | 1 min | operations |
| `today_departures` | Odhodi Danes | 1 min | operations |
| `room_status` | Status Sob | 30 sec | operations |
| `quick_actions` | Hitre Akcije | Manual | operations |
| `rooms_to_clean` | Sobe Za Čiščenje | 1 min | operations |
| `cleaning_progress` | Napredek Čiščenja | 1 min | operations |
| `staff_efficiency` | Efektivnost Osebja | 15 min | operations |

### Guest Widgets (3)

| Type | Title | Refresh | Category |
|------|-------|---------|----------|
| `guest_satisfaction` | Zadovoljstvo Gostov | 15 min | guests |
| `guest_requests` | Prošnje Gostov | 1 min | guests |
| `guest_demographics` | Demografija Gostov | 30 min | guests |

### Marketing Widgets (1)

| Type | Title | Refresh | Category |
|------|-------|---------|----------|
| `channel_performance` | Uspešnost Kanalov | 10 min | marketing |

---

## 📊 DASHBOARD TEMPLATES

### 1. Owner Dashboard

**Role:** owner  
**Widgets:** 9  
**Focus:** Financial KPIs

**Layout:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Revenue MTD │ Occupancy   │ ADR Trend   │ RevPAR      │
├─────────────┴─────────────┼─────────────┴─────────────┤
│ Channel Performance       │ Guest Satisfaction        │
├───────────────────────────┼───────────────────────────┤
│ Revenue Forecast          │ Budget vs Actual          │
├───────────────────────────┴───────────────────────────┤
│ Staff Efficiency                                      │
└───────────────────────────────────────────────────────┘
```

---

### 2. Director Dashboard

**Role:** director  
**Widgets:** 9  
**Focus:** Operational overview

**Layout:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Revenue MTD │ Occupancy   │ Arrivals    │ Departures  │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Forecast    │ Budget      │ Staff       │             │
├─────────────┴─────────────┴─────────────┤             │
│ Occupancy Trend                         │             │
├─────────────────────────────────────────┤             │
│ Guest Demographics                      │             │
└─────────────────────────────────────────┘             │
```

---

### 3. Receptor Dashboard

**Role:** receptor  
**Widgets:** 7  
**Focus:** Daily operations

**Layout:**
```
┌─────────────┬─────────────┬───────────────────────────┐
│ Arrivals    │ Departures  │ Room Status               │
├─────────────┼─────────────┤                           │
│ Quick Actions│ Occupancy  │                           │
├─────────────┼─────────────┤                           │
│ ADR Trend   │             │                           │
└─────────────┴─────────────┴───────────────────────────┘
```

---

### 4. Housekeeping Dashboard

**Role:** housekeeping  
**Widgets:** 4  
**Focus:** Cleaning tasks

**Layout:**
```
┌────────────────────────┬────────────────────────┐
│ Rooms To Clean         │ Cleaning Progress      │
├────────────────────────┴────────────────────────┤
│ Room Status                                     │
├─────────────────────────────────────────────────┤
│ Guest Requests                                  │
└─────────────────────────────────────────────────┘
```

---

### 5. Manager Dashboard

**Role:** manager  
**Widgets:** 8  
**Focus:** Combined overview

**Layout:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Revenue MTD │ Occupancy   │ Arrivals    │ Departures  │
├─────────────┴─────────────┼─────────────┴─────────────┤
│ Room Status               │ Guest Satisfaction        │
├───────────────────────────┼───────────────────────────┤
│ Quick Actions             │ Guest Requests            │
└───────────────────────────┴───────────────────────────┘
```

---

## 🚀 USAGE

### Create Dashboard from Template

```typescript
import { createDashboardFromTemplate } from '@/components/dashboard';

// Create owner dashboard
const dashboard = await createDashboardFromTemplate(
  'owner',
  'user-123',
  'property-456'
);
```

### Get Widgets for Role

```typescript
import { getWidgetsForRole } from '@/components/dashboard';

// Get all widgets for receptor
const widgets = getWidgetsForRole('receptor');

console.log(`Available widgets: ${widgets.length}`);
```

### Get Widget by Type

```typescript
import { getWidgetByType } from '@/components/dashboard';

// Get revenue MTD widget
const widget = getWidgetByType('revenue_mtd');

console.log(widget.title); // "Prihodki Ta Mesec"
console.log(widget.refreshInterval); // 300 (5 minutes)
```

### Get Widgets by Category

```typescript
import { getWidgetsByCategory } from '@/components/dashboard';

// Get all revenue widgets
const revenueWidgets = getWidgetsByCategory('revenue');

console.log(`Revenue widgets: ${revenueWidgets.length}`);
```

### Get Refresh Interval

```typescript
import { getWidgetRefreshInterval } from '@/components/dashboard';

// Get refresh interval in milliseconds
const interval = getWidgetRefreshInterval('room_status');

console.log(`Refresh every ${interval}ms`); // 30000ms (30 seconds)
```

---

## 🔧 CUSTOMIZATION

### Add New Widget

```typescript
// Add to WIDGET_TEMPLATES
new_widget: {
  type: 'new_widget',
  title: 'New Widget Title',
  description: 'Widget description',
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 2 },
  dataEndpoint: '/api/data/endpoint',
  refreshInterval: 300,
  category: 'revenue',
  icon: '📊',
  colorScheme: 'blue',
}
```

### Modify Dashboard Layout

```typescript
// Get template
const template = DASHBOARD_TEMPLATES['owner'];

// Modify widget positions
template.widgets[0].position = { x: 0, y: 0, w: 4, h: 2 };

// Add new widget
template.widgets.push({
  type: 'new_widget',
  position: { x: 0, y: 8, w: 6, h: 3 },
});
```

### Change Refresh Interval

```typescript
// Get widget
const widget = WIDGET_TEMPLATES['revenue_mtd'];

// Change from 5 min to 10 min
widget.refreshInterval = 600;
```

---

## 📈 WIDGET SIZING

### Grid System

- **Columns:** 12-column grid
- **Widget Width:** 2-6 columns
- **Widget Height:** 2-4 rows
- **Responsive:** Adjusts to screen size

### Size Guidelines

| Widget Type | Min Width | Default Width | Height |
|-------------|-----------|---------------|--------|
| KPI Cards | 2 | 3 | 2 |
| Charts | 3 | 4-6 | 3-4 |
| Lists | 3 | 6 | 3-4 |
| Tables | 4 | 6-12 | 3-4 |

---

## 🎯 BEST PRACTICES

### 1. Optimize Refresh Intervals

```typescript
// ✅ Good - Appropriate intervals
revenue_mtd: 300       // 5 min (financial data)
room_status: 30        // 30 sec (real-time)
guest_demographics: 1800 // 30 min (static data)

// ❌ Bad - Too frequent
revenue_mtd: 10        // 10 sec (unnecessary load)
```

### 2. Limit Widget Count

```typescript
// ✅ Good - 6-9 widgets per dashboard
widgets: [
  // 6-9 widgets
]

// ❌ Bad - Too many widgets
widgets: [
  // 20+ widgets (overwhelming)
]
```

### 3. Group Related Widgets

```typescript
// ✅ Good - Revenue widgets together
{ type: 'revenue_mtd', ... },
{ type: 'adr_trend', ... },
{ type: 'revpar', ... },

// ❌ Bad - Mixed categories
{ type: 'revenue_mtd', ... },
{ type: 'rooms_to_clean', ... },
{ type: 'adr_trend', ... },
```

---

## 📞 SUPPORT

**Issues:** GitHub Issues  
**Documentation:** `/docs/dashboard-templates`  
**Contact:** support@agentflow.pro

---

**Last Updated:** 2026-03-09  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
