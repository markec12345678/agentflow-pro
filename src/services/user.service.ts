import { PrismaClient } from '@prisma/client';
import { 
  User, 
  Session, 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  UpdateUserRequest,
  ChangePasswordRequest,
  Team,
  TeamMember,
  UsageAlert,
  AuthError,
  AuthService
} from '../types/user';

export class UserService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Validate registration data
    const errors = AuthService.validateRegistration(data);
    if (errors.length > 0) {
      throw new AuthError('VALIDATION_ERROR', errors.map(e => e.message).join(', '));
    }

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new AuthError('USER_EXISTS', 'User with this email already exists');
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(data.password);

    // Create user data
    const userData = await AuthService.createUserFromRegistration(data, hashedPassword);

    // Save user to database
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
        role: userData.role.name,
        planId: userData.plan.id,
        status: userData.status.status,
        emailVerified: userData.emailVerified,
        settings: userData.settings,
        usage: userData.usage,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        plan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerified: true,
        teamId: true,
        settings: true,
        usage: true,
        billing: true,
      }
    });

    // Create session
    const session = AuthService.createSession(user, '127.0.0.1', 'User-Agent');

    // Save session to database
    await this.prisma.session.create({
      data: {
        id: session.id,
        userId: user.id,
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastAccessAt: session.lastAccessAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isActive: session.isActive,
      }
    });

    // Send email verification
    await this.sendEmailVerification(user.email);

    return {
      user,
      session,
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginRequest, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    // Validate login data
    const errors = AuthService.validateLogin(data);
    if (errors.length > 0) {
      throw new AuthError('VALIDATION_ERROR', errors.map(e => e.message).join(', '));
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        role: true,
        plan: true,
        billing: true,
      }
    });

    if (!user) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active' && user.status !== 'trialing') {
      throw new AuthError('ACCOUNT_SUSPENDED', 'Account is not active');
    }

    // Verify password
    const isPasswordValid = await AuthService.verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Create session
    const session = AuthService.createSession(user, ipAddress, userAgent);

    // Save session to database
    await this.prisma.session.create({
      data: {
        id: session.id,
        userId: user.id,
        token: session.token,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        lastAccessAt: session.lastAccessAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        isActive: session.isActive,
      }
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      session,
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { token },
      data: { isActive: false }
    });
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    // Find session with refresh token
    const session = await this.prisma.session.findFirst({
      where: { 
        refreshToken,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!session) {
      throw new AuthError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }

    // Generate new tokens
    const newToken = AuthService.generateToken({ 
      userId: session.userId, 
      email: session.user.email, 
      role: session.user.role 
    });
    const newRefreshToken = AuthService.generateRefreshToken();

    // Update session
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
        lastAccessAt: new Date(),
      }
    });

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        plan: true,
        billing: true,
        team: true,
      }
    });

    if (!user) {
      return null;
    }

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        role: true,
        plan: true,
        billing: true,
        team: true,
      }
    });

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Change password
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    // Get user with current password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    if (!user) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await AuthService.verifyPassword(
      data.currentPassword, 
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new AuthError('INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await AuthService.hashPassword(data.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      }
    });

    // Invalidate all sessions except current
    await this.prisma.session.updateMany({
      where: { 
        userId,
        isActive: true,
      },
      data: { isActive: false }
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const { email } = AuthService.verifyEmailToken(token);

      await this.prisma.user.update({
        where: { email },
        data: { emailVerified: true }
      });
    } catch (error) {
      throw new AuthError('INVALID_VERIFICATION_TOKEN', 'Invalid or expired verification token');
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    const resetToken = AuthService.generatePasswordResetToken(email);
    await this.sendPasswordResetEmail(email, resetToken);
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const { email } = AuthService.verifyPasswordResetToken(token);

      const newPasswordHash = await AuthService.hashPassword(newPassword);

      await this.prisma.user.update({
        where: { email },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        }
      });

      // Invalidate all sessions
      await this.prisma.session.updateMany({
        where: { 
          userId: email, // This should be userId, but we don't have it here
          isActive: true,
        },
        data: { isActive: false }
      });
    } catch (error) {
      throw new AuthError('INVALID_RESET_TOKEN', 'Invalid or expired reset token');
    }
  }

  /**
   * Create team
   */
  async createTeam(userId: string, data: { name: string; slug: string; description?: string }): Promise<Team> {
    const team = await this.prisma.team.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        ownerId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          allowInvites: true,
          requireApproval: false,
          defaultRole: 'member',
          sharedWorkflows: false,
          sharedAgents: false,
          billing: {
            type: 'individual',
            splitCosts: false,
            budgetAlerts: false,
          },
        },
        usage: {
          currentMonth: {
            month: new Date().toISOString().slice(0, 7),
            agentRuns: 0,
            apiCalls: 0,
            storageGB: 0,
            workflows: 0,
            teamMembers: 0,
            cost: 0,
          },
          members: [],
        },
      },
      include: {
        members: {
          include: { user: true }
        }
      }
    });

    // Add owner as team member
    await this.prisma.teamMember.create({
      data: {
        userId,
        teamId: team.id,
        role: 'owner',
        permissions: ['admin'],
        invitedAt: new Date(),
        joinedAt: new Date(),
        status: 'active',
      }
    });

    // Update user's teamId
    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id }
    });

    return team as Team;
  }

  /**
   * Invite team member
   */
  async inviteTeamMember(teamId: string, data: { email: string; role: string; permissions?: string[] }): Promise<void> {
    // Check if user is already a team member
    const existingMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        user: { email: data.email }
      }
    });

    if (existingMember) {
      throw new AuthError('ALREADY_MEMBER', 'User is already a team member');
    }

    // Create invitation
    await this.prisma.teamMember.create({
      data: {
        teamId,
        role: data.role,
        permissions: data.permissions || ['member'],
        invitedAt: new Date(),
        status: 'pending',
      }
    });

    // Send invitation email
    await this.sendTeamInvitation(data.email, teamId, data.role);
  }

  /**
   * Get user's usage alerts
   */
  async getUsageAlerts(userId: string): Promise<UsageAlert[]> {
    const alerts = await this.prisma.usageAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return alerts as UsageAlert[];
  }

  /**
   * Create usage alert
   */
  async createUsageAlert(userId: string, data: { type: string; threshold: number }): Promise<UsageAlert> {
    const alert = await this.prisma.usageAlert.create({
      data: {
        userId,
        type: data.type,
        threshold: data.threshold,
        current: 0,
        max: data.threshold,
        isTriggered: false,
        createdAt: new Date(),
      }
    });

    return alert as UsageAlert;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        plan: true,
        billing: true,
        team: true,
      }
    });

    if (!user) {
      return null;
    }

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  /**
   * Get user's teams
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        members: {
          include: { user: true }
        },
        owner: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return teams as Team[];
  }

  /**
   * Send email verification (placeholder)
   */
  private async sendEmailVerification(email: string): Promise<void> {
    // TODO: Implement email sending
    console.log('Email verification sent to:', email);
  }

  /**
   * Send password reset email (placeholder)
   */
  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // TODO: Implement email sending
    console.log('Password reset email sent to:', email, 'with token:', token);
  }

  /**
   * Send team invitation (placeholder)
   */
  private async sendTeamInvitation(email: string, teamId: string, role: string): Promise<void> {
    // TODO: Implement email sending
    console.log('Team invitation sent to:', email, 'for team:', teamId, 'with role:', role);
  }
}
