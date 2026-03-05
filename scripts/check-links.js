#!/usr/bin/env node
/**
 * Check internal links in docs/*.md.
 * Verifies relative paths exist. Skips external URLs (http/https) and anchors (#).
 * Usage: node scripts/check-links.js [--docs path]
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const docsDir = process.argv.includes("--docs")
  ? path.resolve(process.argv[process.argv.indexOf("--docs") + 1] || root)
  : path.join(root, "docs");

const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;

function* walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkDir(full);
    } else if (e.isFile() && e.name.endsWith(".md")) {
      yield full;
    }
  }
}

function extractLinks(filePath, content) {
  const links = [];
  let m;
  while ((m = linkRe.exec(content)) !== null) {
    const href = m[2].trim();
    if (
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:")
    ) {
      continue;
    }
    if (href.startsWith("/") && !href.endsWith(".md")) {
      continue;
    }
    links.push({ href, file: filePath });
  }
  return links;
}

function resolveTarget(sourceFile, href) {
  const sourceDir = path.dirname(sourceFile);
  const normalized = href.split("#")[0];
  if (!normalized) return path.join(sourceDir, ".");
  let target = path.normalize(path.join(sourceDir, normalized));
  target = path.resolve(target);
  if (!existsSync(target) && (normalized.startsWith("src/") || normalized.startsWith("tests/"))) {
    const fromRoot = path.resolve(root, normalized);
    if (existsSync(fromRoot)) return fromRoot;
  }
  return target;
}

function existsSync(p) {
  try {
    const stat = fs.statSync(p);
    return stat.isFile() || stat.isDirectory();
  } catch {
    return false;
  }
}

const errors = [];
const checked = new Set();

for (const file of walkDir(docsDir)) {
  const content = fs.readFileSync(file, "utf8");
  const links = extractLinks(file, content);
  for (const { href } of links) {
    const target = resolveTarget(file, href);
    const key = `${file} -> ${href}`;
    if (checked.has(key)) continue;
    checked.add(key);
    if (!existsSync(target)) {
      errors.push({ file, href, target });
    }
  }
}

if (errors.length > 0) {
  console.error("Broken internal links:\n");
  for (const { file, href, target } of errors) {
    console.error(`  ${path.relative(root, file)}: [${href}] -> ${path.relative(root, target)} (not found)`);
  }
  process.exit(1);
}

console.log("All internal links OK.");
