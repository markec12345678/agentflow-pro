#!/usr/bin/env node

/**
 * AgentFlow Pro - Production Environment Setup Wizard
 *
 * Interactive CLI to guide you through production setup step-by-step
 * 
 * Usage: node scripts/setup-production-env.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function log(message, emoji = '📝') {
  console.log(`\n${emoji} ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

function warning(message) {
  console.log(`⚠️  ${message}`);
}

function error(message) {
  console.log(`❌ ${message}`);
}

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64');
}

function generateHexSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// ============================================================================
// STEP 1: Welcome & Prerequisites
// ============================================================================

async function welcome() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 AgentFlow Pro - Production Environment Setup Wizard');
  console.log('='.repeat(70));
  console.log('\nThis wizard will guide you through setting up production environment.');
  console.log('\n📋 What you\'ll need:');
  console.log('   1. Database provider (Supabase/Neon)');
  console.log('   2. Stripe account (live mode)');
  console.log('   3. Domain name');
  console.log('   4. OpenAI API key');
  console.log('   5. Email provider (Resend)');
  console.log('   6. Vercel account');
  console.log('\n⏱️  Estimated time: 15-20 minutes');
  
  const start = await question('\nReady to begin? (y/n): ');
  if (start.toLowerCase() !== 'y') {
    log('Setup cancelled. Run this script again when ready.', '👋');
    process.exit(0);
  }
}

// ============================================================================
// STEP 2: Database Setup
// ============================================================================

async function setupDatabase() {
  log('Step 1: Database Configuration', '🗄️');
  console.log('\nChoose your database provider:');
  console.log('   1. Supabase (Recommended - PostgreSQL with extras)');
  console.log('   2. Neon (Serverless PostgreSQL)');
  console.log('   3. I already have a connection string');
  
  const choice = await question('\nSelect option (1-3): ');
  
  let databaseUrl = '';
  
  if (choice === '1') {
    log('Supabase Setup:', '📚');
    console.log('\n1. Go to https://supabase.com');
    console.log('2. Create new project');
    console.log('3. Wait for database to be ready');
    console.log('4. Go to Settings → Database');
    console.log('5. Copy "Connection string" (URI mode)');
    
    const ready = await question('\nIs your Supabase database ready? (y/n): ');
    if (ready.toLowerCase() !== 'y') {
      warning('Please create your database first, then run this script again.');
      process.exit(0);
    }
    
    databaseUrl = await question('Paste your Supabase connection string: ');
    
  } else if (choice === '2') {
    log('Neon Setup:', '💎');
    console.log('\n1. Go to https://neon.tech');
    console.log('2. Create new project');
    console.log('3. Copy connection string');
    
    const ready = await question('\nIs your Neon database ready? (y/n): ');
    if (ready.toLowerCase() !== 'y') {
      warning('Please create your database first, then run this script again.');
      process.exit(0);
    }
    
    databaseUrl = await question('Paste your Neon connection string: ');
    
  } else {
    databaseUrl = await question('Paste your PostgreSQL connection string: ');
  }
  
  // Add connection pooling params
  if (!databaseUrl.includes('connection_limit')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl += `${separator}connection_limit=5&connect_timeout=15`;
  }
  
  success('Database configured');
  return { databaseUrl };
}

// ============================================================================
// STEP 3: Authentication Setup
// ============================================================================

async function setupAuthentication() {
  log('Step 2: Authentication Configuration', '🔐');
  
  const nextauthSecret = generateSecret(32);
  success(`Generated NEXTAUTH_SECRET: ${nextauthSecret.substring(0, 20)}...`);
  
  const domain = await question('\nWhat is your production domain? (e.g., agentflow.pro): ');
  const nextauthUrl = `https://${domain}`;
  success(`NEXTAUTH_URL: ${nextauthUrl}`);
  
  console.log('\nGoogle OAuth Setup:');
  console.log('1. Go to https://console.cloud.google.com/apis/credentials');
  console.log('2. Create OAuth 2.0 Client ID');
  console.log('3. Add authorized redirect URI:');
  console.log(`   ${nextauthUrl}/api/auth/callback/google`);
  console.log('4. Copy Client ID and Client Secret');
  
  const googleSetup = await question('\nHave you configured Google OAuth? (y/n): ');
  
  let googleClientId = '';
  let googleClientSecret = '';
  
  if (googleSetup.toLowerCase() === 'y') {
    googleClientId = await question('Enter Google Client ID: ');
    googleClientSecret = await question('Enter Google Client Secret: ');
    success('Google OAuth configured');
  } else {
    warning('Google OAuth skipped. You can add it later.');
  }
  
  const adminEmail = await question('\nEnter admin email (for /admin access): ');
  
  return {
    nextauthSecret,
    nextauthUrl,
    googleClientId,
    googleClientSecret,
    adminEmail,
  };
}

// ============================================================================
// STEP 4: Stripe Setup
// ============================================================================

async function setupStripe() {
  log('Step 3: Stripe Configuration', '💳');
  
  console.log('\nStripe Live Mode Setup:');
  console.log('1. Go to https://dashboard.stripe.com');
  console.log('2. Switch to "Live mode" (toggle in top right)');
  console.log('3. Go to Products → Add product');
  console.log('\nCreate 3 products:');
  console.log('   - Starter: €59/month');
  console.log('   - Pro: €99/month');
  console.log('   - Enterprise: €499/month');
  
  const productsCreated = await question('\nHave you created the 3 products? (y/n): ');
  
  if (productsCreated.toLowerCase() !== 'y') {
    warning('Please create products first, then run this script again.');
    process.exit(0);
  }
  
  console.log('\n4. Get Price IDs from Stripe Dashboard → Products → Click each product');
  
  const stripeSecretKey = await question('\nEnter STRIPE_SECRET_KEY (sk_live_...): ');
  const stripePublishableKey = await question('Enter NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...): ');
  
  console.log('\nWebhook Configuration:');
  console.log('1. Go to Developers → Webhooks → Add endpoint');
  console.log(`2. Endpoint URL: https://your-domain.com/api/webhooks/stripe`);
  console.log('3. Events to listen:');
  console.log('   - checkout.session.completed');
  console.log('   - customer.subscription.updated');
  console.log('   - invoice.payment_failed');
  console.log('4. Copy webhook signing secret');
  
  const stripeWebhookSecret = await question('\nEnter STRIPE_WEBHOOK_SECRET (whsec_...): ');
  
  const priceStarter = await question('\nEnter Starter plan Price ID (price_live_...): ');
  const pricePro = await question('Enter Pro plan Price ID (price_live_...): ');
  const priceEnterprise = await question('Enter Enterprise plan Price ID (price_live_...): ');
  
  success('Stripe configured');
  
  return {
    stripeSecretKey,
    stripePublishableKey,
    stripeWebhookSecret,
    priceStarter,
    pricePro,
    priceEnterprise,
  };
}

// ============================================================================
// STEP 5: AI Agents Setup
// ============================================================================

async function setupAIAgents() {
  log('Step 4: AI Agents Configuration', '🤖');
  
  console.log('\nOpenAI API Key:');
  console.log('1. Go to https://platform.openai.com/api-keys');
  console.log('2. Create new secret key');
  console.log('3. Copy the key (shown only once!)');
  
  const openaiApiKey = await question('\nEnter OPENAI_API_KEY (sk-...): ');
  
  const geminiSetup = await question('\nDo you want to configure Google Gemini? (y/n): ');
  let geminiApiKey = '';
  if (geminiSetup.toLowerCase() === 'y') {
    console.log('1. Go to https://aistudio.google.com/app/apikey');
    geminiApiKey = await question('Enter GEMINI_API_KEY: ');
  }
  
  const firecrawlSetup = await question('\nDo you want to configure Firecrawl (web scraping)? (y/n): ');
  let firecrawlApiKey = '';
  if (firecrawlSetup.toLowerCase() === 'y') {
    console.log('1. Go to https://www.firecrawl.dev');
    firecrawlApiKey = await question('Enter FIRECRAWL_API_KEY: ');
  }
  
  success('AI Agents configured');
  
  return {
    openaiApiKey,
    geminiApiKey,
    firecrawlApiKey,
  };
}

// ============================================================================
// STEP 6: Email Setup
// ============================================================================

async function setupEmail() {
  log('Step 5: Email Configuration', '📧');
  
  console.log('\nResend Setup:');
  console.log('1. Go to https://resend.com');
  console.log('2. Create account');
  console.log('3. Create API key');
  console.log('4. Verify your domain');
  
  const resendApiKey = await question('\nEnter RESEND_API_KEY (re_...): ');
  const domain = await question('Enter verified domain for "From" address (e.g., agentflow.pro): ');
  const emailFrom = `AgentFlow Pro <noreply@${domain}>`;
  
  success('Email configured');
  
  return {
    resendApiKey,
    emailFrom,
  };
}

// ============================================================================
// STEP 7: Monitoring Setup
// ============================================================================

async function setupMonitoring() {
  log('Step 6: Monitoring Configuration', '📊');
  
  const setupSentry = await question('\nDo you want to configure Sentry for error tracking? (y/n): ');
  
  let sentryDsn = '';
  if (setupSentry.toLowerCase() === 'y') {
    console.log('\nSentry Setup:');
    console.log('1. Go to https://sentry.io');
    console.log('2. Create project (Next.js)');
    console.log('3. Copy DSN from Settings → Projects');
    
    sentryDsn = await question('\nEnter SENTRY_DSN: ');
    success('Sentry configured');
  }
  
  const cronSecret = generateHexSecret(32);
  success(`Generated CRON_SECRET: ${cronSecret.substring(0, 20)}...`);
  
  return {
    sentryDsn,
    cronSecret,
  };
}

// ============================================================================
// STEP 8: Generate Environment File
// ============================================================================

function generateEnvFile(config) {
  log('Generating environment file...', '📝');
  
  const envContent = `# =============================================================================
# AgentFlow Pro - Production Environment
# Generated: ${new Date().toISOString()}
# Set these in Vercel Dashboard → Settings → Environment Variables
# =============================================================================

# =============================================================================
# 🗄️ DATABASE
# =============================================================================
DATABASE_URL="${config.database.databaseUrl}"

# =============================================================================
# 🔐 AUTHENTICATION
# =============================================================================
NEXTAUTH_SECRET="${config.auth.nextauthSecret}"
NEXTAUTH_URL="${config.auth.nextauthUrl}"
GOOGLE_CLIENT_ID="${config.auth.googleClientId || ''}"
GOOGLE_CLIENT_SECRET="${config.auth.googleClientSecret || ''}"
ADMIN_EMAILS="${config.auth.adminEmail}"

# =============================================================================
# 💳 STRIPE
# =============================================================================
STRIPE_SECRET_KEY="${config.stripe.stripeSecretKey}"
STRIPE_WEBHOOK_SECRET="${config.stripe.stripeWebhookSecret}"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${config.stripe.stripePublishableKey}"
STRIPE_PRICE_STARTER="${config.stripe.priceStarter}"
STRIPE_PRICE_PRO="${config.stripe.pricePro}"
STRIPE_PRICE_ENTERPRISE="${config.stripe.priceEnterprise}"

# =============================================================================
# 🤖 AI AGENTS
# =============================================================================
MOCK_MODE="false"
DRY_RUN="false"
OPENAI_API_KEY="${config.ai.openaiApiKey}"
GEMINI_API_KEY="${config.ai.geminiApiKey || ''}"
FIRECRAWL_API_KEY="${config.ai.firecrawlApiKey || ''}"

# =============================================================================
# 📧 EMAIL
# =============================================================================
RESEND_API_KEY="${config.email.resendApiKey}"
EMAIL_FROM="${config.email.emailFrom}"

# =============================================================================
# 📊 MONITORING
# =============================================================================
SENTRY_DSN="${config.monitoring.sentryDsn || ''}"
CRON_SECRET="${config.monitoring.cronSecret}"

# =============================================================================
# 🎛️ PRODUCTION FLAGS
# =============================================================================
NODE_ENV="production"
`;

  const envPath = path.join(process.cwd(), '.env.production.generated');
  fs.writeFileSync(envPath, envContent);
  
  success(`Environment file generated: ${envPath}`);
  
  return envPath;
}

// ============================================================================
// STEP 9: Vercel Setup Instructions
// ============================================================================

async function vercelInstructions() {
  log('Step 7: Vercel Deployment', '▲');
  
  console.log('\n📋 Vercel Setup:');
  console.log('\n1. Go to https://vercel.com/dashboard');
  console.log('2. Import your GitHub repository');
  console.log('3. Go to Project Settings → Environment Variables');
  console.log('4. Add all variables from .env.production.generated');
  console.log('5. Go to Domains → Add your domain');
  console.log('6. Configure DNS as instructed');
  
  const hasVercelCli = await question('\nDo you have Vercel CLI installed? (y/n): ');
  
  if (hasVercelCli.toLowerCase() === 'y') {
    try {
      execSync('which vercel', { stdio: 'ignore' });
      success('Vercel CLI found');
      
      const deploy = await question('\nDo you want to deploy now? (y/n): ');
      if (deploy.toLowerCase() === 'y') {
        log('Deploying to Vercel...', '🚀');
        execSync('vercel --prod', { stdio: 'inherit' });
        success('Deployment complete!');
      }
    } catch (error) {
      warning('Vercel CLI not found. Install with: npm install -g vercel');
    }
  }
  
  console.log('\n📊 Post-Deployment Checklist:');
  console.log('   ✓ Homepage loads');
  console.log('   ✓ Login works');
  console.log('   ✓ Registration works');
  console.log('   ✓ Stripe checkout test (use test card first)');
  console.log('   ✓ Check Sentry for errors');
  console.log('   ✓ Verify cron jobs running');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    await welcome();
    
    const config = {
      database: await setupDatabase(),
      auth: await setupAuthentication(),
      stripe: await setupStripe(),
      ai: await setupAIAgents(),
      email: await setupEmail(),
      monitoring: await setupMonitoring(),
    };
    
    const envPath = generateEnvFile(config);
    
    await vercelInstructions();
    
    console.log('\n' + '='.repeat(70));
    success('🎉 Production environment setup complete!');
    console.log('='.repeat(70));
    
    console.log('\n📁 Next steps:');
    console.log(`   1. Review: ${envPath}`);
    console.log('   2. Set variables in Vercel Dashboard');
    console.log('   3. Run database migrations: npm run db:migrate:prod');
    console.log('   4. Deploy: vercel --prod');
    console.log('   5. Test thoroughly!');
    
    console.log('\n📞 Need help? Check:');
    console.log('   - PRODUCTION-LAUNCH-PLAN.md');
    console.log('   - docs/05-DEVOPS/');
    console.log('   - LAUNCH-README.md');
    
  } catch (error) {
    error('Setup failed: ' + error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
