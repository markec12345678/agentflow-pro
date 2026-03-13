#!/usr/bin/env node
/**
 * Capture screenshot of a local URL for AI inspection.
 * Usage: node scripts/capture-page-screenshot.js [url] [outputPath]
 * Default: http://localhost:3002/login -> screenshots/capture.png
 * Requires: npm run dev running, playwright installed
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const url = process.argv[2] || "http://localhost:3002/login";
const outArg = process.argv[3] || "screenshots/capture.png";
const outputPath = path.isAbsolute(outArg) ? outArg : path.join(process.cwd(), outArg);

async function main() {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    // Use domcontentloaded for faster capture, then wait a bit for JS to render
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    // Wait for page to stabilize (max 5 seconds)
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
    // Additional wait for JS rendering
    await page.waitForTimeout(2000);
    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(outputPath);
  } catch (err) {
    console.error(err.message);
    // Still try to save screenshot even on error
    try {
      await page?.screenshot({ path: outputPath, fullPage: true }).catch(() => {});
    } catch {}
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}
main();
