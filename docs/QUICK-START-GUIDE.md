# 🚀 AGENTFLOW PRO - QUICK START GUIDE

**Začni danes (1 ura dela)** → **Launch v 90 dneh**

---

## ⚡ CRITICAL PATH (Next 7 Days)

### **DAY 1 (Danes - 15.03): SET UP TRACKING** ✅
**Time: 30 min**

```
✅ DONE:
- PROJECT-MASTER-TRACKER.md created
- WEEK-12-2026-03-16.md created
- FEATURE-TRACKER.csv created
- TRACKING-SYSTEM-NAVODILA.md created

NEXT:
- Read P0 priorities in tracker (10 min)
- Confirm Top 3 priorities for this week (5 min)
```

---

### **DAY 2 (Jutri - 16.03): PREPARE OTA APPLICATIONS**
**Time: 2 hours**

**Booking.com Application (60 min):**

1. **Gather Required Info:**
   ```
   □ Company Name: [Your company name]
   □ Company Registration: [ID number]
   □ Address: [Your address]
   □ Website: [agentflow.pro or landing page]
   □ Number of Properties: [Target: 10-20 pilot]
   □ Technical Contact: [Your name + email]
   □ Property Examples: [3-5 Slovenian hotels]
   ```

2. **Prepare Answers:**
   ```
   Q: How many rooms do you manage?
   A: "Starting with 10-20 pilot properties in Slovenia (50-500 rooms total), 
       targeting 100+ properties in Year 1"
   
   Q: What connectivity do you need?
   A: "Two-way XML connectivity for real-time availability, rates, and reservations"
   
   Q: What is your technical setup?
   A: "Cloud-based PMS with REST API, built on Next.js with PostgreSQL database"
   ```

3. **Submit Application:**
   - URL: https://www.booking.com/connectivitypartners
   - Time: 30-45 min to fill form
   - Approval: 4-8 weeks

**Airbnb Application (60 min):**

1. **Gather Required Info:**
   ```
   □ Business License: [Your registration]
   □ Property Examples: [3-5 properties]
   □ API Use Case: [Why you need API]
   □ Technical Contact: [Your name + email]
   ```

2. **Prepare Answers:**
   ```
   Q: Describe your business
   A: "AI-powered PMS for small hotels and camps in Slovenia, 
       helping properties increase direct bookings and automate operations"
   
   Q: How will you use the API?
   A: "Two-way synchronization for availability, bookings, and guest data 
       to prevent overbooking and streamline operations"
   ```

3. **Submit Application:**
   - URL: https://www.airbnb.com/d/developer-platform
   - Time: 30-45 min to fill form
   - Approval: 4-8 weeks

---

### **DAY 3 (17.03): START CRITICAL FEATURES**
**Time: 4 hours**

**Tax Reporting (120 min):**

1. **Research Requirements (30 min):**
   ```
   □ Tourist tax rates by municipality (Ljubljana, Bled, etc.)
   □ VAT (DDV) rates for Slovenia
   □ Monthly reporting format (eDavki)
   □ Due dates for submission
   ```

2. **Design Database Schema (30 min):**
   ```prisma
   model TouristTax {
     id String @id @default(cuid())
     municipality String
     ratePerPersonPerNight Decimal
     effectiveFrom DateTime
     effectiveTo DateTime?
   }
   
   model TaxReport {
     id String @id @default(cuid())
     propertyId String
     month DateTime
     totalNights Int
     totalGuests Int
     touristTaxAmount Decimal
     vatAmount Decimal
     status String // draft, submitted, paid
     submittedAt DateTime?
   }
   ```

3. **Implement Calculation Logic (60 min):**
   ```typescript
   // src/lib/tourism/tax-calculation.ts
   export function calculateTouristTax(
     municipality: string,
     nights: number,
     guests: number
   ): number {
     // Implementation
   }
   
   export function calculateVAT(amount: number): number {
     return amount * 0.22; // 22% Slovenian VAT
   }
   ```

**Invoicing System (120 min):**

1. **Design Invoice Template (30 min):**
   ```
   □ Company header (logo, address, registration)
   □ Guest/Company billing info
   □ Invoice items (accommodation, tax, extras)
   □ Payment terms, due date
   □ QR code for payment (Slovenian standard)
   ```

2. **Implement PDF Generation (60 min):**
   ```typescript
   // src/lib/invoices/generate-invoice.ts
   export async function generateInvoicePDF(invoiceId: string): Promise<Buffer> {
     // Use pdfkit or @react-pdf/renderer
     // Generate PDF with Slovenian tax requirements
   }
   ```

3. **Add Email Delivery (30 min):**
   ```typescript
   // src/lib/invoices/send-invoice.ts
   export async function sendInvoiceToGuest(invoiceId: string): Promise<void> {
     // Generate PDF
     // Send via SendGrid/Resend
     // Log in database
   }
   ```

---

