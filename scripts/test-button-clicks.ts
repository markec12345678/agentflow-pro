/**
 * Interactive button click testing
 * Clicks each button and checks where it leads
 */

import { chromium, type Page, type Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3002';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots', 'click-tests');

interface ClickTest {
  name: string;
  selector: string;
  page: string;
  expectedBehavior: string;
}

interface TestResult {
  buttonName: string;
  selector: string;
  startPage: string;
  endUrl: string;
  endTitle: string;
  hasContent: boolean;
  screenshot: string;
  status: 'success' | 'error' | 'no-content';
  notes: string;
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const safeName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${safeName}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function testClick(
  page: Page,
  button: ClickTest
): Promise<TestResult | null> {
  console.log(`\n🔘 Testing: ${button.name}`);
  console.log(`   Page: ${button.page}`);
  console.log(`   Selector: ${button.selector}`);
  console.log(`   Expected: ${button.expectedBehavior}`);

  try {
    // Navigate to starting page
    await page.goto(BASE_URL + button.page, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Wait a bit for any animations
    await page.waitForTimeout(500);
    
    // Check if element exists
    const element = await page.$(button.selector);
    if (!element) {
      console.log(`   ⚠️  Element not found, skipping`);
      return null;
    }
    
    // Check if element is visible
    const isVisible = await element.isVisible();
    if (!isVisible) {
      console.log(`   ⚠️  Element not visible, skipping`);
      return null;
    }
    
    // Get initial URL
    const initialUrl = page.url();
    
    // Click the element
    await element.click();
    console.log(`   🖱️  Clicked!`);
    
    // Wait for navigation (if any)
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 });
    } catch (e) {
      console.log(`   ⏱️  Navigation timeout (might be anchor link or no navigation)`);
    }
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(1000);
    
    // Get final URL
    const finalUrl = page.url();
    const hasNavigated = finalUrl !== initialUrl && finalUrl !== BASE_URL + button.page;
    
    // Get page info
    const title = await page.title();
    const body = await page.locator('body').textContent();
    const hasContent = body !== null && body.trim().length > 50;
    
    // Check URL hash change (for anchor links)
    const hashChanged = await page.evaluate(() => window.location.hash);
    
    // Take screenshot
    const screenshotName = `${button.page}-${button.name}`;
    const screenshot = await takeScreenshot(page, screenshotName);
    
    // Determine status
    let status: TestResult['status'] = 'success';
    let notes = '';
    
    if (!hasContent) {
      status = 'no-content';
      notes = 'Page appears empty';
    }
    
    if (hasNavigated) {
      notes += `Navigated from ${button.page} to ${finalUrl.replace(BASE_URL, '')}`;
    } else if (hashChanged) {
      notes += `Anchor link: ${hashChanged}`;
    } else {
      notes += 'No navigation (might be JS action or modal)';
    }
    
    const result: TestResult = {
      buttonName: button.name,
      selector: button.selector,
      startPage: button.page,
      endUrl: finalUrl,
      endTitle: title,
      hasContent,
      screenshot,
      status,
      notes,
    };
    
    console.log(`   ✅ Result: ${status}`);
    console.log(`   📄 Title: ${title}`);
    console.log(`   📝 Has content: ${hasContent}`);
    console.log(`   🔗 End URL: ${finalUrl.replace(BASE_URL, '')}`);
    console.log(`   📸 Screenshot: ${screenshot}`);
    console.log(`   📝 Notes: ${notes}`);
    
