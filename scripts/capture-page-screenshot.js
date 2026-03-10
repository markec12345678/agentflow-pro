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
    await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(outputPath);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}
main();
