#!/usr/bin/env node

/**
 * AgentFlow Pro - Production Deployment Script
 * 
 * Usage: node scripts/deploy-to-production.js
 * 
 * This script:
 * 1. Validates environment variables
 * 2. Runs pre-deployment checks
 * 3. Executes database migrations
 * 4. Triggers Vercel deployment
 * 5. Verifies deployment success
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command) {
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    log(`❌ Command failed: ${command}`, 'red');
    throw error;
  }
}

// ============================================================================
// Step 1: Environment Validation
// ============================================================================

async function validateEnvironment() {
  log('\n🔍 Step 1: Validating environment variables...', 'cyan');

  const envFile = path.join(process.cwd(), '.env.production');
  
  if (!fs.existsSync(envFile)) {
    log('⚠️  .env.production not found. Using .env.local', 'yellow');
  }

  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'OPENAI_API_KEY',
    'RESEND_API_KEY',
    'SENTRY_DSN',
    'CRON_SECRET',
  ];

  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    log('\n❌ Missing required environment variables:', 'red');
    missing.forEach((v) => log(`   - ${v}`, 'red'));
    log('\nSet these in Vercel Dashboard or .env.production', 'yellow');
    
    const answer = await question('Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      process.exit(1);
    }
  } else {
    log('✅ All required environment variables present', 'green');
  }
}

// ============================================================================
// Step 2: Pre-Deployment Checks
// ============================================================================

async function preDeploymentChecks() {
  log('\n🔍 Step 2: Running pre-deployment checks...', 'cyan');

  // Check if on main branch
  const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  if (branch !== 'main') {
    log(`⚠️  You're on branch '${branch}', not 'main'`, 'yellow');
    const answer = await question('Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }

  // Check for uncommitted changes
  const status = execSync('git status --porcelain').toString().trim();
  if (status) {
    log('⚠️  You have uncommitted changes:', 'yellow');
    log(status, 'yellow');
    const answer = await question('Continue anyway? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }

  // Run tests
  log('\nRunning tests...', 'blue');
  try {
    exec('npm run test');
    log('✅ Tests passed', 'green');
  } catch (error) {
    log('❌ Tests failed. Fix before deploying.', 'red');
    process.exit(1);
  }

  // Run linting
  log('\nRunning linter...', 'blue');
  try {
    exec('npm run lint');
    log('✅ Linting passed', 'green');
  } catch (error) {
    log('⚠️  Linting failed. Continue anyway?', 'yellow');
    const answer = await question('(y/n): ');
    if (answer.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }

  // Build check
  log('\nRunning production build...', 'blue');
  try {
    exec('npm run build');
    log('✅ Build successful', 'green');
  } catch (error) {
    log('❌ Build failed. Fix before deploying.', 'red');
    process.exit(1);
  }
}

// ============================================================================
// Step 3: Database Migration
// ============================================================================

async function runDatabaseMigration() {
  log('\n🗄️  Step 3: Running database migrations...', 'cyan');

  const answer = await question('⚠️  This will migrate the production database. Continue? (y/n): ');
  
  if (answer.toLowerCase() !== 'y') {
    log('Skipping database migration', 'yellow');
    return;
  }

  try {
    exec('npm run db:migrate:prod');
    log('✅ Database migrations completed', 'green');
  } catch (error) {
    log('❌ Database migration failed', 'red');
    const skip = await question('Continue deployment anyway? (y/n): ');
    if (skip.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }
}

// ============================================================================
// Step 4: Vercel Deployment
// ============================================================================

async function deployToVercel() {
  log('\n🚀 Step 4: Deploying to Vercel...', 'cyan');

  try {
    // Check if Vercel CLI is installed
    execSync('which vercel', { stdio: 'ignore' });
  } catch (error) {
    log('Vercel CLI not found. Installing...', 'yellow');
    exec('npm install -g vercel');
  }

  // Deploy to production
  log('\nDeploying to production...', 'blue');
  try {
    exec('vercel --prod');
    log('✅ Deployment successful!', 'green');
  } catch (error) {
    log('❌ Deployment failed', 'red');
    throw error;
  }
}

// ============================================================================
// Step 5: Post-Deployment Verification
// ============================================================================

async function verifyDeployment() {
  log('\n✅ Step 5: Verifying deployment...', 'cyan');

  const productionUrl = process.env.NEXTAUTH_URL || 'https://agentflow.pro';
  
  log(`\nProduction URL: ${productionUrl}`, 'cyan');
  log('\n📋 Manual verification checklist:', 'yellow');
  log('  1. Visit homepage and verify it loads', 'yellow');
  log('  2. Test login flow', 'yellow');
  log('  3. Test registration flow', 'yellow');
  log('  4. Test Stripe checkout', 'yellow');
  log('  5. Check Sentry for errors', 'yellow');
  log('  6. Verify webhook delivery', 'yellow');

  const answer = await question('\nHave you verified the deployment? (y/n): ');
  
  if (answer.toLowerCase() !== 'y') {
    log('⚠️  Please verify before considering deployment complete', 'yellow');
  }
}

// ============================================================================
// Main Deployment Flow
// ============================================================================

async function main() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🚀 AgentFlow Pro - Production Deployment', 'cyan');
  log('='.repeat(70), 'cyan');

  const confirm = await question('\nThis will deploy to PRODUCTION. Continue? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    log('Deployment cancelled', 'yellow');
    process.exit(0);
  }

  try {
    await validateEnvironment();
    await preDeploymentChecks();
    await runDatabaseMigration();
    await deployToVercel();
    await verifyDeployment();

    log('\n' + '='.repeat(70), 'green');
    log('🎉 Deployment completed successfully!', 'green');
    log('='.repeat(70), 'green');

    log('\n📊 Next steps:', 'cyan');
    log('  1. Monitor Sentry for errors', 'cyan');
    log('  2. Check analytics for user activity', 'cyan');
    log('  3. Collect user feedback', 'cyan');
    log('  4. Send launch announcement', 'cyan');

  } catch (error) {
    log('\n' + '='.repeat(70), 'red');
    log('❌ Deployment failed', 'red');
    log('='.repeat(70), 'red');
    log('\nError:', 'red', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run deployment
main().catch((error) => {
  log('Fatal error:', 'red', error);
  process.exit(1);
});
