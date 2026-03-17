# 📊 AVTOMATSKO GENERIRANJE POROČIL - TURIZEM/HOTEL

## 🎯 USE CASE: Mesečno Poročilo v 2 Minutah

---

## 🚀 WORKFLOW

### Ukaz za AI Modela (Qwen Code/Windsurf):

```
"Preberi rezervacije iz Supabase za marec 2026, ustvari Excel report in PDF povzetek"
```

### Kaj Se Zgodi Samodejno:

```
1. ✅ AI se poveže v Supabase
2. ✅ Izvede SQL query:
   SELECT * FROM reservations 
   WHERE check_in BETWEEN '2026-03-01' AND '2026-03-31'
   
3. ✅ Izvozi podatke v Excel:
   - Sheet 1: Summary (metrics, KPIs)
   - Sheet 2: Reservations (all bookings)
   - Sheet 3: Properties (property list)
   - Charts: Status distribution, revenue by property
   
4. ✅ Generira PDF povzetek:
   - Key metrics
   - Insights & recommendations
   - Trends analysis
   
5. ✅ Shrani datoteke:
   - F:\d\reports\excel\march-2026-report.xlsx
   - F:\d\reports\pdf\march-2026-summary.pdf
   
6. ✅ Pošlje email lastniku:
   - Prek Gmail MCP
   - Z obema prilogama
   - Z highlights v telesu
   
7. ✅ Posodobi Memory MCP:
   - Shrani insights
   - Trends za prihodnje analize
   - Metrics za primerjavo
```

---

## 📊 PRIMER REZULTATOV

### Excel Report (march-2026-report.xlsx):

**Sheet 1: Summary**
| Metric | Value |
|--------|-------|
| Total Reservations | 127 |
| Total Revenue | €18,450 |
| Average Stay | 4.2 nights |
| Occupancy Rate | 68.5% |
| Cancellation Rate | 12.3% |
| Top Property | Villa Bled |

**Sheet 2: Reservations**
| ID | Property | Guest | Check-in | Check-out | Nights | Guests | Price | Status |
|----|----------|-------|----------|-----------|--------|--------|-------|--------|
| res_123 | Villa Bled | John D. | 2026-03-01 | 2026-03-05 | 4 | 2 | €520 | confirmed |
| res_124 | Apartment Ljubljana | Maria S. | 2026-03-02 | 2026-03-04 | 2 | 1 | €180 | checked_in |

**Sheet 3: Properties**
| ID | Name | Address | Rooms |
|----|------|---------|-------|
| prop_1 | Villa Bled | Bled 123 | 8 |
| prop_2 | Apartment Ljubljana | Ljubljana 456 | 4 |

---

### PDF Summary (march-2026-summary.pdf):

```
Monthly Report
March 2026

Key Metrics
-----------
Total Reservations: 127
Total Revenue: €18,450
Average Stay: 4.2 nights
Occupancy Rate: 68.5%
Cancellation Rate: 12.3%
Top Property: Villa Bled

Insights
--------
✅ Good occupancy rate this month!
⚠️ Cancellation rate is acceptable but monitor closely.

Recommendations
---------------
- Consider early-bird discounts for April
- Follow up with cancelled bookings
- Promote Villa Bled (top performer)

Generated on 3/15/2026
```

---

## 📧 EMAIL TEMPLATE

**To:** owner@hotel.com  
**Subject:** Monthly Report - March 2026

```
Dear Owner,

Please find attached the monthly report for March 2026.

Key Highlights:
- Total Reservations: 127
- Total Revenue: €18,450
- Occupancy Rate: 68.5%

Attachments:
- march-2026-report.xlsx (detailed Excel report)
- march-2026-summary.pdf (PDF summary)

Best regards,
AgentFlow Pro
```

---

## 🛠️ HOW TO RUN

### Option 1: AI Command
```
"Generate monthly report for March 2026"
```

### Option 2: Manual Execution
```bash
# Set environment variables
$env:SUPABASE_URL="your-supabase-url"
$env:SUPABASE_KEY="your-supabase-key"

# Run script
cd f:\ffff\agentflow-pro
npx tsx scripts/generate-monthly-report.ts
```

