#!/usr/bin/env node

/**
 * Update Phase 6 API route references
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

const PATH_MAPPING = {
  '/api/ai/': '/api/v1/ai/',
  '/api/generate-content/': '/api/v1/ai/',
  '/api/generate-image/': '/api/v1/ai/',
  '/api/image/': '/api/v1/ai/',
  '/api/optimize/': '/api/v1/ai/',
  '/api/personalize/': '/api/v1/ai/',
  '/api/contact/': '/api/v1/communication/',
  '/api/email-templates/': '/api/v1/communication/',
  '/api/mailchimp/': '/api/v1/communication/',
  '/api/message-groups/': '/api/v1/communication/',
  '/api/messages/': '/api/v1/communication/',
  '/api/socket/': '/api/v1/communication/',
  '/api/integrations/': '/api/v1/integration/',
  '/api/hubspot/': '/api/v1/integration/',
  '/api/mcp/': '/api/v1/integration/',
  '/api/mcp-builder/': '/api/v1/integration/',
  '/api/webhooks/': '/api/v1/integration/',
  '/api/guest/': '/api/v1/guest/',
  '/api/concierge/': '/api/v1/guest/',
  '/api/receptor/': '/api/v1/guest/',
  '/api/settings/': '/api/v1/settings/',
  '/api/profile/': '/api/v1/settings/',
  '/api/tenants/': '/api/v1/settings/',
  '/api/workspaces/': '/api/v1/settings/',
  '/api/templates/': '/api/v1/settings/',
  '/api/reports/': '/api/v1/reports/',
  '/api/reviews/': '/api/v1/reports/',
  '/api/insights/': '/api/v1/reports/',
  '/api/usage/': '/api/v1/reports/',
  '/api/debug/': '/api/v1/system/',
  '/api/demo/': '/api/v1/system/',
  '/api/dev/': '/api/v1/system/',
  '/api/test/': '/api/v1/system/',
  '/api/health/': '/api/v1/system/',
  '/api/docs/': '/api/v1/system/',
  '/api/costs/': '/api/v1/business/',
  '/api/pricing/': '/api/v1/business/',
  '/api/director/': '/api/v1/business/',
  '/api/planner/': '/api/v1/business/',
  '/api/page-builder/': '/api/v1/business/',
  '/api/canvas/': '/api/v1/infrastructure/',
  '/api/calendar/': '/api/v1/infrastructure/',
  '/api/gdpr/': '/api/v1/infrastructure/',
  '/api/vector/': '/api/v1/infrastructure/',
  '/api/room-assignment/': '/api/v1/infrastructure/',
  '/api/api-keys/': '/api/v1/infrastructure/',
  '/api/branding/': '/api/v1/infrastructure/',
  '/api/onboarding/': '/api/v1/infrastructure/',
  '/api/ab-tests/': '/api/v1/infrastructure/',
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
  console.log('🔄 Updating Phase 6 API references...\n');
  
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
