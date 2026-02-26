/**
 * AgentFlow Pro - User Authentication & Management
 * Complete user management system with authentication
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

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
    console.log(`Password reset link: /reset-password?token=${user.passwordResetToken}`);
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
    role: 'admin' | 'member',
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

  // Database methods (mock implementations - would connect to real database)
  private async saveUser(user: User): Promise<void> {
    // Mock implementation - would save to database
    console.log('Saving user:', user.id);
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    // Mock implementation - would query database
    return null;
  }

  private async getUserById(id: string): Promise<User | null> {
    // Mock implementation - would query database
    return null;
  }

  private async getUserByEmailVerificationToken(token: string): Promise<User | null> {
    // Mock implementation - would query database
    return null;
  }

  private async getUserByPasswordResetToken(token: string): Promise<User | null> {
    // Mock implementation - would query database
    return null;
  }

  private async saveSession(session: AuthSession): Promise<void> {
    // Mock implementation - would save to database
    console.log('Saving session:', session.id);
  }

  private async removeSessions(userId: string): Promise<void> {
    // Mock implementation - would remove from database
    console.log('Removing sessions for user:', userId);
  }

  private async saveTeam(team: Team): Promise<void> {
    // Mock implementation - would save to database
    console.log('Saving team:', team.id);
  }

  private async saveTeamMember(teamMember: TeamMember): Promise<void> {
    // Mock implementation - would save to database
    console.log('Saving team member:', teamMember.id);
  }

  private async getTeamMember(id: string): Promise<TeamMember | null> {
    // Mock implementation - would query database
    return null;
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
    // Mock implementation - would query database
    return [];
  }

  // Get team members
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    // Mock implementation - would query database
    return [];
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
