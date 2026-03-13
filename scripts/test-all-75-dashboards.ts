/**
 * Test all 75 dashboard URLs
 * Captures screenshots and checks if pages load
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3002";

// All 75 dashboard URLs
const DASHBOARDS = [
  // Main
  "/dashboard",
  "/dashboard/director",
  
  // Tourism Hub (30)
  "/dashboard/tourism",
  "/dashboard/tourism/calendar",
  "/dashboard/tourism/inbox",
  "/dashboard/tourism/guest-communication",
  "/dashboard/tourism/generate",
  "/dashboard/tourism/bulk-generate",
  "/dashboard/tourism/templates",
  "/dashboard/tourism/email",
  "/dashboard/tourism/notifications",
  "/dashboard/tourism/landing",
  "/dashboard/tourism/seo",
  "/dashboard/tourism/seo/search-console-setup",
  "/dashboard/tourism/dynamic-pricing",
  "/dashboard/tourism/revenue",
  "/dashboard/tourism/competitors",
  "/dashboard/tourism/eturizem-settings",
  "/dashboard/tourism/booking-com",
  "/dashboard/tourism/pms-connections",
  "/dashboard/tourism/analytics",
  "/dashboard/tourism/data-cleanup",
  "/dashboard/tourism/translate",
  "/dashboard/tourism/itineraries",
  "/dashboard/tourism/properties",
  "/dashboard/tourism/use-cases",
  "/dashboard/tourism/voice-assistant",
  "/dashboard/tourism/photo-analysis",
  "/dashboard/tourism/sustainability",
  "/dashboard/tourism/messages",
  "/dashboard/tourism/owner",
  
  // Properties (8)
  "/dashboard/properties",
  "/dashboard/properties/create",
  "/dashboard/properties/[id]",
  "/dashboard/properties/[id]/rooms",
  "/dashboard/properties/[id]/amenities",
  "/dashboard/properties/[id]/pricing",
  "/dashboard/properties/[id]/blocked-dates",
  "/dashboard/properties/[id]/policies",
  "/dashboard/properties/[id]/integrations",
  
  // Receptor (8)
  "/dashboard/receptor",
  "/dashboard/receptor/quick-reservation",
  "/dashboard/receptor/calendar",
  "/dashboard/receptor/arrivals",
  "/dashboard/receptor/departures",
  "/dashboard/receptor/real-time-rooms",
  "/dashboard/receptor/rooms",
  "/dashboard/receptor/guests/search",
  
  // Reservations (5)
  "/dashboard/reservations",
  "/dashboard/reservations/[id]",
  "/dashboard/reservations/check-in",
  "/dashboard/reservations/check-out",
  "/dashboard/reservations/payments",
  
  // Rooms (4)
  "/dashboard/rooms",
  "/dashboard/rooms/[id]",
  "/dashboard/rooms/housekeeping",
  "/dashboard/rooms/maintenance",
  
  // AI & Workflow (4)
  "/dashboard/workflows",
  "/dashboard/workflows/builder",
  "/dashboard/mcp-builder",
  "/dashboard/chat",
  
  // Analytics (6)
  "/dashboard/insights",
  "/dashboard/reports/occupancy",
  "/dashboard/reports/revenue",
  "/dashboard/reports/guests",
  "/dashboard/content-quality",
  "/dashboard/ab-tests",
  "/dashboard/audit-log",
  
  // Settings (4)
  "/dashboard/settings",
  "/dashboard/settings/brand-voice",
  "/dashboard/settings/sso",
  "/dashboard/organizations",
  
  // Other (10)
  "/dashboard/escalations",
  "/dashboard/approvals",
  "/dashboard/page-builder",
  "/dashboard/seo-tools",
  "/dashboard/workflows/page.tsx",
  "/dashboard/approvals/page.tsx",
  "/dashboard/ab-tests/page.tsx",
  "/dashboard/audit-log/page.tsx",
  "/dashboard/chat/page.tsx",
  "/dashboard/content-quality/page.tsx",
];

const OUTPUT_DIR = path.join(process.cwd(), "screenshots", "dashboard-test");

async function testDashboard(page, url) {
  const cleanUrl = url.replace(/\[id\]/g, "1"); // Replace dynamic params
  
  try {
    await page.goto(`${BASE_URL}${cleanUrl}`, { 
      waitUntil: "domcontentloaded",
      timeout: 10000 
    });
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);
    
    // Check for errors
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes("Error") || 
             document.body.innerText.includes("404") ||
             document.body.innerText.includes("Not Found");
    });
    
    // Get page title
    const title = await page.title();
    
    // Take screenshot
    const screenshotName = cleanUrl.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const screenshotPath = path.join(OUTPUT_DIR, `${screenshotName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    return {
      url: cleanUrl,
      status: hasError ? "error" : "ok",
      title: title.substring(0, 50),
      screenshot: screenshotPath,
      error: hasError ? "Page contains error text" : null
    };
    
  } catch (error) {
    return {
      url: cleanUrl,
      status: "error",
      title: "N/A",
      screenshot: null,
      error: error.message
    };
  }
}

async function main() {
  console.log("🚀 Testing all 75 dashboards...\n");
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  const results = [];
  
  for (let i = 0; i < DASHBOARDS.length; i++) {
    const url = DASHBOARDS[i];
    console.log(`[${i + 1}/${DASHBOARDS.length}] Testing ${url}...`);
    
    const result = await testDashboard(page, url);
    results.push(result);
    
    if (result.status === "ok") {
      console.log(`  ✅ OK - ${result.title}`);
    } else {
      console.log(`  ❌ ERROR - ${result.error}`);
    }
  }
  
  await browser.close();
  
  // Generate report
  const ok = results.filter(r => r.status === "ok");
  const errors = results.filter(r => r.status === "error");
  
  console.log("\n\n📊 RESULTS SUMMARY");
  console.log("=" .repeat(60));
  console.log(`✅ Working: ${ok.length}/${results.length}`);
  console.log(`❌ Errors: ${errors.length}/${results.length}`);
  console.log(`📊 Success Rate: ${Math.round((ok.length / results.length) * 100)}%`);
  
  if (errors.length > 0) {
    console.log("\n❌ FAILED DASHBOARDS:");
    errors.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.url}`);
      console.log(`     Error: ${r.error}`);
    });
  }
  
  // Save report
  const reportPath = path.join(OUTPUT_DIR, "test-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Report saved to: ${reportPath}`);
  
  // Save markdown summary
  const mdPath = path.join(OUTPUT_DIR, "DASHBOARD-TEST-RESULTS.md");
  let md = `# Dashboard Test Results\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- ✅ Working: ${ok.length}/${results.length}\n`;
  md += `- ❌ Errors: ${errors.length}/${results.length}\n`;
  md += `- 📊 Success Rate: ${Math.round((ok.length / results.length) * 100)}%\n\n`;
  
  md += `## Working Dashboards\n\n`;
  ok.forEach((r, i) => {
    md += `${i + 1}. **${r.url}** - ${r.title}\n`;
  });
  
  md += `\n## Failed Dashboards\n\n`;
  errors.forEach((r, i) => {
    md += `${i + 1}. **${r.url}**\n`;
    md += `   - Error: ${r.error}\n`;
  });
  
  fs.writeFileSync(mdPath, md);
  console.log(`📄 Markdown saved to: ${mdPath}`);
}

main().catch(console.error);
