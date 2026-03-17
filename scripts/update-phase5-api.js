#!/usr/bin/env node

/**
 * Update Phase 5 API route references
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

const PATH_MAPPING = {
  '/api/alerts/': '/api/v1/alerts/',
  '/api/analytics/': '/api/v1/analytics/',
  '/api/auth/': '/api/v1/auth/',
  '/api/chat/': '/api/v1/chat/',
  '/api/content/': '/api/v1/content/',
  '/api/cron/': '/api/v1/cron/',
  '/api/dashboard/': '/api/v1/dashboard/',
  '/api/memory/': '/api/v1/memory/',
  '/api/notifications/': '/api/v1/notifications/',
  '/api/workflows/': '/api/v1/workflows/',
  '/api/user/': '/api/v1/user/',
  '/api/teams/': '/api/v1/teams/',
  '/api/invites/': '/api/v1/teams/',
  '/api/permissions/': '/api/v1/rbac/',
  '/api/rbac/': '/api/v1/rbac/',
  '/api/roles/': '/api/v1/rbac/',
  '/api/audit/': '/api/v1/audit/',
  '/api/audit-logs/': '/api/v1/audit/',
};

function getAllFiles(dirPath, extensions = ['.ts', '.tsx']) {
  const files = [];
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (item.includes('__tests__') || item.includes('.test.') || item.includes('node_modules') || item.includes('api/v1')) {
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
  console.log('🔄 Updating Phase 5 API references...\n');
  
  const files = getAllFiles(SRC_DIR);
  let updated = 0;
  
  files.forEach(file => {
    try {
      if (updateFile(file)) {
        updated++;
        console.log(`  ✓ ${path.relative(SRC_DIR, file)}`);
      }
    } catch (error) {
      console.error(`  ✗ ${file}: ${error.message}`);
    }
  });
  
  console.log(`\n✅ Updated ${updated} files\n`);
}

main();
