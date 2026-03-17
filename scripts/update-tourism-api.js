#!/usr/bin/env node

/**
 * Update API route references from /api/{domain} to /api/v1/tourism/{domain}
 * 
 * Tourism domains: tourism, reservations, guests, rooms, availability, 
 * housekeeping, property-access, channels, book, pricing, properties
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

// Map old paths to new paths
const PATH_MAPPING = {
  '/api/tourism/': '/api/v1/tourism/',
  '/api/reservations/': '/api/v1/tourism/reservations/',
  '/api/guests/': '/api/v1/tourism/guests/',
  '/api/rooms/': '/api/v1/tourism/rooms/',
  '/api/availability/': '/api/v1/tourism/availability/',
  '/api/housekeeping/': '/api/v1/tourism/housekeeping/',
  '/api/property-access/': '/api/v1/tourism/property-access/',
  '/api/channels/': '/api/v1/tourism/channels/',
  '/api/book/': '/api/v1/tourism/book/',
  '/api/pricing/': '/api/v1/tourism/pricing/',
  '/api/properties/': '/api/v1/tourism/properties/',
};

function getAllFiles(dirPath, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip test directories
        if (item.includes('__tests__') || item.includes('.test.') || item.includes('node_modules')) {
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
  
  // Replace each old path with new path
  Object.entries(PATH_MAPPING).forEach(([oldPath, newPath]) => {
    const regex = new RegExp(`(['"\`])${oldPath.replace(/[\/\[\]]/g, '\\$&')}([^'"\`]*?)\\1`, 'g');
    const replacement = `$1${newPath}$2$1`;
    
    if (newContent.match(regex)) {
      newContent = newContent.replace(regex, replacement);
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
  console.log('🔄 Updating tourism API references...\n');
  
  const files = getAllFiles(SRC_DIR);
  const stats = {
    total: files.length,
    updated: 0,
    skipped: 0,
  };
  
  console.log(`Scanning ${stats.total} files...\n`);
  
  files.forEach(file => {
    try {
      const updated = updateFile(file);
      if (updated) {
        stats.updated++;
        const relativePath = path.relative(SRC_DIR, file);
        console.log(`  ✓ ${relativePath}`);
      } else {
        stats.skipped++;
      }
    } catch (error) {
      console.error(`  ✗ Error updating ${file}: ${error.message}`);
    }
  });
  
  console.log('\n✅ Complete!\n');
  console.log('📈 Statistics:');
  console.log(`  Total files scanned: ${stats.total}`);
  console.log(`  Files updated: ${stats.updated}`);
  console.log(`  Files skipped: ${stats.skipped}`);
}

main();