### **DAY 4-5 (18.-19.03): CONTINUE DEVELOPMENT**
**Time: 8 hours**

**Complete Tax Reporting (240 min):**
```
□ Add tax rates for all Slovenian municipalities
□ Create monthly report generation
□ Add eDavki export format
□ Test with pilot property data
□ Write documentation
```

**Complete Invoicing (240 min):**
```
□ Implement recurring invoices (monthly stays)
□ Add payment tracking (paid/unpaid/overdue)
□ Create invoice dashboard for properties
□ Add credit notes for refunds
□ Test with real property scenarios
```

---

### **DAY 6-7 (20.-21.03): WRAP UP & REVIEW**
**Time: 4 hours**

**Friday Review (60 min):**
```
□ Review what was completed
□ Update PROJECT-MASTER-TRACKER.md
□ Fill out WEEK-12 review section
□ Rate week (1-5 stars)
□ Plan next week priorities
```

**OTA Application Follow-up (30 min):**
```
□ Confirm Booking.com application submitted
□ Confirm Airbnb application submitted
□ Note approval timeline (4-8 weeks)
□ Set calendar reminder for follow-up
```

**Weekend Prep (90 min):**
```
□ Read 1 competitor analysis (Cloudbeds, RoomRaccoon)
□ Review pilot property list (identify 10 targets)
□ Prepare demo environment for pilots
□ Rest! 🛌
```

---

## 📊 WEEK 1 SUCCESS METRICS

### **Must Have (By Friday 20.03):**
- ✅ Booking.com application submitted
- ✅ Airbnb application submitted
- ✅ Tax reporting module complete
- ✅ Invoicing system complete
- ✅ Weekly review completed

### **Nice to Have:**
- ⭐ Mobile app setup started
- ⭐ Housekeeping module started
- ⭐ 3 pilot properties identified
- ⭐ Demo environment ready

### **Metrics:**
- Tasks Completed: 8/10
- Hours Invested: 15-20 hours
- Blockers Resolved: 0 (no blockers expected)

---

## 🎯 WEEK 2 PREVIEW (23.-29.03)

**Top 3 Priorities:**
1. Start mobile app MVP (React Native or PWA)
2. Complete housekeeping task management
3. Recruit first pilot property (1/10)

**Estimated Time:** 20-25 hours

---

## 🚨 COMMON BLOCKERS & SOLUTIONS

### **Blocker 1: "Don't have time this week"**
**Solution:** 
- Start with just OTA applications (2 hours)
- Delegate tax reporting to next week
- Focus on revenue-generating tasks first

### **Blocker 2: "OTA application too complex"**
**Solution:**
- Use templates provided above
- Keep answers simple and honest
- Can revise answers later if needed
- Most important: SUBMIT (don't overthink)

### **Blocker 3: "Don't know Slovenian tax rates"**
**Solution:**
- Research: https://www.gov.si/en/topics/tourist-tax/
- Call local tourism association
- Ask pilot properties (they know their rates)
- Start with Ljubljana/Bled rates (most common)

### **Blocker 4: "Technical implementation too hard"**
**Solution:**
- Break into smaller tasks (<2 hours each)
- Use AI coding assistant (I'm here!)
- Start with MVP (basic calculation, simple PDF)
- Iterate based on pilot feedback

---

## 📞 SUPPORT & RESOURCES

### **When You Get Stuck:**

**Technical Questions:**
- Ask in chat (I'm here to help!)
- Check PROJECT-MASTER-TRACKER.md
- Review feature requirements

**Business Questions:**
- Review competitor analysis
- Check pilot property feedback
- Research Slovenian regulations

**Motivation:**
- Review "Why" (€111k/year opportunity)
- Celebrate small wins daily
- Remember: 90 days to launch!

---

## 🎉 CELEBRATE WINS!

**End of Week 1:**
- If all P0 tasks done: 🍕 Order pizza!
- If OTA apps submitted: 🍾 Open champagne!
- If tracker used daily: ⭐ Gold star!

**Remember:**
> "The journey of a thousand miles begins with a single step."
> 
> **You just took that step! 🚀**

---

## ✅ CHECKLIST FOR TODAY (15.03)

**Time: 30 min**

```
□ Read this QUICK START guide (10 min)
□ Open PROJECT-MASTER-TRACKER.md (5 min)
□ Review P0 priorities (5 min)
□ Confirm Week 12 Top 3 priorities (5 min)
□ Set calendar events:
  □ Monday 9:00 AM (Weekly Planning)
  □ Friday 4:00 PM (Weekly Review)
□ Prepare for tomorrow:
  □ Block 2 hours for OTA applications
  □ Gather company info
  □ Gather property examples
□ DONE! ✅
```

---

**Next Update: Tomorrow (16.03) - OTA Application Day**

**Questions? Ask anytime! 🚀**

---

*Created: 2026-03-15*  
*Version: 1.0*  
*Status: Active*
