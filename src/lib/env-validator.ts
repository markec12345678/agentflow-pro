/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup
 */

export interface EnvConfig {
  // Required
  databaseUrl: string;
  nextAuthSecret: string;
  nextAuthUrl: string;

  // Email
  resendApiKey?: string;
  emailFrom?: string;

  // Stripe
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;

  // AI
  openrouterApiKey?: string;
  openaiApiKey?: string;

  // Cron
  cronSecret?: string;

  // Optional
  dryRun?: string;
  allowManualCron?: string;
  nodeEnv: string;
}

export function validateEnv(): EnvConfig {
  const config: EnvConfig = {
    nodeEnv: process.env.NODE_ENV || "development",
  };

  const errors: string[] = [];

  // ============================================================================
  // REQUIRED VARIABLES
  // ============================================================================

  // Database
  if (!process.env.DATABASE_URL) {
    errors.push("DATABASE_URL is required");
  } else {
    config.databaseUrl = process.env.DATABASE_URL;
  }

  // NextAuth
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push("NEXTAUTH_SECRET is required");
  } else {
    config.nextAuthSecret = process.env.NEXTAUTH_SECRET;
  }

  if (!process.env.NEXTAUTH_URL) {
    errors.push("NEXTAUTH_URL is required");
  } else {
    config.nextAuthUrl = process.env.NEXTAUTH_URL;
  }

  // ============================================================================
  // FEATURE-SPECIFIC VARIABLES
  // ============================================================================

  // Email (required for email notifications)
  if (process.env.RESEND_API_KEY) {
    config.resendApiKey = process.env.RESEND_API_KEY;
  }

  if (process.env.EMAIL_FROM) {
    config.emailFrom = process.env.EMAIL_FROM;
  }

  // Stripe (required for refunds and subscriptions)
  if (process.env.STRIPE_SECRET_KEY) {
    config.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  }

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    config.stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  // AI (required for recommendations)
  if (process.env.OPENROUTER_API_KEY) {
    config.openrouterApiKey = process.env.OPENROUTER_API_KEY;
  }

  if (process.env.OPENAI_API_KEY) {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  // Cron
  if (process.env.CRON_SECRET) {
    config.cronSecret = process.env.CRON_SECRET;
  }

  // ============================================================================
  // OPTIONAL VARIABLES
  // ============================================================================

  if (process.env.DRY_RUN) {
    config.dryRun = process.env.DRY_RUN;
  }

  if (process.env.ALLOW_MANUAL_CRON) {
    config.allowManualCron = process.env.ALLOW_MANUAL_CRON;
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  // Check if at least one AI provider is configured
  const hasAiProvider = config.openrouterApiKey || config.openaiApiKey;
  if (!hasAiProvider && config.nodeEnv === "production") {
    logger.warn(
      "⚠️  WARNING: No AI provider configured (OPENROUTER_API_KEY or OPENAI_API_KEY)",
    );
    logger.warn("   AI recommendations will not work in production");
  }

  // Check Stripe configuration
  const hasStripe = config.stripeSecretKey && config.stripeWebhookSecret;
  if (!hasStripe && config.nodeEnv === "production") {
    logger.warn("⚠️  WARNING: Stripe not fully configured");
    logger.warn("   Refunds and subscriptions will not work");
  }

  // Throw errors in production
  if (errors.length > 0) {
    if (config.nodeEnv === "production") {
      throw new Error(
        `Missing required environment variables:\n${errors.join("\n")}`,
      );
    } else {
      logger.warn("⚠️  Development mode - missing environment variables:");
      errors.forEach((err) => logger.warn(`   - ${err}`));
    }
  }

  return config;
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

/**
 * Check if AI service is configured
 */
export function isAiConfigured(): boolean {
  return !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
}

/**
 * Get feature flags based on configuration
 */
export function getFeatureFlags() {
  return {
    emailEnabled: isEmailConfigured(),
    stripeEnabled: isStripeConfigured(),
    aiEnabled: isAiConfigured(),
    cronEnabled: !!process.env.CRON_SECRET,
    dryRun: process.env.DRY_RUN === "true",
  };
}

// Auto-validate on import (in production)
if (process.env.NODE_ENV === "production") {
  validateEnv();
}
