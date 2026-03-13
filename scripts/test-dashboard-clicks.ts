/**
 * Interactive Dashboard Test with Playwright
 * Clicks all buttons and checks if pages load
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3002';
const OUTPUT_DIR = path.join(process.cwd(), 'screenshots', 'click-test');

async function main() {
  console.log('🎯 Testing Dashboard Interactions...\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down for observation
  });
  
  const page = await browser.newPage({ 
    viewport: { width: 1920, height: 1080 } 
  });
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });
  
  // Enable request logging
  page.on('requestfailed', request => {
    console.log(`❌ Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });
  
  // Navigate to dashboard
  console.log('📍 Navigating to dashboard...');
  await page.goto(BASE_URL + '/dashboard', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, '00-dashboard-initial.png'),
    fullPage: true 
  });
  
  console.log('✅ Dashboard loaded\n');
  
  // Test 1: Click sidebar navigation
  console.log('🖱️  Testing Sidebar Navigation...');
  
  const sidebarLinks = [
    { name: 'Pregled', selector: 'a:has-text("Pregled")' },
    { name: 'Koledar', selector: 'a:has-text("Koledar")' },
    { name: 'Ustvari', selector: 'a:has-text("Ustvari")' },
    { name: 'Vsebina', selector: 'a:has-text("Vsebina")' },
    { name: 'Nastavitve', selector: 'a:has-text("Nastavitve")' },
  ];
  
  for (const link of sidebarLinks) {
    try {
      console.log(`  Clicking: ${link.name}...`);
      
      const element = page.locator(link.selector).first();
      const isVisible = await element.isVisible();
      
      if (!isVisible) {
        console.log(`  ⚠️  ${link.name} not visible, skipping`);
        continue;
      }
      
      await element.click();
      await page.waitForTimeout(2000);
      
      // Check if URL changed
      const currentUrl = page.url();
      console.log(`  ✅ ${link.name} clicked - URL: ${currentUrl}`);
      
      // Take screenshot
      await page.screenshot({ 
        path: path.join(OUTPUT_DIR, `01-${link.name.toLowerCase()}.png`),
        fullPage: true 
      });
      
    } catch (error) {
      console.log(`  ❌ ${link.name} failed: ${error.message}`);
    }
  }
  
  // Test 2: Click top navigation
  console.log('\n🖱️  Testing Top Navigation...');
  
  const topButtons = [
    { name: 'Nova rezervacija', selector: 'button:has-text("Nova rezervacija"), a:has-text("Nova rezervacija")' },
    { name: 'Sporočila', selector: 'button:has-text("Sporočila"), a:has-text("Sporočila")' },
    { name: 'Housekeeping', selector: 'button:has-text("Housekeeping"), a:has-text("Housekeeping")' },
  ];
  
  for (const btn of topButtons) {
    try {
      console.log(`  Clicking: ${btn.name}...`);
      
      const element = page.locator(btn.selector).first();
      const isVisible = await element.isVisible();
      
      if (!isVisible) {
        console.log(`  ⚠️  ${btn.name} not visible, skipping`);
        continue;
      }
      
      await element.click();
      await page.waitForTimeout(2000);
      
      console.log(`  ✅ ${btn.name} clicked`);
      
      // Take screenshot
      await page.screenshot({ 
        path: path.join(OUTPUT_DIR, `02-${btn.name.toLowerCase().replace(/ /g, '-')}.png`),
        fullPage: true 
      });
      
    } catch (error) {
      console.log(`  ❌ ${btn.name} failed: ${error.message}`);
    }
  }
  
  // Test 3: Click KPI cards
  console.log('\n🖱️  Testing KPI Cards...');
  
  const kpiCards = await page.locator('[class*="card"], [class*="kpi"], div:has-text("Occupancy"), div:has-text("RevPAR")').all();
  console.log(`  Found ${kpiCards.length} KPI cards`);
  
  for (let i = 0; i < Math.min(kpiCards.length, 3); i++) {
    try {
      console.log(`  Clicking KPI card ${i + 1}...`);
      await kpiCards[i].click();
      await page.waitForTimeout(1000);
      console.log(`  ✅ KPI card ${i + 1} clicked`);
    } catch (error) {
      console.log(`  ❌ KPI card ${i + 1} failed: ${error.message}`);
    }
  }
  
  // Test 4: Check for modals/popups
  console.log('\n🖱️  Checking for Modals/Popups...');
  
  const modal = await page.locator('[role="dialog"], [class*="modal"], [class*="popup"]').isVisible();
  if (modal) {
    console.log('  ℹ️  Modal is open');
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '03-modal-open.png'),
      fullPage: true 
    });
    
    // Try to close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    console.log('  ✅ Modal closed with Escape');
  } else {
    console.log('  ℹ️  No modal open');
  }
  
  // Test 5: Check for JavaScript errors
  console.log('\n🔍 Checking for JavaScript Errors...');
  
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`  ❌ JS Error: ${error.message}`);
  });
  
  // Refresh page and check for errors
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Found ${errors.length} JavaScript errors!`);
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  } else {
    console.log('  ✅ No JavaScript errors');
  }
  
  // Final screenshot
  await page.screenshot({ 
    path: path.join(OUTPUT_DIR, '04-final-state.png'),
    fullPage: true 
  });
  
  // Generate report
  console.log('\n📊 TEST REPORT');
  console.log('='.repeat(60));
  console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
  console.log(`Total errors found: ${errors.length}`);
  console.log('\n✅ Test completed!');
  
  await browser.close();
}

main().catch(console.error);
