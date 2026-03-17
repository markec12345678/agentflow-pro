#!/usr/bin/env node

/**
 * API Route Konsolidacija Script
 * 
 * Premakne vse API route-e iz /api/ v /api/v1/ z grupiranjem po domenah
 */

const fs = require('fs');
const path = require('path');

const API_ROOT = path.join(__dirname, '..', 'src', 'app', 'api');
const V1_ROOT = path.join(API_ROOT, 'v1');

// Domain mapping - kam spadajo posamezni API-ji
const DOMAIN_MAPPING = {
  // Tourism domena
  tourism: 'tourism',
  reservations: 'tourism',
  reservation: 'tourism',
  properties: 'tourism',
  property: 'tourism',
  guests: 'tourism',
  guest: 'tourism',
  pricing: 'tourism',
  price: 'tourism',
  availability: 'tourism',
  calendar: 'tourism',
  rooms: 'tourism',
  room: 'tourism',
  housekeeping: 'tourism',
  'room-assignment': 'tourism',
  'property-access': 'tourism',
  channels: 'tourism',
  bookings: 'tourism',
  book: 'tourism',
  
  // Agents domena
  agents: 'agents',
  concierge: 'agents',
  content: 'agents',
  research: 'agents',
  workflows: 'agents',
  planner: 'agents',
  'page-builder': 'agents',
  optimize: 'agents',
  personalize: 'agents',
  generate: 'agents',
  'generate-content': 'agents',
  'generate-image': 'agents',
  
  // Billing domena
  billing: 'billing',
  payments: 'billing',
  payment: 'billing',
  invoices: 'billing',
  invoice: 'billing',
  'tax-reports': 'billing',
  tax: 'billing',
  refunds: 'billing',
  stripe: 'billing',
  
  // Admin domena
  admin: 'admin',
  health: 'admin',
  test: 'admin',
  tests: 'admin',
  debug: 'admin',
  dev: 'admin',
  demo: 'admin',
  
  // Analytics domena
  analytics: 'analytics',
  reports: 'analytics',
  insights: 'analytics',
  metrics: 'analytics',
  usage: 'analytics',
  costs: 'analytics',
  
  // User domena
  user: 'user',
  users: 'user',
  auth: 'user',
  login: 'user',
  register: 'user',
  profile: 'user',
  teams: 'user',
  invites: 'user',
  'api-keys': 'user',
  permissions: 'user',
  rbac: 'user',
  roles: 'user',
  
  // Communication domena
  messages: 'communication',
  message: 'communication',
  chat: 'communication',
  notifications: 'communication',
  email: 'communication',
  'email-templates': 'communication',
  mailchimp: 'communication',
  contact: 'communication',
  
  // Integration domena
  integrations: 'integration',
  webhooks: 'integration',
  hubspot: 'integration',
  salesforce: 'integration',
  
  // Memory & AI domena
  memory: 'memory',
  vector: 'memory',
  ai: 'ai',
  mcp: 'ai',
  'mcp-builder': 'ai',
  
  // Content domena (ostalo)
  branding: 'content',
  templates: 'content',
  docs: 'content',
  image: 'content',
  reviews: 'content',
  gdpr: 'content',
  audit: 'content',
  'audit-logs': 'content',
  
  // Settings domena
  settings: 'settings',
  tenants: 'settings',
  workspaces: 'settings',
  director: 'settings',
  
  // Socket/Real-time
  socket: 'realtime',
  canvas: 'realtime',
  
  // Onboarding
  onboarding: 'onboarding',
  dashboard: 'onboarding',
  
  // Receptor (webhook receiver)
  receptor: 'webhooks',
  
  // Alerts
  alerts: 'alerts',
  
  // Cron
  cron: 'cron',
};

// API-ji ki jih NE premaknemo (ostanejo v root /api/)
const KEEP_IN_ROOT = [
  'v1', // Already v1
  'middleware.ts', // Middleware
];

function shouldKeepInRoot(dirName) {
  return KEEP_IN_ROOT.includes(dirName);
}

function getDomain(dirName) {
  return DOMAIN_MAPPING[dirName] || 'misc';
}

function getAllDirectories() {
  const items = fs.readdirSync(API_ROOT);
  return items.filter(item => {
    const fullPath = path.join(API_ROOT, item);
    return fs.statSync(fullPath).isDirectory() && !shouldKeepInRoot(item);
  });
}

function getAllRouteFiles(dirPath) {
  const routes = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (item === 'route.ts') {
        routes.push(fullPath);
      }
    });
  }
  
  walk(dirPath);
  return routes;
}

function moveDirectory(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.log(`  ⚠️  Source does not exist: ${srcDir}`);
    return false;
  }
  
  // Create destination if needed
  const destParent = path.dirname(destDir);
  if (!fs.existsSync(destParent)) {
    fs.mkdirSync(destParent, { recursive: true });
  }
  
  // Move directory
  if (fs.existsSync(destDir)) {
    console.log(`  ⚠️  Destination already exists: ${destDir}`);
    return false;
  }
  
  fs.renameSync(srcDir, destDir);
  return true;
}

function main() {
  console.log('🚀 API Route Konsolidacija\n');
  console.log('Reading current API structure...\n');
  
  const directories = getAllDirectories();
  const stats = {
    moved: 0,
    skipped: 0,
    errors: 0,
  };
  
  // Group by domain
  const domainGroups = {};
  
  directories.forEach(dir => {
    const domain = getDomain(dir);
    if (!domainGroups[domain]) {
      domainGroups[domain] = [];
    }
    domainGroups[domain].push(dir);
  });
  
  console.log('📊 Domain Groups:');
  Object.entries(domainGroups).forEach(([domain, dirs]) => {
    console.log(`  ${domain}: ${dirs.length} directories`);
  });
  console.log('');
  
  // Move directories
  console.log('📦 Moving directories to /api/v1/...\n');
  
  Object.entries(domainGroups).forEach(([domain, dirs]) => {
    console.log(`\n📁 ${domain.toUpperCase()}/`);
    
    dirs.forEach(dir => {
      const srcDir = path.join(API_ROOT, dir);
      const destDir = path.join(V1_ROOT, domain, dir);
      
      try {
        // Check if directory has route.ts files
        const routes = getAllRouteFiles(srcDir);
        
        if (routes.length === 0) {
          console.log(`  ⚪ Skipping ${dir} (no routes)`);
          stats.skipped++;
          return;
        }
        
        console.log(`  → Moving ${dir} (${routes.length} routes)`);
        
        // Create domain directory if needed
        const domainDir = path.join(V1_ROOT, domain);
        if (!fs.existsSync(domainDir)) {
          fs.mkdirSync(domainDir, { recursive: true });
        }
        
        // Move
        moveDirectory(srcDir, destDir);
        stats.moved++;
        
      } catch (error) {
        console.error(`  ❌ Error moving ${dir}: ${error.message}`);
        stats.errors++;
      }
    });
  });
  
  console.log('\n✅ Complete!\n');
  console.log('📈 Statistics:');
  console.log(`  Moved: ${stats.moved}`);
  console.log(`  Skipped: ${stats.skipped}`);
  console.log(`  Errors: ${stats.errors}`);
  console.log('\n⚠️  Next steps:');
  console.log('  1. Update all import paths');
  console.log('  2. Update API documentation');
  console.log('  3. Test all endpoints');
  console.log('  4. Update frontend API calls');
}

main();
