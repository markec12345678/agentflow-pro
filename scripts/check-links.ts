/**
 * Broken Link Checker
 * 
 * Scans all markdown and HTML files for broken links
 * Usage: npm run check-links
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build', '.git'];
const FILE_EXTENSIONS = ['.md', '.mdx', '.tsx', '.ts', '.jsx', '.js', '.html'];

interface LinkResult {
  file: string;
  line: number;
  url: string;
  status: 'valid' | 'broken' | 'skipped' | 'external';
  statusCode?: number;
  error?: string;
}

async function checkUrl(url: string): Promise<{ status: number; error?: string }> {
  return new Promise((resolve) => {
    // Skip non-HTTP URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      resolve({ status: 0, error: 'Not HTTP/HTTPS' });
      return;
    }
    
    const lib = url.startsWith('https://') ? https : http;
    
    const request = lib.get(url, { timeout: 5000 }, (res) => {
      resolve({ status: res.statusCode || 0 });
    });
    
    request.on('error', (error) => {
      resolve({ status: 0, error: error.message });
    });
    
    request.on('timeout', () => {
      request.destroy();
      resolve({ status: 0, error: 'Timeout' });
    });
  });
}

function extractLinks(content: string, filePath: string): Array<{ url: string; line: number }> {
  const links: Array<{ url: string; line: number }> = [];
  const lines = content.split('\n');
  
  // Regex patterns for links
  const patterns = [
    /\[([^\]]+)\]\(([^)]+)\)/g, // Markdown links
    /href=["']([^"']+)["']/g, // HTML href
    /src=["']([^"']+)["']/g, // HTML src
    /url\(([^)]+)\)/g, // CSS url()
  ];
  
  lines.forEach((line, index) => {
    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const url = match[2] || match[1];
        if (url && !url.startsWith('#') && !url.startsWith('mailto:')) {
          links.push({ url, line: index + 1 });
        }
      }
    });
  });
  
  return links;
}

async function scanDirectory(dir: string): Promise<LinkResult[]> {
  const results: LinkResult[] = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Skip excluded directories
      if (EXCLUDE_DIRS.some(exclude => filePath.includes(exclude))) {
        continue;
      }
      
      if (stat.isDirectory()) {
        const subResults = await scanDirectory(filePath);
        results.push(...subResults);
      } else if (FILE_EXTENSIONS.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(filePath, 'utf8');
        const links = extractLinks(content, filePath);
        
        for (const { url, line } of links) {
          // Skip relative links and anchors
          if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
            // Check if relative file exists
            const resolvedPath = path.resolve(path.dirname(filePath), url);
            const exists = fs.existsSync(resolvedPath);
            
            results.push({
              file: filePath,
              line,
              url,
              status: exists ? 'valid' : 'broken',
              error: exists ? undefined : 'File not found',
            });
          } else if (url.startsWith('http://') || url.startsWith('https://')) {
            // External link - check with timeout
            const result = await checkUrl(url);
            
            results.push({
              file: filePath,
              line,
              url,
              status: result.status === 0 ? 'skipped' : result.status < 400 ? 'valid' : 'broken',
              statusCode: result.status || undefined,
              error: result.error,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error);
  }
  
  return results;
}

async function main() {
  console.log('🔍 Checking for broken links...\n');
  
  const rootDir = process.cwd();
  const results = await scanDirectory(rootDir);
  
  // Filter results
  const broken = results.filter(r => r.status === 'broken');
  const skipped = results.filter(r => r.status === 'skipped');
  const valid = results.filter(r => r.status === 'valid');
  
  // Report
  console.log('='.repeat(80));
  console.log('📊 Results:');
  console.log(`  ✅ Valid: ${valid.length}`);
  console.log(`  ❌ Broken: ${broken.length}`);
  console.log(`  ⚠️  Skipped: ${skipped.length}`);
  console.log('='.repeat(80));
  
  if (broken.length > 0) {
    console.log('\n❌ Broken Links:\n');
    broken.forEach((result, index) => {
      console.log(`${index + 1}. ${result.file}:${result.line}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Status: ${result.statusCode || 'N/A'}`);
      console.log(`   Error: ${result.error || 'Unknown'}`);
      console.log();
    });
    
    console.log('💡 Action Required:');
    console.log('  Please fix or remove the broken links above');
    console.log();
  }
  
  if (skipped.length > 0) {
    console.log('\n⚠️  Skipped Links (timeout or non-HTTP):\n');
    skipped.slice(0, 10).forEach((result) => {
      console.log(`  - ${result.url} (${result.file}:${result.line})`);
    });
    
    if (skipped.length > 10) {
      console.log(`  ... and ${skipped.length - 10} more`);
    }
    console.log();
  }
  
  // Exit with error if broken links found
  if (broken.length > 0) {
    process.exit(1);
  } else {
    console.log('✅ No broken links found!');
    process.exit(0);
  }
}

main().catch(console.error);
