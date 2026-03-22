import { prisma } from "@/database/schema";
import { AuthService, AuthError } from "./auth.service";
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UsageAlert,
  Team,
} from "../types/user";

export class UserService {
  private prisma = prisma;

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

    // Save user to database (Prisma User: email, name, passwordHash, role, trialEndsAt, emailVerified)
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        passwordHash: hashedPassword,
        name: userData.name,
        role: (userData.role.id === "admin" ? "ADMIN" : userData.role.id === "editor" ? "EDITOR" : "VIEWER") as "ADMIN" | "EDITOR" | "VIEWER",
        emailVerified: userData.emailVerified ? new Date() : null,
        trialEndsAt: userData.status.trialEndsAt ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
      }
    });

    // Create subscription (planId, status)
    await this.prisma.subscription.create({
      data: {
        userId: user.id,
        planId: userData.plan.id,
        status: userData.status.status,
        currentPeriodEnd: userData.status.trialEndsAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Create session (Prisma Session: sessionToken, userId, expires)
    const session = AuthService.createSession(
      { ...user, role: { id: "user", name: "User", permissions: [], level: 1 } } as unknown as User,
      "127.0.0.1",
      "User-Agent"
    );

    await this.prisma.session.create({
      data: {
        id: session.id,
        userId: user.id,
        sessionToken: session.token,
        expires: session.expiresAt,
      },
    });

    // Send email verification
    await this.sendEmailVerification(user.email);

    return {
      user: user as unknown as User,
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
      include: { subscription: true },
    });

    if (!user || !user.passwordHash) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await AuthService.verifyPassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError('INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Create session (cast: Prisma user shape differs from User type)
    const session = AuthService.createSession(user as unknown as User, ipAddress, userAgent);

    await this.prisma.session.create({
      data: {
        id: session.id,
        userId: user.id,
        sessionToken: session.token,
        expires: session.expiresAt,
      },
    });

    // Update last login (if User model has lastLoginAt - omit if not in schema)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    // Remove password from response
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as unknown as User,
      session,
      token: session.token,
      refreshToken: session.refreshToken,
    };
  }

  /**
   * Logout user (delete session by sessionToken; Prisma Session has no isActive)
   */
  async logout(sessionToken: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { sessionToken },
    });
  }

  /**
   * Refresh token
   * Note: Prisma Session only has sessionToken, userId, expires - no refreshToken.
   * For now we find by sessionToken (if passed) and re-issue; otherwise throw.
   */
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    // Prisma Session has no refreshToken - look up by sessionToken (caller may pass session token)
    const session = await this.prisma.session.findFirst({
      where: {
        sessionToken: refreshToken,
        expires: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new AuthError('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token');
    }

    const newToken = AuthService.generateToken({
      userId: session.userId,
      email: session.user.email,
      role: typeof session.user.role === 'string' ? session.user.role : (session.user.role as { name: string }).name,
    });
    const newRefreshToken = AuthService.generateRefreshToken();

    // Update session with new token
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        sessionToken: newToken,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
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
      include: { subscription: true },
    });

    if (!user) {
      return null;
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as unknown as User;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const updateData: { name?: string; image?: string; updatedAt: Date } = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.avatar !== undefined) updateData.image = data.avatar;
    // settings stored in UserSettings - Prisma User has no settings field; omit for now

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { subscription: true },
    });

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as unknown as User;
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

    if (!user || !user.passwordHash) {
      throw new AuthError('USER_NOT_FOUND', 'User not found');
    }

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

    // Delete all sessions (Prisma Session has no isActive)
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const { email } = AuthService.verifyEmailToken(token);

      await this.prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
    } catch (_error) {
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

      const user = await this.prisma.user.update({
        where: { email },
        data: {
          passwordHash: newPasswordHash,
          updatedAt: new Date(),
        },
        select: { id: true }
      });

      // Invalidate all sessions for this user (log out everywhere)
      await this.prisma.session.deleteMany({
        where: { userId: user.id }
      }).catch(() => { /* Ignore if Session schema differs */ });
    } catch (_error) {
      throw new AuthError('INVALID_RESET_TOKEN', 'Invalid or expired reset token');
    }
  }

  /**
   * Create team (Prisma Team: name, ownerId only; TeamMember: userId, teamId, role)
   */
  async createTeam(userId: string, data: { name: string; slug: string; description?: string }): Promise<Team> {
    const team = await this.prisma.team.create({
      data: {
        name: data.name,
        ownerId: userId,
      },
      include: {
        members: { include: { user: true } },
        owner: true,
      },
    });

    await this.prisma.teamMember.create({
      data: {
        userId,
        teamId: team.id,
        role: 'owner',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeTeamId: team.id },
    });

    return team as unknown as Team;
  }

  /**
   * Invite team member (creates Invite record; Prisma TeamMember requires userId)
   */
  async inviteTeamMember(teamId: string, data: { email: string; role: string; permissions?: string[] }): Promise<void> {
    const existingMember = await this.prisma.teamMember.findFirst({
      where: {
        teamId,
        user: { email: data.email },
      },
    });

    if (existingMember) {
      throw new AuthError('ALREADY_MEMBER', 'User is already a team member');
    }

    const token = AuthService.generateRefreshToken();
    await this.prisma.invite.create({
      data: {
        teamId,
        email: data.email,
        role: data.role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

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
      },
    });

    return alert as unknown as UsageAlert;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      return null;
    }

    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword as unknown as User;
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

    return teams as unknown as Team[];
  }

  /**
   * Send email verification (used by register and resend-verification)
   */
  async sendEmailVerification(email: string): Promise<void> {
    const token = AuthService.generateEmailVerificationToken(email);
    const { sendVerificationEmail } = await import('@/lib/email/send');
    await sendVerificationEmail(email, token);
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const { sendPasswordResetEmail: sendResetEmail } = await import('@/lib/email/send');
    await sendResetEmail(email, token);
  }

  /**
   * Send team invitation email
   * @param inviteLink - Optional invite link (e.g. /invite/{token}). If not provided, uses generic /settings/teams.
   */
  private async sendTeamInvitation(
    email: string,
    teamId: string,
    role: string,
    inviteLink?: string
  ): Promise<void> {
    const baseUrl = process.env.NEXTAUTH_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3002');
    const link = inviteLink ?? `${baseUrl}/settings/teams`;
    const { sendTeamInviteEmail } = await import('@/lib/email/send');
    await sendTeamInviteEmail(email, link, role);
  }
}
