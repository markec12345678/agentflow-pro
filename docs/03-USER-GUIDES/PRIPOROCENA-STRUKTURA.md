# 🎯 PRIPOROČENA STRUKTURA ZA AGENTFLOW PRO

Na podlagi analize 20+ najboljših sistemov za hotele, campinge in turistične kmetije.

---

## 📐 KONČNA HIERARHIJA (Po vzoru Cloudbeds + Guesty)

### **Level 1: Main Navigation**
```
┌─────────────────────────────────────────────────────────┐
│  AgentFlow Pro                                          │
│  [Logo] [Dashboard] [Calendar] [Inbox] [Reports] [⚙️]   │
└─────────────────────────────────────────────────────────┘
```

### **Level 2: Sidebar Navigation**

#### Za Hotele/Apartmaje:
```
📊 Dashboard          (Overview s KPI-ji)
📅 Calendar           (Drag & Drop rezervacije)
👥 Guests            (Guest profiles, messages)
🧹 Housekeeping      (Task management)
💰 Rates & Inventory (Dynamic pricing)
📈 Reports           (Analytics)
⚙️ Settings          (Property setup)
```

#### Za Campinge:
```
📊 Dashboard
🗺️ Site Map          (Map view campgrounds)
📅 Calendar
👥 Guests
🏕️ Activities        (Bookable experiences)
🔧 Equipment         (Rentals)
💰 Rates
📈 Reports
⚙️ Settings
```

#### Za Turistične Kmetije:
```
📊 Dashboard
📅 Calendar
👥 Guests
🚜 Experiences       (Farm tours, workshops)
🛒 Shop              (Farm products)
🍽️ Restaurant        (Table reservations)
💰 Rates
📈 Reports
⚙️ Settings
```

---

## 🏠 DASHBOARD STRUCTURE (Homepage)

