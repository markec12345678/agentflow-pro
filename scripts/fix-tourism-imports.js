#!/usr/bin/env node

/**
 * Fix remaining tourism imports - point to core/domain/tourism/
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Fix imports - from @/lib/tourism/ to @/core/domain/tourism/
const IMPORT_MAPPINGS = [
  { 
    pattern: /from ['"]@\/lib\/tourism\/property-access['"]/g, 
    replacement: `from '@/core/domain/tourism/property-access'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/tax-rates['"]/g, 
    replacement: `from '@/core/domain/tourism/tax-rates'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/pricing-engine-wrapper['"]/g, 
    replacement: `from '@/core/domain/tourism/services/pricing-engine-wrapper'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/occupancy['"]/g, 
    replacement: `from '@/core/domain/tourism/occupancy'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/faq-schema['"]/g, 
    replacement: `from '@/core/domain/tourism/faq-schema'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/publish-helpers['"]/g, 
    replacement: `from '@/core/domain/tourism/publish-helpers'` 
  },
  { 
    pattern: /from ['"]@\/lib\/tourism\/substitute-prompt['"]/g, 
    replacement: `from '@/core/domain/tourism/substitute-prompt'` 
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
  console.log('🔧 Fixing remaining tourism imports to core/domain/tourism/...\n');
  
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