    return result;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ❌ Error: ${errorMsg}`);
    
    return {
      buttonName: button.name,
      selector: button.selector,
      startPage: button.page,
      endUrl: page.url(),
      endTitle: await page.title().catch(() => 'Error'),
      hasContent: false,
      screenshot: '',
      status: 'error',
      notes: `Error: ${errorMsg}`,
    };
  }
}

async function runClickTests() {
  console.log('🚀 Starting interactive button click tests...\n');
  
  // Create screenshots directory
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  
  const browser: Browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page: Page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
  });
  
  // Define buttons to test
  const buttonsToTest: ClickTest[] = [
    // Header navigation
    { name: 'Demo (header)', selector: 'a[href*="demo"], nav a:has-text("Demo")', page: '/', expectedBehavior: 'Scroll to demo or open demo page' },
    { name: 'Cenik (header)', selector: 'a[href*="cenik"], a[href*="pricing"], nav a:has-text("Cenik")', page: '/', expectedBehavior: 'Go to pricing page' },
    { name: 'Rešitve (header)', selector: 'nav a:has-text("Rešitve")', page: '/', expectedBehavior: 'Open dropdown or solutions page' },
    { name: 'Viri (header)', selector: 'nav a:has-text("Viri")', page: '/', expectedBehavior: 'Open dropdown or resources page' },
    { name: 'Prijava (header)', selector: 'a[href*="login"], a[href*="prijava"], nav a:has-text("Prijava")', page: '/', expectedBehavior: 'Go to login page' },
    
    // Login page
    { name: 'Prijava (button)', selector: 'button:has-text("Prijava"), input[type="submit"][value="Prijava"]', page: '/login', expectedBehavior: 'Submit login form' },
    { name: 'Registracija (link)', selector: 'a:has-text("Registracija")', page: '/login', expectedBehavior: 'Go to register page' },
    { name: 'Pozabljeno geslo', selector: 'a:has-text("geslo"), a:has-text("Forgot")', page: '/login', expectedBehavior: 'Go to password reset' },
    { name: 'Test prijave (dev)', selector: 'button:has-text("Test"), a:has-text("Test prijave")', page: '/login', expectedBehavior: 'Auto-fill test credentials' },
    
    // Register page
    { name: 'Prijava (iz registra)', selector: 'a:has-text("Prijava"), a:has-text("Login")', page: '/register', expectedBehavior: 'Go to login page' },
    
    // Homepage CTAs
    { name: 'Začni brezplačno', selector: 'a:has-text("Začni"), button:has-text("brezplačno"), a:has-text("Start")', page: '/', expectedBehavior: 'Go to onboarding or register' },
    
    // Dashboard (if accessible)
    { name: 'Koledar (dashboard)', selector: 'a[href*="calendar"], a:has-text("Koledar")', page: '/dashboard', expectedBehavior: 'Go to calendar page' },
    { name: 'Ustvari (dashboard)', selector: 'a[href*="create"], a[href*="ustvari"], a:has-text("Ustvari")', page: '/dashboard', expectedBehavior: 'Open create modal or page' },
    { name: 'Vsebina (dashboard)', selector: 'a[href*="content"], a:has-text("Vsebina")', page: '/dashboard', expectedBehavior: 'Go to content page' },
    { name: 'Nastavitve (dashboard)', selector: 'a[href*="settings"], a:has-text("Nastavitve")', page: '/dashboard', expectedBehavior: 'Go to settings page' },
  ];
  
  const results: TestResult[] = [];
  
  for (const button of buttonsToTest) {
    const result = await testClick(page, button);
    if (result) {
      results.push(result);
    }
    // Small delay between tests
    await page.waitForTimeout(500);
  }
  
  // Generate report
  console.log('\n\n📊 CLICK TEST REPORT\n');
  console.log('='.repeat(70));
  
  const success = results.filter(r => r.status === 'success');
  const noContent = results.filter(r => r.status === 'no-content');
  const errors = results.filter(r => r.status === 'error');
  
  console.log(`\n✅ Successful: ${success.length}`);
  console.log(`⚠️  No content: ${noContent.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  console.log(`📊 Total tested: ${results.length}\n`);
  
  if (noContent.length > 0 || errors.length > 0) {
    console.log('⚠️  Issues found:\n');
    [...noContent, ...errors].forEach((result, i) => {
      console.log(`${i + 1}. ${result.buttonName}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Notes: ${result.notes}`);
      console.log();
    });
  }
  
  // Save report
  const reportPath = path.join(SCREENSHOTS_DIR, 'click-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`💾 Report saved to: ${reportPath}\n`);
  
  // Save markdown summary
  const mdPath = path.join(SCREENSHOTS_DIR, 'CLICK-TEST-SUMMARY.md');
  let md = '# Click Test Results\n\n';
  md += `**Date:** ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- ✅ Successful: ${success.length}\n`;
  md += `- ⚠️ No content: ${noContent.length}\n`;
  md += `- ❌ Errors: ${errors.length}\n\n`;
  
  md += '## Detailed Results\n\n';
  results.forEach((r, i) => {
    md += `### ${i + 1}. ${r.buttonName}\n\n`;
    md += `- **Status:** ${r.status}\n`;
    md += `- **Start:** ${r.startPage}\n`;
    md += `- **End URL:** ${r.endUrl.replace(BASE_URL, '')}\n`;
    md += `- **Title:** ${r.endTitle}\n`;
    md += `- **Has content:** ${r.hasContent}\n`;
    md += `- **Notes:** ${r.notes}\n`;
    if (r.screenshot) {
      md += `- **Screenshot:** \`${path.basename(r.screenshot)}\`\n`;
    }
    md += '\n';
  });
  
  fs.writeFileSync(mdPath, md);
  console.log(`📄 Markdown summary saved to: ${mdPath}\n`);
  
  await browser.close();
  
  if (errors.length > 0) {
    console.log('⚠️  Some buttons have errors!\n');
    process.exit(1);
  } else {
    console.log('🎉 All clickable buttons work!\n');
    process.exit(0);
  }
}

runClickTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