### Layout:
```
┌──────────────────────────────────────────────────────────┐
│ Dobrodošel nazaj, [User]! 👋              [+ New Booking]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ Occupancy│ RevPAR   │ ADR      │ Direct   │ Tasks  │ │
│  │   78%    │ €142     │ €182     │   35%    │   12   │ │
│  │  ↑12%    │  ↑8%     │  ↓3%     │  ↑15%    │  ↑5%   │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
│                                                          │
│  ┌─────────────────────────┐ ┌─────────────────────────┐ │
│  │ 📅 Arrivals Today (3)   │ │ 🧹 Tasks (4)            │ │
│  │                         │ │                         │ │
│  │ John Smith - 14:00     │ │ ✓ Clean Room 201        │ │
│  │ Maria Garcia - 15:00   │ │ ⏳ Check-in: John Smith │ │
│  │ Thomas Mueller - 16:00 │ │ ⚠ Fix AC in Room 105    │ │
│  │                         │ │ ○ Restock minibar       │ │
│  └─────────────────────────┘ └─────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────┐ ┌─────────────────────────┐ │
│  │ 📤 Departures Today (2) │ │ 📊 Recent Activity      │ │
│  │                         │ │                         │ │
│  │ Anna Novak - 10:00     │ │ 📋 New booking 5min ago │ │
│  │ Pierre Dubois - 09:00  │ │ 💬 Message 15min ago    │ │
│  │                         │ │ ✅ Task completed       │ │
│  └─────────────────────────┘ └─────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 📅 KALENDAR STRUCTURE (Najpomembnejši!)

### View Options:
```
[Day] [Week] [Month] [Year] | [Room View] [Timeline] [Map]
```

### Features:
```
┌──────────────────────────────────────────────────────────┐
│ March 2026                    [+ New] [Bulk Import] [📤]│
├──────────────────────────────────────────────────────────┤
│ Legend: [🟦 Booking.com] [🟥 Airbnb] [🟩 Direct] [🟨 Other]│
├──────────────────────────────────────────────────────────┤
│ Room 101  │████████████████│░░░░░░░░│██████████████████│
│ Room 102  │░░░░░░░░░░░░░░░░│████████│██████████████████│
│ Room 103  │████████████████│████████│░░░░░░░░░░░░░░░░░░│
│ Room 104  │░░░░░░░░░░░░░░░░│░░░░░░░░│██████████████████│
│ Room 105  │████████████████│████████│██████████████████│
├──────────────────────────────────────────────────────────┤
│           │  1-10 Mar     │ 11-20 Mar│ 21-31 Mar        │
└──────────────────────────────────────────────────────────┘
```

### Interactions:
- ✅ **Drag** rezervacije za premik terminov
- ✅ **Click** za quick edit (popup modal)
- ✅ **Right-click** za context menu (cancel, move, copy)
- ✅ **Hover** za preview detailev
- ✅ **Color filter** po kanalih
- ✅ **Zoom** slider za timeline

---

## 📝 REZERVACIJA FORM (Step-by-Step)

### Modal/Drawer Layout:
```
┌─────────────────────────────────────────┐
│ New Reservation                    [X]  │
├─────────────────────────────────────────┤
│                                         │
│ Step 1: Guest Information               │
│ ┌─────────────────────────────────────┐ │
│ │ First Name *    │ Last Name *      │ │
│ │ Email *         │ Phone *          │ │
│ │ Country         │ ID/Passport      │ │
│ │ Special Requests                    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Step 2: Stay Details                    │
│ ┌─────────────────────────────────────┐ │
│ │ Check-in *    │ Check-out *        │ │
│ │ Guests: [2▼]  │ Rooms: [1▼]        │ │
│ │ Room Type: [Double Room▼]          │ │
│ │ Add-ons: [✓ Breakfast] [✓ Airport] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Step 3: Payment                         │
│ ┌─────────────────────────────────────┐ │
│ │ Total: €360                         │ │
│ │ Deposit: €100 (due now)             │ │
│ │ Payment: [Credit Card▼]             │ │
│ │ Invoice: [ ] Company                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Save Draft] [Cancel] [Confirm Booking]│
└─────────────────────────────────────────┘
```

---

## 🧹 HOUSEKEEPING BOARD

### Kanban Style:
```
┌──────────────────────────────────────────────────────────┐
│ Housekeeping                        [Auto-assign] [➕]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 🔴 DIRTY (5)        🟡 IN PROGRESS (2)   🟢 CLEAN (8)   │
│ ┌────────────────┐  ┌────────────────┐ ┌──────────────┐ │
│ │ Room 201       │  │ Room 305       │ │ Room 101     │ │
│ │ Check-out 10am │  │ Cleaning       │ │ Ready        │ │
│ │ Maria Garcia   │  │ Maria (2h)     │ │ Inspected    │ │
│ │ [Assign]       │  │ [Complete]     │ │ [Inspect]    │ │
│ └────────────────┘  └────────────────┘ └──────────────┘ │
│ ┌────────────────┐  ┌────────────────┐ ┌──────────────┐ │
│ │ Room 205       │  │ Room 410       │ │ Room 102     │ │
│ │ Stay-over      │  │ Deep Clean     │ │ Ready        │ │
│ └────────────────┘  └────────────────┘ └──────────────┘ │
│                                                          │
│ ⚠ MAINTENANCE (3)                                       │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Room 105 - AC not working - Assigned to Janez      │ │
│ │ Pool Area - Broken chair - Unassigned              │ │
│ │ Lobby - Light bulb - Assigned to Maria             │ │
│ └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 💰 DINAMIČNE CENE (AI-Powered)

