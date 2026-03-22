export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  plan: SubscriptionPlan;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  emailVerified: boolean;
  teamId?: string;
  settings: UserSettings;
  usage: UserUsage;
  billing?: BillingInfo;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  level: number; // 1=lowest, 10=highest
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  scope: 'own' | 'team' | 'global';
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
  stripePriceId?: string;
  isActive: boolean;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  included: boolean;
  value?: string | number;
}

export interface PlanLimits {
  maxAgents: number;
  maxRunsPerMonth: number;
  maxTeamMembers: number;
  maxWorkflows: number;
  maxStorageGB: number;
  apiCallsPerMonth: number;
  supportLevel: 'basic' | 'priority' | 'dedicated';
}

export interface UserStatus {
  status: 'active' | 'inactive' | 'suspended' | 'trialing';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  reason?: string;
}

export interface UserSettings {
  timezone: string;
  language: string;
  notifications: NotificationSettings;
  ui: UISettings;
  api: APISettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  slack: boolean;
  marketing: boolean;
  productUpdates: boolean;
  billing: boolean;
  security: boolean;
}

export interface UISettings {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  defaultView: 'dashboard' | 'agents' | 'workflows';
  compactMode: boolean;
}

export interface APISettings {
  webhookUrl?: string;
  apiKey?: string;
  rateLimitPerMinute: number;
  allowedOrigins: string[];
}

export interface UserUsage {
  currentMonth: MonthlyUsage;
  lastMonth: MonthlyUsage;
  total: TotalUsage;
  daily: DailyUsage[];
}

export interface MonthlyUsage {
  month: string; // YYYY-MM
  agentRuns: number;
  apiCalls: number;
  storageGB: number;
  workflows: number;
  teamMembers: number;
  cost: number;
}

export interface TotalUsage {
  totalAgentRuns: number;
  totalApiCalls: number;
  totalCost: number;
  accountCreated: Date;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  agentRuns: number;
  apiCalls: number;
  cost: number;
  activeAgents: number;
}

export interface BillingInfo {
  customerId: string;
  subscriptionId?: string;
  paymentMethodId?: string;
  lastPaymentAt?: Date;
  nextPaymentAt?: Date;
  amount: number;
  currency: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  cardInfo?: CardInfo;
  invoices: Invoice[];
}

export interface CardInfo {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  createdAt: Date;
  dueAt?: Date;
  paidAt?: Date;
  pdfUrl?: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  amount: number;
  currency: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar?: string;
  ownerId: string;
  members: TeamMember[];
  settings: TeamSettings;
  usage: TeamUsage;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  permissions: string[];
  invitedAt: Date;
  joinedAt?: Date;
  status: 'active' | 'pending' | 'inactive';
  user?: User;
}

export interface TeamRole {
  id: string;
  name: string;
  permissions: Permission[];
  isOwner: boolean;
  isAdmin: boolean;
}

export interface TeamSettings {
  allowInvites: boolean;
  requireApproval: boolean;
  defaultRole: string;
  sharedWorkflows: boolean;
  sharedAgents: boolean;
  billing: TeamBilling;
}

export interface TeamBilling {
  type: 'individual' | 'team';
  splitCosts: boolean;
  budgetAlerts: boolean;
  monthlyBudget?: number;
}

export interface TeamUsage {
  currentMonth: MonthlyUsage;
  members: MemberUsage[];
}

export interface MemberUsage {
  userId: string;
  userName: string;
  usage: MonthlyUsage;
  percentage: number;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessAt: Date;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
}

export interface AuthProvider {
  id: string;
  name: string;
  type: 'oauth' | 'saml' | 'ldap';
  clientId: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
}

export interface OAuthAccount {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  tokenType?: string;
  scope?: string;
  idToken?: string;
  sessionState?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  planId?: string;
  teamName?: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
  token: string;
  refreshToken?: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
  settings?: Partial<UserSettings>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateTeamRequest {
  name: string;
  slug: string;
  description?: string;
}

export interface InviteTeamMemberRequest {
  email: string;
  role: string;
  permissions?: string[];
}

export interface UpdateSubscriptionRequest {
  planId: string;
  paymentMethodId?: string;
  billingCycle?: 'month' | 'year';
}

export interface UsageAlert {
  id: string;
  userId: string;
  type: 'agent_runs' | 'api_calls' | 'storage' | 'cost';
  threshold: number;
  current: number;
  max: number;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

// Error Types
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Constants
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
} as const;

export const PERMISSIONS = {
  // User permissions
  READ_OWN_PROFILE: 'read:own:profile',
  UPDATE_OWN_PROFILE: 'update:own:profile',
  DELETE_OWN_ACCOUNT: 'delete:own:account',
  
  // Agent permissions
  CREATE_AGENTS: 'create:agents',
  READ_OWN_AGENTS: 'read:own:agents',
  UPDATE_OWN_AGENTS: 'update:own:agents',
  DELETE_OWN_AGENTS: 'delete:own:agents',
  RUN_AGENTS: 'run:agents',
  
  // Workflow permissions
  CREATE_WORKFLOWS: 'create:workflows',
  READ_OWN_WORKFLOWS: 'read:own:workflows',
  UPDATE_OWN_WORKFLOWS: 'update:own:workflows',
  DELETE_OWN_WORKFLOWS: 'delete:own:workflows',
  
  // Team permissions
  CREATE_TEAMS: 'create:teams',
  READ_OWN_TEAMS: 'read:own:teams',
  UPDATE_OWN_TEAMS: 'update:own:teams',
  DELETE_OWN_TEAMS: 'delete:own:teams',
  INVITE_TEAM_MEMBERS: 'invite:team_members',
  MANAGE_TEAM_MEMBERS: 'manage:team_members',
  
  // Billing permissions
  READ_BILLING: 'read:billing',
  UPDATE_BILLING: 'update:billing',
  UPGRADE_PLAN: 'upgrade:plan',
  
  // Admin permissions
  READ_ALL_USERS: 'read:all:users',
  MANAGE_ALL_USERS: 'manage:all:users',
  READ_SYSTEM_METRICS: 'read:system:metrics',
  MANAGE_SYSTEM: 'manage:system',
} as const;

export const SUBSCRIPTION_PLANS = {
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
  TRIAL: 'trial',
} as const;

export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.TRIAL]: {
    maxAgents: 1,
    maxRunsPerMonth: 10,
    maxTeamMembers: 1,
    maxWorkflows: 3,
    maxStorageGB: 1,
    apiCallsPerMonth: 100,
    supportLevel: 'basic' as const,
  },
  [SUBSCRIPTION_PLANS.STARTER]: {
    maxAgents: 3,
    maxRunsPerMonth: 100,
    maxTeamMembers: 2,
    maxWorkflows: 10,
    maxStorageGB: 5,
    apiCallsPerMonth: 1000,
    supportLevel: 'basic' as const,
  },
  [SUBSCRIPTION_PLANS.PRO]: {
    maxAgents: 10,
    maxRunsPerMonth: 1000,
    maxTeamMembers: 10,
    maxWorkflows: 50,
    maxStorageGB: 25,
    apiCallsPerMonth: 10000,
    supportLevel: 'priority' as const,
  },
  [SUBSCRIPTION_PLANS.ENTERPRISE]: {
    maxAgents: -1, // unlimited
    maxRunsPerMonth: -1, // unlimited
    maxTeamMembers: -1, // unlimited
    maxWorkflows: -1, // unlimited
    maxStorageGB: -1, // unlimited
    apiCallsPerMonth: -1, // unlimited
    supportLevel: 'dedicated' as const,
  },
} as const;
