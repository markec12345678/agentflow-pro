import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import {
  User,
  Session,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  AuthError,
  UserRole,
  Permission,
  SUBSCRIPTION_PLANS,
  PLAN_LIMITS
} from '../types/user';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_EXPIRES_IN = '7d';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = '30d';
  private static readonly SALT_ROUNDS = 12;

  // Default roles and permissions
  private static readonly DEFAULT_ROLES: Record<string, UserRole> = {
    admin: {
      id: 'admin',
      name: 'Administrator',
      level: 10,
      permissions: [
        // All permissions for admin
        { id: '1', name: 'Read Own Profile', resource: 'profile', action: 'read', scope: 'own' },
        { id: '2', name: 'Update Own Profile', resource: 'profile', action: 'update', scope: 'own' },
        { id: '3', name: 'Create Agents', resource: 'agents', action: 'create', scope: 'own' },
        { id: '4', name: 'Read Own Agents', resource: 'agents', action: 'read', scope: 'own' },
        { id: '5', name: 'Update Own Agents', resource: 'agents', action: 'update', scope: 'own' },
        { id: '6', name: 'Delete Own Agents', resource: 'agents', action: 'delete', scope: 'own' },
        { id: '7', name: 'Run Agents', resource: 'agents', action: 'run', scope: 'own' },
        { id: '8', name: 'Create Workflows', resource: 'workflows', action: 'create', scope: 'own' },
        { id: '9', name: 'Read Own Workflows', resource: 'workflows', action: 'read', scope: 'own' },
        { id: '10', name: 'Update Own Workflows', resource: 'workflows', action: 'update', scope: 'own' },
        { id: '11', name: 'Delete Own Workflows', resource: 'workflows', action: 'delete', scope: 'own' },
        { id: '12', name: 'Create Teams', resource: 'teams', action: 'create', scope: 'own' },
        { id: '13', name: 'Read Own Teams', resource: 'teams', action: 'read', scope: 'own' },
        { id: '14', name: 'Update Own Teams', resource: 'teams', action: 'update', scope: 'own' },
        { id: '15', name: 'Delete Own Teams', resource: 'teams', action: 'delete', scope: 'own' },
        { id: '16', name: 'Invite Team Members', resource: 'team_members', action: 'invite', scope: 'team' },
        { id: '17', name: 'Manage Team Members', resource: 'team_members', action: 'manage', scope: 'team' },
        { id: '18', name: 'Read Billing', resource: 'billing', action: 'read', scope: 'own' },
        { id: '19', name: 'Update Billing', resource: 'billing', action: 'update', scope: 'own' },
        { id: '20', name: 'Upgrade Plan', resource: 'billing', action: 'upgrade', scope: 'own' },
      ],
    },
    user: {
      id: 'user',
      name: 'User',
      level: 5,
      permissions: [
        { id: '1', name: 'Read Own Profile', resource: 'profile', action: 'read', scope: 'own' },
        { id: '2', name: 'Update Own Profile', resource: 'profile', action: 'update', scope: 'own' },
        { id: '3', name: 'Create Agents', resource: 'agents', action: 'create', scope: 'own' },
        { id: '4', name: 'Read Own Agents', resource: 'agents', action: 'read', scope: 'own' },
        { id: '5', name: 'Update Own Agents', resource: 'agents', action: 'update', scope: 'own' },
        { id: '6', name: 'Delete Own Agents', resource: 'agents', action: 'delete', scope: 'own' },
        { id: '7', name: 'Run Agents', resource: 'agents', action: 'run', scope: 'own' },
        { id: '8', name: 'Create Workflows', resource: 'workflows', action: 'create', scope: 'own' },
        { id: '9', name: 'Read Own Workflows', resource: 'workflows', action: 'read', scope: 'own' },
        { id: '10', name: 'Update Own Workflows', resource: 'workflows', action: 'update', scope: 'own' },
        { id: '11', name: 'Delete Own Workflows', resource: 'workflows', action: 'delete', scope: 'own' },
        { id: '12', name: 'Create Teams', resource: 'teams', action: 'create', scope: 'own' },
        { id: '13', name: 'Read Own Teams', resource: 'teams', action: 'read', scope: 'own' },
        { id: '14', name: 'Update Own Teams', resource: 'teams', action: 'update', scope: 'own' },
        { id: '15', name: 'Delete Own Teams', resource: 'teams', action: 'delete', scope: 'own' },
        { id: '16', name: 'Invite Team Members', resource: 'team_members', action: 'invite', scope: 'team' },
        { id: '18', name: 'Read Billing', resource: 'billing', action: 'read', scope: 'own' },
        { id: '19', name: 'Update Billing', resource: 'billing', action: 'update', scope: 'own' },
        { id: '20', name: 'Upgrade Plan', resource: 'billing', action: 'upgrade', scope: 'own' },
      ],
    },
    viewer: {
      id: 'viewer',
      name: 'Viewer',
      level: 1,
      permissions: [
        { id: '1', name: 'Read Own Profile', resource: 'profile', action: 'read', scope: 'own' },
        { id: '4', name: 'Read Own Agents', resource: 'agents', action: 'read', scope: 'own' },
        { id: '9', name: 'Read Own Workflows', resource: 'workflows', action: 'read', scope: 'own' },
        { id: '13', name: 'Read Own Teams', resource: 'teams', action: 'read', scope: 'own' },
        { id: '18', name: 'Read Billing', resource: 'billing', action: 'read', scope: 'own' },
      ],
    },
  };

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload: { userId: string; email: string; role: string }): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): { userId: string; email: string; role: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string; role: string };
    } catch (error) {
      throw new AuthError('INVALID_TOKEN', 'Invalid or expired token');
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Create session for user
   */
  static createSession(user: User, ipAddress: string, userAgent: string): Session {
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role.name
    });
    const refreshToken = this.generateRefreshToken();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    return {
      id: randomBytes(16).toString('hex'),
      userId: user.id,
      token,
      refreshToken,
      expiresAt,
      createdAt: now,
      lastAccessAt: now,
      ipAddress,
      userAgent,
      isActive: true,
    };
  }

  /**
   * Validate session token
   */
  static validateSession(token: string): { userId: string; email: string; role: string } {
    try {
      return this.verifyToken(token);
    } catch (error) {
      throw new AuthError('INVALID_SESSION', 'Invalid or expired session');
    }
  }

  /**
   * Check if user has permission
   */
  static hasPermission(user: User, resource: string, action: string, scope: 'own' | 'team' | 'global' = 'own'): boolean {
    return user.role.permissions.some(permission =>
      permission.resource === resource &&
      permission.action === action &&
      (scope === 'own' || permission.scope === scope || permission.scope === 'global')
    );
  }

  /**
   * Check if user can access resource
   */
  static canAccess(user: User, resource: string, action: string, resourceId?: string, ownerId?: string): boolean {
    // Check basic permission
    if (!this.hasPermission(user, resource, action)) {
      return false;
    }

    // If resource belongs to user, allow access
    if (ownerId === user.id) {
      return true;
    }

    // Check if user has team/global permissions
    const hasTeamPermission = user.role.permissions.some(p =>
      p.resource === resource &&
      p.action === action &&
      (p.scope === 'team' || p.scope === 'global')
    );

    return hasTeamPermission;
  }

  /**
   * Get default role for new user
   */
  static getDefaultRole(roleName: string = 'user'): UserRole {
    return this.DEFAULT_ROLES[roleName] || this.DEFAULT_ROLES.user;
  }

  /**
   * Validate registration data
   */
  static validateRegistration(data: RegisterRequest): AuthError[] {
    const errors: AuthError[] = [];

    // Email validation
    if (!data.email) {
      errors.push({ code: 'EMAIL_REQUIRED', message: 'Email is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push({ code: 'EMAIL_INVALID', message: 'Invalid email format' });
    }

    // Password validation
    if (!data.password) {
      errors.push({ code: 'PASSWORD_REQUIRED', message: 'Password is required' });
    } else if (data.password.length < 8) {
      errors.push({ code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 8 characters' });
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      errors.push({ code: 'PASSWORD_TOO_WEAK', message: 'Password must contain uppercase, lowercase, and number' });
    }

    // Name validation
    if (!data.name || data.name.trim().length < 2) {
      errors.push({ code: 'NAME_REQUIRED', message: 'Name must be at least 2 characters' });
    }

    return errors;
  }

  /**
   * Validate login data
   */
  static validateLogin(data: LoginRequest): AuthError[] {
    const errors: AuthError[] = [];

    if (!data.email) {
      errors.push({ code: 'EMAIL_REQUIRED', message: 'Email is required' });
    }

    if (!data.password) {
      errors.push({ code: 'PASSWORD_REQUIRED', message: 'Password is required' });
    }

    return errors;
  }

  /**
   * Create user from registration data
   */
  static async createUserFromRegistration(data: RegisterRequest, hashedPassword: string): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    const now = new Date();
    const defaultRole = this.getDefaultRole('user');
    const planId = data.planId || SUBSCRIPTION_PLANS.TRIAL;
    const limits = PLAN_LIMITS[planId];

    return {
      email: data.email,
      name: data.name,
      avatar: null,
      role: defaultRole,
      plan: {
        id: planId,
        name: planId.charAt(0).toUpperCase() + planId.slice(1),
        price: 0,
        interval: 'month' as const,
        features: [],
        limits,
        isActive: true,
      },
      status: {
        status: planId === SUBSCRIPTION_PLANS.TRIAL ? 'trialing' : 'active',
        trialEndsAt: planId === SUBSCRIPTION_PLANS.TRIAL ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : undefined,
      },
      emailVerified: false,
      teamId: undefined,
      settings: {
        timezone: 'UTC',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          slack: false,
          marketing: true,
          productUpdates: true,
          billing: true,
          security: true,
        },
        ui: {
          theme: 'system',
          sidebarCollapsed: false,
          defaultView: 'dashboard',
          compactMode: false,
        },
        api: {
          rateLimitPerMinute: 60,
          allowedOrigins: [],
        },
      },
      usage: {
        currentMonth: {
          month: now.toISOString().slice(0, 7), // YYYY-MM
          agentRuns: 0,
          apiCalls: 0,
          storageGB: 0,
          workflows: 0,
          teamMembers: 0,
          cost: 0,
        },
        lastMonth: {
          month: new Date(now.getFullYear(), now.getMonth() - 1).toISOString().slice(0, 7),
          agentRuns: 0,
          apiCalls: 0,
          storageGB: 0,
          workflows: 0,
          teamMembers: 0,
          cost: 0,
        },
        total: {
          totalAgentRuns: 0,
          totalApiCalls: 0,
          totalCost: 0,
          accountCreated: now,
        },
        daily: [],
      },
    };
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(email: string): string {
    return jwt.sign({ email, type: 'email_verification' }, this.JWT_SECRET, { expiresIn: '24h' });
  }

  /**
   * Verify email verification token
   */
  static verifyEmailToken(token: string): { email: string; type: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { email: string; type: string };
    } catch (error) {
      throw new AuthError('INVALID_TOKEN', 'Invalid or expired verification token');
    }
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(email: string): string {
    return jwt.sign({ email, type: 'password_reset' }, this.JWT_SECRET, { expiresIn: '1h' });
  }

  /**
   * Verify password reset token
   */
  static verifyPasswordResetToken(token: string): { email: string; type: string } {
    try {
      return jwt.verify(token, this.JWT_SECRET) as { email: string; type: string };
    } catch (error) {
      throw new AuthError('INVALID_TOKEN', 'Invalid or expired reset token');
    }
  }
}

// Custom error class
export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