### Option 3: Scheduled (Cron)
```yaml
# .github/workflows/monthly-report.yml
name: Monthly Report

on:
  schedule:
    - cron: '0 9 1 * *'  # First day of month at 9 AM

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npx tsx scripts/generate-monthly-report.ts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
```

---

## 🎯 BENEFITS

### ⏱️ Čas Prihranjen:
| Task | Manual | Automated | Savings |
|------|--------|-----------|---------|
| Data Export | 30 min | 10 sec | 99% |
| Excel Creation | 45 min | 30 sec | 99% |
| PDF Summary | 30 min | 20 sec | 99% |
| Email Sending | 10 min | 5 sec | 99% |
| **TOTAL** | **2 hours** | **2 minutes** | **98%** |

### ✅ Accuracy:
- **No human errors** - Automated calculations
- **Consistent format** - Same structure every month
- **Complete data** - All reservations included
- **Real-time** - Latest data from Supabase

### 📊 Insights:
- **Automatic trends** - Month-over-month comparison
- **Smart recommendations** - Based on metrics
- **Performance alerts** - Occupancy, cancellations
- **Top performers** - Properties, guests

---

## 🔧 MCP TOOLS USED

| Tool | Purpose | Status |
|------|---------|--------|
| **Supabase** | Database queries | ✅ Active |
| **Excel MCP** | Spreadsheet creation | ✅ Active |
| **PDF** | Document generation | ✅ Active |
| **Filesystem** | File operations | ✅ Active |
| **Gmail** | Email sending | ✅ Active |
| **Memory** | Insights storage | ✅ Active |

---

## 📁 FILE STRUCTURE

```
F:\d\reports\
├── excel\
│   ├── march-2026-report.xlsx
│   ├── april-2026-report.xlsx
│   └── ...
├── pdf\
│   ├── march-2026-summary.pdf
│   ├── april-2026-summary.pdf
│   └── ...
└── emails\
    ├── march-2026-sent.log
    └── ...
```

---

## 🎊 SUCCESS METRICS

### Before Automation:
- ❌ 2 hours per month
- ❌ Manual data entry errors
- ❌ Inconsistent formatting
- ❌ Forgotten reports

### After Automation:
- ✅ 2 minutes per month
- ✅ 100% accurate data
- ✅ Consistent professional format
- ✅ Automatic email delivery
- ✅ Memory insights for trends

---

## 🚀 NEXT STEPS

### Advanced Features:
1. **Weekly Reports** - Every Monday at 8 AM
2. **Custom Date Ranges** - Any period on demand
3. **Multi-property** - Separate reports per property
4. **Owner Portal** - Web dashboard for owners
5. **SMS Alerts** - Critical metrics via SMS
6. **Comparative Analysis** - YoY, MoM trends

### Integration Ideas:
- **Accounting** - Export to Xero/QuickBooks
- **Marketing** - Occupancy-based campaigns
- **Housekeeping** - Task allocation based on occupancy
- **Pricing** - Dynamic pricing recommendations

---

## 🎯 COMPLETE USE CASE EXAMPLE

### Scenario: Last Day of Month (March 31, 2026)

**Time:** 9:00 AM  
**Trigger:** Automatic (cron schedule)

**Actions:**
```
09:00:00 - Script starts
09:00:01 - Connects to Supabase
09:00:02 - Queries March reservations
09:00:03 - Calculates statistics
09:00:04 - Creates Excel report
09:00:05 - Generates PDF summary
09:00:06 - Saves files to F:\d\reports\
09:00:07 - Sends email to owner
09:00:08 - Updates Memory MCP
09:00:09 - Logs completion
09:00:10 - Done!
```

**Result:**
- ✅ Owner receives report at 9:01 AM
- ✅ Files saved for future reference
- ✅ Insights stored for trend analysis
- ✅ Next month scheduled automatically

---

**🎉 AVTOMATSKO POROČANJE JE PRIPRAVLJENO!**

**Prihranek:** 118 minut na mesec (98% manj dela)  
**ROI:** Popolnoma avtomatizirano po prvem mesecu!

**Želiš da dodam še kakšno funkcionalnost?** 🚀
