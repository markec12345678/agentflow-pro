/**
 * Simple Playwright UI Test
 * Just checks if pages load and buttons are clickable
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3002';
const OUTPUT_DIR = path.join(process.cwd(), 'screenshots', 'ui-test');

async function main() {
  console.log('🎯 Simple UI Test...\n');
  
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({ 
    headless: true,
    slowMo: 500
  });
  
  const page = await browser.newPage({ 
    viewport: { width: 1920, height: 1080 } 
  });
  
  // Test 1: Homepage
  console.log('📍 Testing Homepage...');
  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log(`  ✅ Homepage loaded - Title: ${title}`);
    
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '01-homepage.png'),
      fullPage: true 
    });
  } catch (error) {
    console.log(`  ❌ Homepage failed: ${error.message}`);
  }
  
  // Test 2: Login
  console.log('\n📍 Testing Login...');
  try {
    await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const emailInput = await page.isVisible('input[type="email"]');
    console.log(`  ✅ Login loaded - Email input visible: ${emailInput}`);
    
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '02-login.png'),
      fullPage: true 
    });
  } catch (error) {
    console.log(`  ❌ Login failed: ${error.message}`);
  }
  
  // Test 3: Dashboard
  console.log('\n📍 Testing Dashboard...');
  try {
    await page.goto(BASE_URL + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const hasContent = await page.isVisible('body');
    console.log(`  ✅ Dashboard loaded - Has content: ${hasContent}`);
    
    // Check for KPI cards
    const kpiCards = await page.locator('[class*="card"], div:has-text("Occupancy"), div:has-text("RevPAR")').count();
    console.log(`  📊 Found ${kpiCards} KPI cards`);
    
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '03-dashboard.png'),
      fullPage: true 
    });
    
    // Test 4: Click sidebar links
    console.log('\n🖱️  Testing Sidebar Clicks...');
    
    const sidebarLinks = [
      { name: 'Pregled', selector: 'a:has-text("Pregled")' },
      { name: 'Koledar', selector: 'a:has-text("Koledar")' },
      { name: 'Ustvari', selector: 'a:has-text("Ustvari")' },
      { name: 'Vsebina', selector: 'a:has-text("Vsebina")' },
      { name: 'Nastavitve', selector: 'a:has-text("Nastavitve")' },
    ];
    
    for (const link of sidebarLinks) {
      try {
        const isVisible = await page.isVisible(link.selector);
        if (isVisible) {
          await page.click(link.selector);
          await page.waitForTimeout(1000);
          const url = page.url();
          console.log(`  ✅ Clicked ${link.name} - URL: ${url}`);
        } else {
          console.log(`  ⚠️  ${link.name} not visible`);
        }
      } catch (error) {
        console.log(`  ❌ ${link.name} failed: ${error.message}`);
      }
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '04-dashboard-after-clicks.png'),
      fullPage: true 
    });
    
  } catch (error) {
    console.log(`  ❌ Dashboard failed: ${error.message}`);
  }
  
  // Test 5: Check for JavaScript errors
  console.log('\n🔍 Checking for JS Errors...');
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  
  if (errors.length > 0) {
    console.log(`  ❌ Found ${errors.length} JavaScript errors:`);
    errors.forEach((err, i) => console.log(`    ${i + 1}. ${err}`));
  } else {
    console.log('  ✅ No JavaScript errors');
  }
  
  await browser.close();
  
  console.log('\n📊 TEST COMPLETE');
  console.log('='.repeat(60));
  console.log(`Screenshots saved to: ${OUTPUT_DIR}`);
  console.log('\n✅ Done!');
}

main().catch(console.error);
