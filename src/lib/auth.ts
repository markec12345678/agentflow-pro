/**
 * AgentFlow Pro - User Authentication & Management
 * Legacy auth API backed by Prisma. Main auth flow uses NextAuth + auth-users.
 */

import bcrypt from 'bcryptjs';
import { logger } from '@/infrastructure/observability/logger';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/database/schema';

// User interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // hashed
  role: 'user' | 'admin' | 'owner';
  plan?: 'starter' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Team {
  id: string;
  name: string;
  ownerId: string;
  plan: 'starter' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
  invitedBy: string;
  invitedAt: Date;
  joinedAt?: Date;
  status: 'pending' | 'active' | 'inactive';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Authentication service
export class AuthService {
  private static instance: AuthService;
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private readonly JWT_EXPIRES_IN = '24h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // User registration
  async registerUser(userData: {
    email: string;
    name: string;
    password: string;
    plan?: 'starter' | 'pro' | 'enterprise';
  }): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Create user
    const user: User = {
      id: uuidv4(),
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      role: 'user',
      plan: userData.plan || 'starter',
      emailVerified: false,
      emailVerificationToken: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save user to database (mock for now)
    await this.saveUser(user);

    // Create tokens
    const tokens = this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  // User login
  async loginUser(credentials: {
    email: string;
    password: string;
  }): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    // Find user by email
    const user = await this.getUserByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.updatedAt = new Date();
    await this.saveUser(user);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  // OAuth login (Google, GitHub)
  async oauthLogin(provider: 'google' | 'github', profile: {
    email: string;
    name: string;
    providerId: string;
  }): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    // Find or create user
    let user = await this.getUserByEmail(profile.email);

    if (!user) {
      // Create new user from OAuth
      const randomPassword = uuidv4(); // Random password for OAuth users
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = {
        id: uuidv4(),
        email: profile.email,
        name: profile.name,
        password: hashedPassword,
        role: 'user',
        plan: 'starter',
        emailVerified: true, // OAuth users are pre-verified
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.saveUser(user);
    } else {
      // Update last login
      user.lastLoginAt = new Date();
      user.updatedAt = new Date();
      await this.saveUser(user);
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Create session
    await this.createSession(user.id, tokens.accessToken);

    // Return user without password
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, tokens };
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
      const user = await this.getUserById(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Create new session
      await this.createSession(user.id, tokens.accessToken);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout
  async logout(userId: string): Promise<void> {
    // Remove all sessions for user
    await this.removeSessions(userId);
  }

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    const user = await this.getUserByEmailVerificationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.updatedAt = new Date();

    await this.saveUser(user);
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    user.passwordResetToken = uuidv4();
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    user.updatedAt = new Date();

    await this.saveUser(user);

    // In production, send email with reset link
    logger.info(`Password reset link: /reset-password?token=${user.passwordResetToken}`);
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.getUserByPasswordResetToken(token);
    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.updatedAt = new Date();

    await this.saveUser(user);
  }

  // Change password
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.updatedAt = new Date();

    await this.saveUser(user);
  }

  // Update user profile
  async updateProfile(userId: string, updates: {
    name?: string;
    email?: string;
  }): Promise<Omit<User, 'password'>> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (updates.email && updates.email !== user.email) {
      // Check if email is already taken
      const existingUser = await this.getUserByEmail(updates.email);
      if (existingUser) {
        throw new Error('Email is already taken');
      }

      user.email = updates.email;
      user.emailVerified = false;
      user.emailVerificationToken = uuidv4();
    }

    if (updates.name) {
      user.name = updates.name;
    }

    user.updatedAt = new Date();
    await this.saveUser(user);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Team management
  async createTeam(userId: string, teamData: {
    name: string;
    plan: 'starter' | 'pro' | 'enterprise';
  }): Promise<Team> {
    const team: Team = {
      id: uuidv4(),
      name: teamData.name,
      ownerId: userId,
      plan: teamData.plan,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveTeam(team);

    // Add owner as team member
    await this.addTeamMember(team.id, userId, 'owner', userId);

    return team;
  }

  async addTeamMember(
    teamId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member',
    invitedBy: string
  ): Promise<TeamMember> {
    const teamMember: TeamMember = {
      id: uuidv4(),
      teamId,
      userId,
      role,
      invitedBy,
      invitedAt: new Date(),
      status: 'pending'
    };

    await this.saveTeamMember(teamMember);
    return teamMember;
  }

  async acceptTeamInvitation(teamMemberId: string): Promise<void> {
    const teamMember = await this.getTeamMember(teamMemberId);
    if (!teamMember) {
      throw new Error('Invitation not found');
    }

    teamMember.status = 'active';
    teamMember.joinedAt = new Date();
    await this.saveTeamMember(teamMember);
  }

  // Helper methods
  private generateTokens(user: User): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    };
  }

  private async createSession(userId: string, token: string): Promise<void> {
    const session: AuthSession = {
      id: uuidv4(),
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date()
    };

    await this.saveSession(session);
  }

  // Database methods - Prisma-backed
  private mapPrismaUserToUser(row: {
    id: string;
    email: string;
    name: string | null;
    passwordHash: string | null;
    role: string;
    emailVerified: Date | null;
    createdAt: Date;
    updatedAt: Date;
    subscription?: { planId: string; status: string; stripeCustomerId: string | null; stripeSubscriptionId: string | null } | null;
  }): User {
    const plan = (row.subscription?.planId as 'starter' | 'pro' | 'enterprise') || 'starter';
    const role = (row.role === 'ADMIN' ? 'admin' : row.role === 'EDITOR' ? 'admin' : 'user') as 'user' | 'admin' | 'owner';
    return {
      id: row.id,
      email: row.email,
      name: row.name || '',
      password: row.passwordHash || '',
      role,
      plan,
      stripeCustomerId: row.subscription?.stripeCustomerId ?? undefined,
      subscriptionId: row.subscription?.stripeSubscriptionId ?? undefined,
      subscriptionStatus: (row.subscription?.status as User['subscriptionStatus']) ?? undefined,
      emailVerified: !!row.emailVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async saveUser(user: User): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
    if (existing) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || null,
          passwordHash: user.password || undefined,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name || null,
          passwordHash: user.password,
          role: user.role === 'admin' || user.role === 'owner' ? 'ADMIN' : 'VIEWER',
        },
      });
    }
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { subscription: true },
    });
    if (!row?.passwordHash) return null;
    return this.mapPrismaUserToUser({ ...row, passwordHash: row.passwordHash });
  }

  async getUserById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!row) return null;
    return this.mapPrismaUserToUser({
      ...row,
      passwordHash: row.passwordHash ?? '',
      name: row.name ?? '',
    });
  }

  private async getUserByEmailVerificationToken(token: string): Promise<User | null> {
    return null;
  }

  private async getUserByPasswordResetToken(token: string): Promise<User | null> {
    return null;
  }

  private async saveSession(_session: AuthSession): Promise<void> {
    // JWT is stateless; no session storage needed
  }

  private async removeSessions(_userId: string): Promise<void> {
    // JWT is stateless; no server-side sessions to remove
  }

  private async saveTeam(team: Team): Promise<void> {
    const existing = await prisma.team.findUnique({ where: { id: team.id }, select: { id: true } });
    if (!existing) {
      await prisma.team.create({
        data: {
          id: team.id,
          name: team.name,
          ownerId: team.ownerId,
        },
      });
    }
  }

  private async saveTeamMember(teamMember: TeamMember): Promise<void> {
    await prisma.teamMember.upsert({
      where: { userId_teamId: { userId: teamMember.userId, teamId: teamMember.teamId } },
      create: {
        id: teamMember.id,
        userId: teamMember.userId,
        teamId: teamMember.teamId,
        role: teamMember.role,
      },
      update: { role: teamMember.role },
    });
  }

  private async getTeamMember(id: string): Promise<TeamMember | null> {
    const row = await prisma.teamMember.findUnique({
      where: { id },
      include: { team: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      teamId: row.teamId,
      userId: row.userId,
      role: row.role as 'owner' | 'admin' | 'member',
      invitedBy: row.team.ownerId,
      invitedAt: row.createdAt,
      joinedAt: row.updatedAt,
      status: 'active',
    };
  }

  // Validation methods
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Role-based access control
  hasPermission(user: User, permission: string): boolean {
    const permissions = {
      user: ['read:own', 'write:own'],
      admin: ['read:own', 'write:own', 'read:team', 'write:team'],
      owner: ['read:own', 'write:own', 'read:team', 'write:team', 'admin:team']
    };

    return permissions[user.role]?.includes(permission) || false;
  }

  // Get user teams
  async getUserTeams(userId: string): Promise<Team[]> {
    const owned = await prisma.team.findMany({
      where: { ownerId: userId },
      include: { owner: { include: { subscription: true } } },
    });
    const memberOf = await prisma.teamMember.findMany({
      where: { userId },
      include: { team: { include: { owner: { include: { subscription: true } } } } },
    });
    const teamIds = new Set<string>();
    const teams: Team[] = [];
    for (const t of owned) {
      teamIds.add(t.id);
      teams.push({
        id: t.id,
        name: t.name,
        ownerId: t.ownerId,
        plan: (t.owner.subscription?.planId as 'starter' | 'pro' | 'enterprise') || 'starter',
        stripeCustomerId: t.owner.subscription?.stripeCustomerId ?? undefined,
        subscriptionId: t.owner.subscription?.stripeSubscriptionId ?? undefined,
        subscriptionStatus: (t.owner.subscription?.status as Team['subscriptionStatus']) ?? undefined,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });
    }
    for (const m of memberOf) {
      if (teamIds.has(m.teamId)) continue;
      const t = m.team;
      teams.push({
        id: t.id,
        name: t.name,
        ownerId: t.ownerId,
        plan: (t.owner.subscription?.planId as 'starter' | 'pro' | 'enterprise') || 'starter',
        stripeCustomerId: t.owner.subscription?.stripeCustomerId ?? undefined,
        subscriptionId: t.owner.subscription?.stripeSubscriptionId ?? undefined,
        subscriptionStatus: (t.owner.subscription?.status as Team['subscriptionStatus']) ?? undefined,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      });
    }
    return teams;
  }

  // Get team members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const rows = await prisma.teamMember.findMany({
      where: { teamId },
      include: { team: true },
    });
    return rows.map((r) => ({
      id: r.id,
      teamId: r.teamId,
      userId: r.userId,
      role: r.role as 'owner' | 'admin' | 'member',
      invitedBy: r.team.ownerId,
      invitedAt: r.createdAt,
      joinedAt: r.updatedAt,
      status: 'active' as const,
    }));
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
