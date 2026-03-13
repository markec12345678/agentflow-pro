/**
 * Dashboard Loading Diagnostic Script
 * Tests all dashboard interfaces and API endpoints
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3002';
const OUTPUT_DIR = path.join(process.cwd(), 'screenshots', 'dashboard-diagnostic');

async function main() {
  console.log('🔍 Dashboard Loading Diagnostic\n');
  
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage({ 
    viewport: { width: 1920, height: 1080 } 
  });
  
  // Enable comprehensive logging
  const errors: string[] = [];
  const requests: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const error = `Console Error: ${msg.text()} at ${msg.location().url || 'unknown'}`;
      errors.push(error);
      console.log(`❌ ${error}`);
    }
  });
  
  page.on('pageerror', error => {
    const err = `Page Error: ${error.message}`;
    errors.push(err);
    console.log(`❌ ${err}`);
  });
  
  page.on('requestfailed', request => {
    const fail = `Request Failed: ${request.url()} - ${request.failure()?.errorText}`;
    errors.push(fail);
    console.log(`❌ ${fail}`);
  });
  
  page.on('request', request => {
    requests.push(request.url());
  });
  
  // Test 1: Main dashboard page
  console.log('\n📍 Testing /dashboard...');
  try {
    const response = await page.goto(`${BASE_URL}/dashboard`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log(`  Status: ${response?.status()}`);
    await page.waitForTimeout(5000);
    
    // Check for loading states
    const isLoading = await page.evaluate(() => {
      return document.body.innerText.includes('Loading') || 
             document.body.innerText.includes('Nalaganje');
    });
    
    if (isLoading) {
      console.log('  ⚠️  Page stuck in loading state');
    } else {
      console.log('  ✅ Page loaded');
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '01-dashboard.png'),
      fullPage: true 
    });
    
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    errors.push(`Dashboard load error: ${error.message}`);
  }
  
  // Test 2: API endpoint directly
  console.log('\n🔌 Testing /api/dashboard/boot...');
  try {
    const apiResponse = await page.goto(`${BASE_URL}/api/dashboard/boot`, { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    console.log(`  API Status: ${apiResponse?.status()}`);
    
    if (apiResponse?.status() === 200) {
      const jsonData = await apiResponse.json();
      console.log('  ✅ API responding correctly');
      console.log('  Data keys:', Object.keys(jsonData).join(', '));
    } else if (apiResponse?.status() === 401) {
      console.log('  ⚠️  API requires authentication (expected)');
    } else {
      console.log(`  ❌ API returned status ${apiResponse?.status()}`);
      errors.push(`API boot returned ${apiResponse?.status()}`);
    }
    
  } catch (error: any) {
    console.log(`  ❌ API Error: ${error.message}`);
    errors.push(`API boot error: ${error.message}`);
  }
  
  // Test 3: Tourism dashboard
  console.log('\n📍 Testing /dashboard/tourism...');
  try {
    const response = await page.goto(`${BASE_URL}/dashboard/tourism`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log(`  Status: ${response?.status()}`);
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '02-tourism.png'),
      fullPage: true 
    });
    
    console.log('  ✅ Tourism dashboard loaded');
    
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    errors.push(`Tourism dashboard error: ${error.message}`);
  }
  
  // Test 4: Receptor dashboard
  console.log('\n📍 Testing /dashboard/receptor...');
  try {
    const response = await page.goto(`${BASE_URL}/dashboard/receptor`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log(`  Status: ${response?.status()}`);
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '03-receptor.png'),
      fullPage: true 
    });
    
    console.log('  ✅ Receptor dashboard loaded');
    
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    errors.push(`Receptor dashboard error: ${error.message}`);
  }
  
  // Test 5: Properties dashboard
  console.log('\n📍 Testing /dashboard/properties...');
  try {
    const response = await page.goto(`${BASE_URL}/dashboard/properties`, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log(`  Status: ${response?.status()}`);
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: path.join(OUTPUT_DIR, '04-properties.png'),
      fullPage: true 
    });
    
    console.log('  ✅ Properties dashboard loaded');
    
  } catch (error: any) {
    console.log(`  ❌ Error: ${error.message}`);
    errors.push(`Properties dashboard error: ${error.message}`);
  }
  
  await browser.close();
  
  // Generate report
  console.log('\n\n📊 DIAGNOSTIC SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Errors: ${errors.length}`);
  console.log(`Total Requests: ${requests.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ NO ERRORS DETECTED');
  }
  
  console.log('\n📸 Screenshots saved to:', OUTPUT_DIR);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalErrors: errors.length,
    totalRequests: requests.length,
    errors,
    requests,
    screenshots: fs.readdirSync(OUTPUT_DIR)
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'diagnostic-report.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n💡 TIP: Check screenshots in', OUTPUT_DIR);
}

main().catch(console.error);
