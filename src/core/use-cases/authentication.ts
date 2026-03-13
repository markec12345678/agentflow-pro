/**
 * Use Case: Authentication
 * 
 * User authentication (login, register, password reset).
 */

import { User } from '../domain/shared/entities/user'

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface LoginInput {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginOutput {
  user: User
  token: string
  refreshToken?: string
  expiresAt: Date
}

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: string
}

export interface RegisterOutput {
  user: User
  token: string
  needsVerification: boolean
}

export interface PasswordResetInput {
  email: string
}

export interface PasswordResetOutput {
  success: boolean
  resetTokenSent: boolean
}

export interface VerifyEmailInput {
  token: string
}

export interface VerifyEmailOutput {
  success: boolean
  verified: boolean
}

// ============================================================================
// Use Case Class
// ============================================================================

export class Authentication {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService,
    private emailService: EmailService
  ) {}

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<LoginOutput> {
    const { email, password, rememberMe } = input

    // 1. Find user by email
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      throw new Error('Invalid email or password')
    }

    // 2. Verify password
    const isValid = await this.passwordHasher.verify(password, user.passwordHash)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // 3. Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }

    // 4. Generate tokens
    const token = await this.tokenService.generateAccessToken(user)
    const refreshToken = rememberMe ? await this.tokenService.generateRefreshToken(user) : undefined
    const expiresAt = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000)

    // 5. Update last login
    await this.userRepository.updateLastLogin(user.id)

    return {
      user,
      token,
      refreshToken,
      expiresAt
    }
  }

  /**
   * Register new user
   */
  async register(input: RegisterInput): Promise<RegisterOutput> {
    const { email, password, firstName, lastName, phone, role = 'guest' } = input

    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // 2. Hash password
    const passwordHash = await this.passwordHasher.hash(password)

    // 3. Create user
    const user = User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role,
      isActive: false, // Needs email verification
      isEmailVerified: false
    })

    await this.userRepository.save(user)

    // 4. Generate verification token
    const verificationToken = await this.tokenService.generateEmailVerificationToken(user)

    // 5. Send verification email
    await this.emailService.sendVerificationEmail(user.email, verificationToken)

    // 6. Generate access token
    const token = await this.tokenService.generateAccessToken(user)

    return {
      user,
      token,
      needsVerification: true
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(input: PasswordResetInput): Promise<PasswordResetOutput> {
    const { email } = input

    // 1. Find user
    const user = await this.userRepository.findByEmail(email)
    
    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, resetTokenSent: false }
    }

    // 2. Generate reset token
    const resetToken = await this.tokenService.generatePasswordResetToken(user)

    // 3. Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken)

    return { success: true, resetTokenSent: true }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 1. Verify token
    const userId = await this.tokenService.verifyPasswordResetToken(token)
    if (!userId) {
      throw new Error('Invalid or expired reset token')
    }

    // 2. Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // 3. Hash new password
    const passwordHash = await this.passwordHasher.hash(newPassword)

    // 4. Update password
    await this.userRepository.updatePassword(user.id, passwordHash)

    // 5. Invalidate reset token
    await this.tokenService.invalidateToken(token)
  }

  /**
   * Verify email
   */
  async verifyEmail(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
    const { token } = input

    // 1. Verify token
    const userId = await this.tokenService.verifyEmailVerificationToken(token)
    if (!userId) {
      return { success: false, verified: false }
    }

    // 2. Get user
    const user = await this.userRepository.findById(userId)
    if (!user) {
      return { success: false, verified: false }
    }

    // 3. Mark email as verified
    await this.userRepository.markEmailVerified(user.id)

    return { success: true, verified: true }
  }
}

// ============================================================================
// Repository/Service Interfaces
// ============================================================================

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
  updateLastLogin(id: string): Promise<void>
  updatePassword(id: string, passwordHash: string): Promise<void>
  markEmailVerified(id: string): Promise<void>
}

export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, hash: string): Promise<boolean>
}

export interface TokenService {
  generateAccessToken(user: User): Promise<string>
  generateRefreshToken(user: User): Promise<string>
  generateEmailVerificationToken(user: User): Promise<string>
  generatePasswordResetToken(user: User): Promise<string>
  verifyEmailVerificationToken(token: string): Promise<string | null>
  verifyPasswordResetToken(token: string): Promise<string | null>
  invalidateToken(token: string): Promise<void>
}

export interface EmailService {
  sendVerificationEmail(email: string, token: string): Promise<void>
  sendPasswordResetEmail(email: string, token: string): Promise<void>
}
