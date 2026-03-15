/**
 * AgentFlow Pro - Test Environment Isolation
 * Create isolated sandbox environments for testing workflows
 */

export interface SandboxEnvironment {
  sandboxId: string;
  name: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'deleted';
  config: {
    isolatedDatabase: boolean;
    mockExternalAPIs: boolean;
    seedData: 'production' | 'minimal' | 'custom';
    allowedAgents: string[];
  };
  resources: {
    databaseUrl: string;
    apiKey: string;
    webhookUrl: string;
  };
  metadata: {
    createdBy: string;
    purpose: string;
    tags?: string[];
  };
}

export interface SandboxConfig {
  name: string;
  durationHours?: number;
  isolatedDatabase?: boolean;
  mockExternalAPIs?: boolean;
  seedData?: 'production' | 'minimal' | 'custom';
  allowedAgents?: string[];
  purpose?: string;
  tags?: string[];
}

export class SandboxManager {
  private sandboxes: Map<string, SandboxEnvironment> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  /**
   * Create new sandbox environment
   */
  async createSandbox(config: SandboxConfig, createdBy: string): Promise<SandboxEnvironment> {
    const sandboxId = `sandbox_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const durationHours = config.durationHours || 24;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));

    // Create isolated database
    const databaseUrl = await this.createIsolatedDatabase(sandboxId);

    // Generate API key for sandbox
    const apiKey = this.generateSandboxApiKey(sandboxId);

    const sandbox: SandboxEnvironment = {
      sandboxId,
      name: config.name || `Sandbox ${sandboxId.slice(-8)}`,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'active',
      config: {
        isolatedDatabase: config.isolatedDatabase ?? true,
        mockExternalAPIs: config.mockExternalAPIs ?? true,
        seedData: config.seedData || 'minimal',
        allowedAgents: config.allowedAgents || [],
      },
      resources: {
        databaseUrl,
        apiKey,
        webhookUrl: `/api/webhooks/sandbox/${sandboxId}`,
      },
      metadata: {
        createdBy,
        purpose: config.purpose || '',
        tags: config.tags,
      },
    };

    this.sandboxes.set(sandboxId, sandbox);

    // Seed database if requested
    if (config.seedData) {
      await this.seedDatabase(sandboxId, config.seedData);
    }

    // Start cleanup timer
    this.startCleanupTimer();

    return sandbox;
  }

  /**
   * Get sandbox by ID
   */
  getSandbox(sandboxId: string): SandboxEnvironment | null {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return null;

    // Check if expired
    if (new Date() > new Date(sandbox.expiresAt)) {
      sandbox.status = 'expired';
      return sandbox;
    }

    return sandbox;
  }

  /**
   * List all active sandboxes
   */
  listSandboxes(status?: string): SandboxEnvironment[] {
    let sandboxes = Array.from(this.sandboxes.values());

    if (status) {
      sandboxes = sandboxes.filter(s => s.status === status);
    }

    return sandboxes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Delete sandbox
   */
  async deleteSandbox(sandboxId: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return false;

    // Clean up database
    await this.dropIsolatedDatabase(sandboxId);

    // Remove sandbox
    this.sandboxes.delete(sandboxId);

    return true;
  }

  /**
   * Extend sandbox expiration
   */
  extendSandbox(sandboxId: string, additionalHours: number): SandboxEnvironment | null {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return null;

    const currentExpiry = new Date(sandbox.expiresAt);
    const newExpiry = new Date(currentExpiry.getTime() + (additionalHours * 60 * 60 * 1000));

    sandbox.expiresAt = newExpiry.toISOString();
    return sandbox;
  }

  /**
   * Get sandbox stats
   */
  getSandboxStats(): {
    totalActive: number;
    totalExpired: number;
    avgDurationHours: number;
    totalDatabaseSize: number;
  } {
    const sandboxes = Array.from(this.sandboxes.values());
    const active = sandboxes.filter(s => s.status === 'active');
    const expired = sandboxes.filter(s => s.status === 'expired');

    const avgDuration = active.reduce((sum, s) => {
      const duration = new Date(s.expiresAt).getTime() - new Date(s.createdAt).getTime();
      return sum + (duration / (1000 * 60 * 60));
    }, 0) / Math.max(1, active.length);

    return {
      totalActive: active.length,
      totalExpired: expired.length,
      avgDurationHours: Math.round(avgDuration * 100) / 100,
      totalDatabaseSize: active.length * 10, // Mock size in MB
    };
  }

  /**
   * Create isolated database for sandbox
   */
  private async createIsolatedDatabase(sandboxId: string): Promise<string> {
    // In production, create actual isolated database
    // For now, return mock URL
    return `postgresql://sandbox:${sandboxId}@localhost:5432/agentflow_sandbox_${sandboxId}`;
  }

  /**
   * Drop isolated database
   */
  private async dropIsolatedDatabase(sandboxId: string): Promise<void> {
    // In production, drop actual database
    logger.info(`[Sandbox] Dropping database for ${sandboxId}`);
  }

  /**
   * Generate API key for sandbox
   */
  private generateSandboxApiKey(sandboxId: string): string {
    return `sk_sandbox_${sandboxId}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Seed database with test data
   */
  private async seedDatabase(
    sandboxId: string,
    seedType: 'production' | 'minimal' | 'custom'
  ): Promise<void> {
    // In production, seed with actual data
    logger.info(`[Sandbox] Seeding database for ${sandboxId} with ${seedType} data`);
    
    if (seedType === 'production') {
      // Clone production data (anonymized)
      await this.cloneProductionData(sandboxId);
    } else if (seedType === 'minimal') {
      // Create minimal test data
      await this.createMinimalTestData(sandboxId);
    }
  }

  /**
   * Clone production data (anonymized)
   */
  private async cloneProductionData(sandboxId: string): Promise<void> {
    // In production, clone and anonymize production data
    logger.info(`[Sandbox] Cloning production data for ${sandboxId}`);
  }

  /**
   * Create minimal test data
   */
  private async createMinimalTestData(sandboxId: string): Promise<void> {
    // Create basic test data
    logger.info(`[Sandbox] Creating minimal test data for ${sandboxId}`);
  }

  /**
   * Start cleanup timer for expired sandboxes
   */
  private startCleanupTimer(): void {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(async () => {
      await this.cleanupExpiredSandboxes();
    }, 60 * 60 * 1000); // Check every hour
  }

  /**
   * Clean up expired sandboxes
   */
  private async cleanupExpiredSandboxes(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, sandbox] of this.sandboxes.entries()) {
      if (new Date(sandbox.expiresAt).getTime() < now) {
        await this.deleteSandbox(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Mock external APIs for sandbox
   */
  setupMockAPIs(sandboxId: string): MockAPIConfig {
    return {
      sandboxId,
      enabled: true,
      mocks: {
        email: { enabled: true, captureAll: true },
        sms: { enabled: true, captureAll: true },
        payment: { enabled: true, simulateSuccess: true },
        storage: { enabled: true, isolated: true },
      },
    };
  }
}

export interface MockAPIConfig {
  sandboxId: string;
  enabled: boolean;
  mocks: {
    email: { enabled: boolean; captureAll: boolean };
    sms: { enabled: boolean; captureAll: boolean };
    payment: { enabled: boolean; simulateSuccess: boolean };
    storage: { enabled: boolean; isolated: boolean };
  };
}

export const sandboxManager = new SandboxManager();
