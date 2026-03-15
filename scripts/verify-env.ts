/**
 * Environment Variables Verification Script
 * 
 * Checks if all required environment variables are set
 * Usage: npm run verify:production-env
 */

import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

// Required environment variables
const REQUIRED_VARS = {
  // Core
  DATABASE_URL: 'PostgreSQL connection string',
  NEXTAUTH_SECRET: 'NextAuth secret (min 32 characters)',
  NEXTAUTH_URL: 'NextAuth callback URL',
  
  // Database
  DIRECT_URL: 'Direct database connection (optional)',
  
  // Redis (optional but recommended)
  UPSTASH_REDIS_REST_URL: 'Upstash Redis URL',
  UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis token',
  
  // Stripe (for payments)
  STRIPE_SECRET_KEY: 'Stripe secret key',
  STRIPE_WEBHOOK_SECRET: 'Stripe webhook secret',
  STRIPE_PRICE_ID: 'Stripe price ID',
  
  // Email
  RESEND_API_KEY: 'Resend API key for emails',
  
  // OAuth (optional)
  GOOGLE_CLIENT_ID: 'Google OAuth client ID',
  GOOGLE_CLIENT_SECRET: 'Google OAuth secret',
  
  // AI/LLM (optional)
  OPENAI_API_KEY: 'OpenAI API key',
  GEMINI_API_KEY: 'Google Gemini API key',
  
  // Monitoring
  SENTRY_DSN: 'Sentry DSN for error tracking',
  
  // Tourism
  ETURIZEM_API_KEY: 'eTurizem API key',
};

// Optional but recommended
const RECOMMENDED_VARS = {
  VERCEL_URL: 'Vercel deployment URL',
  VERCEL_TOKEN: 'Vercel API token',
  GITHUB_TOKEN: 'GitHub personal access token',
};

console.log('🔍 Verifying Environment Variables...\n');

let allRequired = true;
const missingRequired: string[] = [];
const missingRecommended: string[] = [];

// Check required variables
console.log('📋 Required Variables:');
for (const [varName, description] of Object.entries(REQUIRED_VARS)) {
  const value = process.env[varName];
  const isSet = value && value.length > 0;
  
  if (isSet) {
    // Mask sensitive values
    const maskedValue = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`  ✅ ${varName} = ${maskedValue}`);
  } else {
    console.log(`  ❌ ${varName} - ${description}`);
    missingRequired.push(varName);
    allRequired = false;
  }
}

console.log('\n📋 Recommended Variables:');
for (const [varName, description] of Object.entries(RECOMMENDED_VARS)) {
  const value = process.env[varName];
  const isSet = value && value.length > 0;
  
  if (isSet) {
    const maskedValue = value.length > 8 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    console.log(`  ✅ ${varName} = ${maskedValue}`);
  } else {
    console.log(`  ⚠️  ${varName} - ${description}`);
    missingRecommended.push(varName);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Summary:');
console.log(`  Required: ${Object.keys(REQUIRED_VARS).length - missingRequired.length}/${Object.keys(REQUIRED_VARS).length}`);
console.log(`  Recommended: ${Object.keys(RECOMMENDED_VARS).length - missingRecommended.length}/${Object.keys(RECOMMENDED_VARS).length}`);
console.log('='.repeat(60));

if (missingRequired.length > 0) {
  console.log('\n❌ MISSING REQUIRED VARIABLES:');
  missingRequired.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  console.log('\n💡 Action Required:');
  console.log('  1. Copy .env.example to .env.local');
  console.log('  2. Fill in all required variables');
  console.log('  3. Run this script again');
  console.log('\n  cp .env.example .env.local');
  process.exit(1);
}

if (missingRecommended.length > 0) {
  console.log('\n⚠️  MISSING RECOMMENDED VARIABLES:');
  missingRecommended.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  console.log('\n💡 Consider adding these for full functionality');
}

if (allRequired && missingRecommended.length === 0) {
  console.log('\n✅ All environment variables are set!');
  console.log('🚀 Ready for production deployment!');
}

process.exit(0);