### Interface:
```
┌──────────────────────────────────────────────────────────┐
│ Dynamic Pricing                         [AI Assistant ✨]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Current Recommendation: +15%                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ ⚡ Weekend demand is high (85% occupancy predicted)│  │
│ │ 💡 Suggested: Increase rates by 15% for next week  │  │
│ │ [Apply Recommendation] [Adjust Manually]           │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Seasonal Calendar                                        │
│ ┌────────────────────────────────────────────────────┐  │
│ │ March: €120-€180    ████████░░░░░░░░ 65% avg      │  │
│ │ April:  €140-€220   ██████████░░░░░░ 78% avg      │  │
│ │ May:    €160-€250   ████████████░░░░ 85% avg ⬆    │  │
│ │ June:   €180-€300   ██████████████░░ 92% avg ⬆    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Competitor Analysis                                      │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Your ADR: €182                                     │  │
│ │ Market Avg: €175                                   │  │
│ │ Position: +4% above market ✅                      │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 📊 REPORTS STRUCTURE

### Dashboard Style:
```
┌──────────────────────────────────────────────────────────┐
│ Reports                               [Export] [Schedule]│
├──────────────────────────────────────────────────────────┤
│ Tabs: [Overview] [Occupancy] [Revenue] [Channels] [Guests]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Occupancy Rate (Last 30 days)                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │      100% ┤                                        │  │
│ │       75% ┤    ████  ████                          │  │
│ │       50% ┤ ██ ██ ██ ██ ██  ██                     │  │
│ │       25% ┤ ██ ██ ██ ██ ██  ██ ██                  │  │
│ │        0% └────────────────────────────────────    │  │
│ │            1  5  10  15  20  25  30 (March)        │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Revenue by Channel                                       │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Booking.com    ████████████████████  45%  €12,450 │  │
│ │ Airbnb         ██████████████░░░░░░  32%  €8,920  │  │
│ │ Direct         ████████░░░░░░░░░░░░  18%  €5,040  │  │
│ │ Expedia        ████░░░░░░░░░░░░░░░░   5%  €1,400  │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Top Metrics                                              │
│ ┌──────────┬──────────┬──────────┬──────────┐           │
│ │ Occupancy│ ADR      │ RevPAR   │ Direct % │           │
│ │   78%    │ €182     │ €142     │   35%    │           │
│ │  ↑12%    │  ↓3%     │  ↑8%     │  ↑15%    │           │
│ └──────────┴──────────┴──────────┴──────────┘           │
└──────────────────────────────────────────────────────────┘
```

---

## 📱 MOBILE NAVIGATION (Bottom Bar)

### Za Hotele:
```
┌─────────────────────────────────┐
│  [📊]     [📅]     [➕]     [💬]     [⚙️]  │
│ Today  Calendar  New    Inbox  Settings │
└─────────────────────────────────┘
```

### Za Campinge:
```
┌─────────────────────────────────┐
│  [🗺️]     [📅]     [➕]     [🏕️]     [⚙️]  │
│ Map    Calendar  New    Activities Settings│
└─────────────────────────────────┘
```

### Za Turistične Kmetije:
```
┌─────────────────────────────────┐
│  [📊]     [📅]     [➕]     [🚜]     [⚙️]  │
│ Today  Calendar  New    Experiences Settings│
└─────────────────────────────────┘
```

---

## 🎨 DESIGN SYSTEM (Po vzoru Cloudbeds)

### Color Palette:
```
Primary:   #2563eb (Blue)     - Main actions, links
Success:   #10b981 (Green)    - Confirmed, clean, paid
Warning:   #f59e0b (Amber)    - Pending, check-in soon
Danger:    #ef4444 (Red)      - Cancelled, dirty, overdue
Info:      #3b82f6 (Light Blue) - Info, upcoming

Channels:
- Booking.com: #003580 (Dark Blue)
- Airbnb:      #FF5A5F (Coral)
- Expedia:     #191E3B (Navy)
- Direct:      #10b981 (Green)
```

### Typography:
```
Headings: Inter (Bold)
Body:     Inter (Regular)
Numbers:  JetBrains Mono (for rates, dates)
```

### Component Sizes:
```
Buttons:
- Large:  48px height (primary actions)
- Medium: 40px height (secondary)
- Small:  32px height (tables, filters)

Cards:
- KPI Cards:     120px height
- List Items:    64px height
- Calendar Row:  48px height
```

---

## ✅ IMPLEMENTATION PRIORITY

### Phase 1 (P0 - MVP):
1. ✅ Dashboard s KPI-ji
2. ✅ Calendar z drag & drop
3. ✅ Reservation form
4. ✅ Guest list
5. ✅ Basic housekeeping board

### Phase 2 (P1 - Core Features):
6. ✅ Dynamic pricing UI
7. ✅ Channel manager integration
8. ✅ Unified inbox
9. ✅ Reports dashboard
10. ✅ Mobile responsive

### Phase 3 (P2 - Advanced):
11. ✅ AI recommendations
12. ✅ Automated messaging
13. ✅ Task auto-assignment
14. ✅ Market comparison
15. ✅ Multi-property support

---

**To je tvoja končna struktura!** Vse ostalo so samo implementacijski detajli.
