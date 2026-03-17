#!/usr/bin/env node

/**
 * Update imports after API and module restructuring
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Import mapping - kaj nadomestiti s čim
const IMPORT_MAPPINGS = [
  // API imports - vse /api/ → /api/v1/
  { 
    pattern: /from ['"]@\/api\/usage['"]/g, 
    replacement: `from '@/app/api/v1/reports/usage'` 
  },
  { 
    pattern: /from ['"]@\/api\/billing['"]/g, 
    replacement: `from '@/app/api/v1/billing'` 
  },
  { 
    pattern: /from ['"]@\/api\/workflows['"]/g, 
    replacement: `from '@/app/api/v1/workflows/workflows'` 
  },
  
  // Tourism lib imports - posodobiti poti
  { 
    pattern: /from ['"]@\/lib\/tourism\/pricing-engine['"]/g, 
    replacement: `from '@/lib/tourism/pricing-engine-wrapper'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/tax-rates['"]/g, 
    replacement: `from '@/lib/tourism/tax-rates'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/property-access['"]/g, 
    replacement: `from '@/lib/tourism/property-access'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/occupancy['"]/g, 
    replacement: `from '@/lib/tourism/occupancy'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/mews-adapter['"]/g, 
    replacement: `from '@/lib/tourism/mews-adapter'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/policy-agent['"]/g, 
    replacement: `from '@/lib/tourism/policy-agent'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/guest-retrieval['"]/g, 
    replacement: `from '@/lib/tourism/guest-retrieval'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/guest-copy-agent['"]/g, 
    replacement: `from '@/lib/tourism/guest-copy-agent'` 
  },
];

function getAllFiles(dirPath, extensions = ['.ts', '.tsx']) {
  const files = [];
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (item.includes('node_modules') || item.includes('.next')) {
          return;
        }
        walk(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    });
  }
  walk(dirPath);
  return files;
}

function updateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let changed = false;
  
  IMPORT_MAPPINGS.forEach(({ pattern, replacement }) => {
    if (newContent.match(pattern)) {
      newContent = newContent.replace(pattern, replacement);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    return true;
  }
  return false;
}

function main() {
  console.log('🔧 Updating imports after restructuring...\n');
  
  const files = getAllFiles(SRC_DIR);
  let updated = 0;
  
  files.forEach(file => {
    try {
      if (updateFile(file)) {
        updated++;
        const relativePath = path.relative(SRC_DIR, file);
        console.log(`  ✓ ${relativePath}`);
      }
    } catch (error) {
      console.error(`  ✗ ${file}: ${error.message}`);
    }
  });
  
  console.log(`\n✅ Updated ${updated} files\n`);
}

main();
