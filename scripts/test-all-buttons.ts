/**
 * Test all buttons and links in the app
 * Checks if they lead to valid pages (not empty/dead ends)
 */

import { chromium, type Page, type Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3002';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots', 'button-tests');

interface TestResult {
  url: string;
  status: 'success' | 'error' | 'redirect';
  title?: string;
  hasContent: boolean;
  screenshot?: string;
  error?: string;
}

async function takeScreenshot(page: Page, name: string): Promise<string> {
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function checkPageContent(page: Page, url: string): Promise<TestResult> {
  try {
    // Wait for network to be idle
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Get page title
    const title = await page.title();
    
    // Check for content
    const body = await page.locator('body').textContent();
    const hasContent = body !== null && body.trim().length > 0;
    
    // Check for common "empty" indicators
    const isEmpty = await page.evaluate(() => {
      const body = document.body.innerText.toLowerCase();
      const has404 = body.includes('404') || body.includes('not found');
      const hasError = body.includes('error') || body.includes('failed');
      const hasEmpty = body.includes('nothing here') || body.includes('no content');
      return has404 || hasError || hasEmpty;
    });
    
    // Take screenshot
    const screenshot = await takeScreenshot(page, url.replace(/[^a-z0-9]/gi, '-'));
    
    return {
      url,
      status: 'success',
      title,
      hasContent: hasContent && !isEmpty,
      screenshot,
    };
  } catch (error) {
    return {
      url,
      status: 'error',
      hasContent: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testPage(page: Page, url: string, description: string): Promise<TestResult> {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const result = await checkPageContent(page, url);
    
    if (result.status === 'success') {
      console.log(`   ✅ Status: OK`);
      console.log(`   📄 Title: ${result.title}`);
      console.log(`   📝 Has content: ${result.hasContent}`);
      console.log(`   📸 Screenshot: ${result.screenshot}`);
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.log(`   ❌ Failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    return {
      url,
      status: 'error',
      hasContent: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function findAllLinks(page: Page): Promise<Array<{ text: string; href: string }>> {
  return await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    return links
      .map(link => ({
        text: link.textContent?.trim() || 'Link',
        href: link.getAttribute('href') || '',
      }))
      .filter(link => link.href && !link.href.startsWith('#') && !link.href.startsWith('javascript:'));
  });
}

async function testAllButtons() {
  console.log('🚀 Starting button/link testing...\n');
  
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
  
  const results: TestResult[] = [];
  
  // Test main pages
  const pagesToTest = [
    { url: '/login', description: 'Login page' },
    { url: '/register', description: 'Register page' },
    { url: '/dashboard', description: 'Dashboard' },
    { url: '/calendar', description: 'Calendar' },
    { url: '/content', description: 'Content' },
    { url: '/settings', description: 'Settings' },
    { url: '/pricing', description: 'Pricing' },
    { url: '/about', description: 'About' },
  ];
  
  console.log('📋 Testing main pages...\n');
  for (const pageTest of pagesToTest) {
    const url = BASE_URL + pageTest.url;
    const result = await testPage(page, url, pageTest.description);
    results.push(result);
  }
  
  // Go to login page and find all links
  console.log('\n🔗 Finding all links on login page...\n');
  await page.goto(BASE_URL + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  
  const links = await findAllLinks(page);
  console.log(`Found ${links.length} links\n`);
  
  // Test each link
  for (const link of links) {
    // Skip external links
    if (link.href.startsWith('http') && !link.href.startsWith(BASE_URL)) {
      console.log(`⏭️  Skipping external link: ${link.text} -> ${link.href}`);
      continue;
    }
    
    // Convert relative to absolute
    const absoluteUrl = link.href.startsWith('http') 
      ? link.href 
      : BASE_URL + (link.href.startsWith('/') ? '' : '/') + link.href;
    
    const result = await testPage(page, absoluteUrl, `Link: ${link.text}`);
    results.push(result);
  }
  
  // Generate report
  console.log('\n\n📊 TEST REPORT\n');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'success' && r.hasContent);
  const failed = results.filter(r => r.status === 'error' || !r.hasContent);
  
  console.log(`\n✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📊 Total: ${results.length}\n`);
  
  if (failed.length > 0) {
    console.log('⚠️  Failed/Empty pages:\n');
    failed.forEach((result, i) => {
      console.log(`${i + 1}. ${result.url}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Error: ${result.error || 'No content'}`);
    });
  }
  
  // Save report to file
  const reportPath = path.join(SCREENSHOTS_DIR, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Report saved to: ${reportPath}\n`);
  
  await browser.close();
  
  // Return exit code based on results
  if (failed.length > 0) {
    console.log('⚠️  Some links/pages are broken or empty!\n');
    process.exit(1);
  } else {
    console.log('🎉 All links work and have content!\n');
    process.exit(0);
  }
}

// Run the test
testAllButtons().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
