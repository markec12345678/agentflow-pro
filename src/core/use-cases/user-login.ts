/**
 * Use Case: User Login
 * 
 * Authenticate user and generate tokens.
 */

// ============================================================================
// Input/Output DTOs
// ============================================================================

export interface LoginInput {
  email: string
  password: string
  rememberMe?: boolean
  ipAddress?: string
  userAgent?: string
}

export interface LoginOutput {
  success: boolean
  user: User
  token: string
  refreshToken?: string
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
}

// ============================================================================
// Use Case Class
// ============================================================================

export class UserLogin {
  constructor(
    private userRepository: UserRepository,
    private passwordHasher: PasswordHasher,
    private tokenService: TokenService
  ) {}

  /**
   * Login user
   */
  async execute(input: LoginInput): Promise<LoginOutput> {
    const { email, password, rememberMe, ipAddress, userAgent } = input

    // 1. Validate input
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    // 2. Find user by email
    const user = await this.userRepository.findByEmail(email)
    
    if (!user) {
      throw new Error('Invalid email or password')
    }

    // 3. Verify password
    const isValid = await this.passwordHasher.verify(password, user.passwordHash)
    
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // 4. Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }

    // 5. Generate tokens
    const token = await this.tokenService.generateAccessToken(user)
    const refreshToken = rememberMe 
      ? await this.tokenService.generateRefreshToken(user) 
      : undefined

    // 6. Update last login
    await this.userRepository.updateLastLogin(user.id, ipAddress, userAgent)

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      },
      token,
      refreshToken
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<void> {
    await this.tokenService.invalidateToken(token)
  }
}

// ============================================================================
// Repository/Service Interfaces
// ============================================================================

export interface UserRepository {
  findByEmail(email: string): Promise<any | null>
  findById(id: string): Promise<any | null>
  updateLastLogin(id: string, ipAddress?: string, userAgent?: string): Promise<void>
}

export interface PasswordHasher {
  hash(password: string): Promise<string>
  verify(password: string, hash: string): Promise<boolean>
}

export interface TokenService {
  generateAccessToken(user: any): Promise<string>
  generateRefreshToken(user: any): Promise<string>
  invalidateToken(token: string): Promise<void>
  verifyToken(token: string): Promise<any>
}
