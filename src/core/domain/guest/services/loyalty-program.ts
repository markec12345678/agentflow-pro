/**
 * Loyalty Program Engine
 * 
 * Comprehensive loyalty program management:
 * - Points calculation (base + multipliers)
 * - Tier progression & upgrades
 * - Benefits management
 * - Points expiration tracking
 * - Redemption options
 * - Status matching
 * - Corporate benefits
 * - Partner programs
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

import { prisma } from '@/database/schema';
import { logger } from '@/infrastructure/observability/logger';
import type { LoyaltyInfo } from '@/types/guest-experience';

// ============================================================================
// TYPES
// ============================================================================

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LoyaltyConfig {
  basePointsPerEuro: number;
  tierMultipliers: Record<LoyaltyTier, number>;
  tierThresholds: Record<LoyaltyTier, number>;
  benefits: Record<LoyaltyTier, string[]>;
  pointsExpirationMonths: number;
  redemptionOptions: RedemptionOption[];
}

export interface RedemptionOption {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  category: 'room_upgrade' | 'late_checkout' | 'breakfast' | 'spa' | 'dining' | 'experience' | 'voucher';
  value: number; // EUR value
  available: boolean;
}

export interface PointsTransaction {
  id: string;
  guestId: string;
  type: 'earn' | 'redeem' | 'adjust' | 'expire' | 'transfer';
  amount: number;
  balance: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface TierUpgrade {
  fromTier: LoyaltyTier;
  toTier: LoyaltyTier;
  qualifiedAt: Date;
  benefits: string[];
  notificationSent: boolean;
}

export interface LoyaltyStatus {
  tier: LoyaltyTier;
  points: number;
  lifetimePoints: number;
  nextTierThreshold: number;
  progressToNextTier: number; // percentage
  benefits: string[];
  expiresAt?: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  basePointsPerEuro: 10,
  tierMultipliers: {
    bronze: 1.0,
    silver: 1.2,
    gold: 1.5,
    platinum: 2.0,
    diamond: 2.5
  },
  tierThresholds: {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 15000,
    diamond: 50000
  },
  benefits: {
    bronze: ['free-wifi', 'mobile-check-in'],
    silver: ['free-wifi', 'mobile-check-in', 'late-checkout', 'welcome-drink'],
    gold: [
      'free-wifi',
      'mobile-check-in',
      'late-checkout',
      'welcome-drink',
      'room-upgrade',
      'early-check-in',
      'complimentary-newspaper'
    ],
    platinum: [
      'free-wifi',
      'mobile-check-in',
      'late-checkout',
      'welcome-drink',
      'room-upgrade',
      'early-check-in',
      'complimentary-newspaper',
      'breakfast-included',
      'spa-discount-20',
      'guaranteed-late-checkout',
      'dedicated-concierge'
    ],
    diamond: [
      'free-wifi',
      'mobile-check-in',
      'late-checkout',
      'welcome-drink',
      'room-upgrade',
      'early-check-in',
      'complimentary-newspaper',
      'breakfast-included',
      'spa-discount-30',
      'guaranteed-late-checkout',
      'dedicated-concierge',
      'airport-transfer',
      'suite-upgrade',
      'personal-butler',
      'exclusive-lounge-access'
    ]
  },
  pointsExpirationMonths: 24,
  redemptionOptions: [
    {
      id: 'room-upgrade-std',
      name: 'Room Upgrade',
      description: 'Upgrade to next room category',
      pointsRequired: 500,
      category: 'room_upgrade',
      value: 50,
      available: true
    },
    {
      id: 'late-checkout',
      name: 'Late Checkout',
      description: 'Checkout at 4 PM instead of 11 AM',
      pointsRequired: 200,
      category: 'late_checkout',
      value: 20,
      available: true
    },
    {
      id: 'breakfast-single',
      name: 'Breakfast for One',
      description: 'Complimentary breakfast for one person',
      pointsRequired: 300,
      category: 'breakfast',
      value: 30,
      available: true
    },
    {
      id: 'breakfast-double',
      name: 'Breakfast for Two',
      description: 'Complimentary breakfast for two people',
      pointsRequired: 500,
      category: 'breakfast',
      value: 60,
      available: true
    },
    {
      id: 'spa-massage-30',
      name: '30-min Spa Massage',
      description: 'Relaxing 30-minute massage treatment',
      pointsRequired: 1500,
      category: 'spa',
      value: 150,
      available: true
    },
    {
      id: 'dining-voucher-50',
      name: '€50 Dining Voucher',
      description: 'Use at any hotel restaurant',
      pointsRequired: 600,
      category: 'dining',
      value: 50,
      available: true
    },
    {
      id: 'local-experience',
      name: 'Local Experience Tour',
      description: 'Guided tour of local attractions',
      pointsRequired: 2000,
      category: 'experience',
      value: 200,
      available: true
    },
    {
      id: 'voucher-100',
      name: '€100 Stay Voucher',
      description: 'Use towards your next stay',
      pointsRequired: 1200,
      category: 'voucher',
      value: 100,
      available: true
    }
  ]
};

// ============================================================================
// MAIN CLASS
// ============================================================================

/**
 * Loyalty Program Engine
 * 
 * @example
 * ```typescript
 * const loyalty = new LoyaltyProgramEngine();
 * await loyalty.initialize();
 * 
 * const points = await loyalty.calculatePoints(stay, 'gold');
 * const upgrade = await loyalty.checkTierUpgrade(guestId);
 * ```
 */
export class LoyaltyProgramEngine {
  private config: LoyaltyConfig;
  private initialized: boolean = false;

  constructor(config: Partial<LoyaltyConfig> = {}) {
    this.config = { ...DEFAULT_LOYALTY_CONFIG, ...config };
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    this.initialized = true;
    logger.info('[LoyaltyProgram] ✅ Initialized');
  }

  // ============================================================================
  // POINTS CALCULATION
  // ============================================================================

  /**
   * Calculate points for a stay
   * 
   * @param stay - Stay information
   * @param guestTier - Guest's current tier
   * @returns Points earned
   * 
   * @example
   * ```typescript
   * const points = await loyalty.calculatePoints(
   *   { totalPrice: 1000, numberOfNights: 5 },
   *   'gold'
   * );
   * // Returns: 15000 (1000 * 10 * 1.5)
   * ```
   */
  async calculatePoints(
    stay: { totalPrice: number; numberOfNights?: number },
    guestTier: LoyaltyTier = 'bronze'
  ): Promise<number> {
    await this.ensureInitialized();

    const basePoints = stay.totalPrice * this.config.basePointsPerEuro;
    const multiplier = this.config.tierMultipliers[guestTier] || 1.0;

    return Math.round(basePoints * multiplier);
  }

  /**
   * Calculate points with bonuses
   * 
   * Bonuses:
   * - Long stay bonus (>7 nights): +10%
   * - Weekend stay bonus: +5%
   * - Special occasion: +20%
   * - Promotional bonus: variable
   */
  async calculatePointsWithBonuses(
    stay: {
      totalPrice: number;
      numberOfNights: number;
      checkIn: Date;
      checkOut: Date;
      isSpecialOccasion?: boolean;
    },
    guestTier: LoyaltyTier = 'bronze',
    promotionalMultiplier?: number
  ): Promise<{
    basePoints: number;
    tierBonus: number;
    longStayBonus: number;
    weekendBonus: number;
    specialOccasionBonus: number;
    promotionalBonus: number;
    totalPoints: number;
  }> {
    await this.ensureInitialized();

    const basePoints = stay.totalPrice * this.config.basePointsPerEuro;
    const tierMultiplier = this.config.tierMultipliers[guestTier] || 1.0;
    const tierBonus = basePoints * (tierMultiplier - 1);

    // Long stay bonus (>7 nights)
    const longStayBonus = stay.numberOfNights > 7 ? basePoints * 0.1 : 0;

    // Weekend bonus (check-in or check-out on weekend)
    const checkInDay = new Date(stay.checkIn).getDay();
    const checkOutDay = new Date(stay.checkOut).getDay();
    const isWeekend = checkInDay === 0 || checkInDay === 6 || checkOutDay === 0 || checkOutDay === 6;
    const weekendBonus = isWeekend ? basePoints * 0.05 : 0;

    // Special occasion bonus
    const specialOccasionBonus = stay.isSpecialOccasion ? basePoints * 0.2 : 0;

    // Promotional bonus
    const promotionalBonus = promotionalMultiplier ? basePoints * (promotionalMultiplier - 1) : 0;

    const totalPoints = Math.round(
      basePoints + tierBonus + longStayBonus + weekendBonus + specialOccasionBonus + promotionalBonus
    );

    return {
      basePoints: Math.round(basePoints),
      tierBonus: Math.round(tierBonus),
      longStayBonus: Math.round(longStayBonus),
      weekendBonus: Math.round(weekendBonus),
      specialOccasionBonus: Math.round(specialOccasionBonus),
      promotionalBonus: Math.round(promotionalBonus),
      totalPoints
    };
  }

  // ============================================================================
  // TIER MANAGEMENT
  // ============================================================================

  /**
   * Get current tier based on lifetime points
   */
  getTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= this.config.tierThresholds.diamond) {
      return 'diamond';
    } else if (lifetimePoints >= this.config.tierThresholds.platinum) {
      return 'platinum';
    } else if (lifetimePoints >= this.config.tierThresholds.gold) {
      return 'gold';
    } else if (lifetimePoints >= this.config.tierThresholds.silver) {
      return 'silver';
    }
    return 'bronze';
  }

  /**
   * Check if guest qualifies for tier upgrade
   */
  async checkTierUpgrade(guestId: string): Promise<TierUpgrade | null> {
    await this.ensureInitialized();

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: {
        loyalty: true,
        reservations: {
          select: {
            totalAmount: true
          }
        }
      }
    });

    if (!guest) {
      return null;
    }

    const currentTier = (guest.loyalty?.tier as LoyaltyTier) || 'bronze';
    const lifetimePoints = guest.loyalty?.lifetimePoints || 0;
    const newTier = this.getTier(lifetimePoints);

    if (newTier === currentTier) {
      return null;
    }

    const benefits = this.config.benefits[newTier];

    const upgrade: TierUpgrade = {
      fromTier: currentTier,
      toTier: newTier,
      qualifiedAt: new Date(),
      benefits,
      notificationSent: false
    };

    // Process upgrade
    await this.processTierUpgrade(guestId, upgrade);

    return upgrade;
  }

  /**
   * Process tier upgrade
   */
  private async processTierUpgrade(guestId: string, upgrade: TierUpgrade): Promise<void> {
    await prisma.guest.update({
      where: { id: guestId },
      data: {
        loyalty: {
          tier: upgrade.toTier,
          benefits: upgrade.benefits
        } as any
      }
    });

    logger.info(
      `[LoyaltyProgram] ✅ Tier upgrade: ${upgrade.fromTier} → ${upgrade.toTier} for ${guestId}`
    );

    // TODO: Send notification
    // await this.sendTierUpgradeNotification(guestId, upgrade);
  }

  /**
   * Get tier benefits
   */
  getTierBenefits(tier: LoyaltyTier): string[] {
    return this.config.benefits[tier] || [];
  }

  /**
   * Get next tier info
   */
  getNextTierInfo(currentTier: LoyaltyTier, lifetimePoints: number): {
    nextTier: LoyaltyTier | null;
    pointsNeeded: number;
    progress: number;
  } {
    const tierOrder: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tierOrder.indexOf(currentTier);

    if (currentIndex >= tierOrder.length - 1) {
      // Already at highest tier
      return {
        nextTier: null,
        pointsNeeded: 0,
        progress: 100
      };
    }

    const nextTier = tierOrder[currentIndex + 1];
    const nextThreshold = this.config.tierThresholds[nextTier];
    const pointsNeeded = Math.max(0, nextThreshold - lifetimePoints);
    const currentThreshold = this.config.tierThresholds[currentTier];
    const progress = ((lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

    return {
      nextTier,
      pointsNeeded,
      progress: Math.min(100, Math.max(0, progress))
    };
  }

  // ============================================================================
  // POINTS MANAGEMENT
  // ============================================================================

  /**
   * Add points to guest account
   */
  async addPoints(
    guestId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<number> {
    await this.ensureInitialized();

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: { loyalty: true }
    });

    if (!guest) {
      throw new Error(`Guest not found: ${guestId}`);
    }

    const currentPoints = guest.loyalty?.points || 0;
    const currentLifetime = guest.loyalty?.lifetimePoints || 0;
    const newPoints = currentPoints + amount;
    const newLifetime = currentLifetime + amount;

    // Update guest points
    await prisma.guest.update({
      where: { id: guestId },
      data: {
        loyalty: {
          ...guest.loyalty,
          points: newPoints,
          lifetimePoints: newLifetime
        } as any
      }
    });

    // Log transaction
    await this.logPointsTransaction({
      guestId,
      type: 'earn',
      amount,
      balance: newPoints,
      description,
      metadata
    });

    // Check for tier upgrade
    await this.checkTierUpgrade(guestId);

    return newPoints;
  }

  /**
   * Redeem points
   */
  async redeemPoints(
    guestId: string,
    amount: number,
    optionId: string,
    description?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    await this.ensureInitialized();

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: { loyalty: true }
    });

    if (!guest) {
      return { success: false, newBalance: 0, error: 'Guest not found' };
    }

    const currentPoints = guest.loyalty?.points || 0;

    if (currentPoints < amount) {
      return {
        success: false,
        newBalance: currentPoints,
        error: `Insufficient points. Available: ${currentPoints}, Required: ${amount}`
      };
    }

    const newPoints = currentPoints - amount;

    // Update guest points
    await prisma.guest.update({
      where: { id: guestId },
      data: {
        loyalty: {
          ...guest.loyalty,
          points: newPoints
        } as any
      }
    });

    // Log transaction
    await this.logPointsTransaction({
      guestId,
      type: 'redeem',
      amount: -amount,
      balance: newPoints,
      description: description || `Redeemed points for ${optionId}`
    });

    return { success: true, newBalance };
  }

  /**
   * Get available redemption options
   */
  getRedemptionOptions(points: number): RedemptionOption[] {
    return this.config.redemptionOptions.filter(
      option => option.available && option.pointsRequired <= points
    );
  }

  /**
   * Expire old points
   */
  async expireOldPoints(): Promise<{ expired: number; guests: number }> {
    await this.ensureInitialized();

    const expirationDate = new Date();
    expirationDate.setMonth(
      expirationDate.getMonth() - this.config.pointsExpirationMonths
    );

    const transactions = await prisma.pointsTransaction.findMany({
      where: {
        type: 'earn',
        createdAt: { lt: expirationDate },
        expired: false
      },
      include: {
        guest: true
      }
    });

    let expired = 0;
    const guestIds = new Set<string>();

    for (const transaction of transactions) {
      const guest = await prisma.guest.findUnique({
        where: { id: transaction.guestId },
        select: { loyalty: true }
      });

      if (!guest || !guest.loyalty) continue;

      const currentPoints = guest.loyalty.points || 0;
      const newPoints = Math.max(0, currentPoints - transaction.amount);

      await prisma.guest.update({
        where: { id: transaction.guestId },
        data: {
          loyalty: {
            ...guest.loyalty,
            points: newPoints
          } as any
        }
      });

      await this.logPointsTransaction({
        guestId: transaction.guestId,
        type: 'expire',
        amount: -transaction.amount,
        balance: newPoints,
        description: `Points expired from ${transaction.createdAt.toLocaleDateString()}`
      });

      // Mark transaction as expired
      await prisma.pointsTransaction.update({
        where: { id: transaction.id },
        data: { expired: true }
      });

      expired += transaction.amount;
      guestIds.add(transaction.guestId);
    }

    return { expired, guests: guestIds.size };
  }

  // ============================================================================
  // TRANSACTION LOGGING
  // ============================================================================

  /**
   * Log points transaction
   */
  private async logPointsTransaction(
    transaction: Omit<PointsTransaction, 'id' | 'createdAt'>
  ): Promise<void> {
    await prisma.pointsTransaction.create({
      data: {
        ...transaction,
        createdAt: new Date()
      }
    });
  }

  /**
   * Get points history for guest
   */
  async getPointsHistory(
    guestId: string,
    limit: number = 50
  ): Promise<PointsTransaction[]> {
    await this.ensureInitialized();

    const transactions = await prisma.pointsTransaction.findMany({
      where: { guestId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return transactions;
  }

  // ============================================================================
  // STATUS & REPORTING
  // ============================================================================

  /**
   * Get guest loyalty status
   */
  async getLoyaltyStatus(guestId: string): Promise<LoyaltyStatus> {
    await this.ensureInitialized();

    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: {
        loyalty: true,
        createdAt: true
      }
    });

    if (!guest || !guest.loyalty) {
      throw new Error(`Guest not found: ${guestId}`);
    }

    const tier = (guest.loyalty.tier as LoyaltyTier) || 'bronze';
    const points = guest.loyalty.points || 0;
    const lifetimePoints = guest.loyalty.lifetimePoints || 0;
    const benefits = this.getTierBenefits(tier);
    const nextTierInfo = this.getNextTierInfo(tier, lifetimePoints);

    // Calculate points expiration
    let expiresAt: Date | undefined;
    const lastTransaction = await prisma.pointsTransaction.findFirst({
      where: { guestId, type: 'earn' },
      orderBy: { createdAt: 'desc' }
    });

    if (lastTransaction) {
      expiresAt = new Date(lastTransaction.createdAt);
      expiresAt.setMonth(expiresAt.getMonth() + this.config.pointsExpirationMonths);
    }

    return {
      tier,
      points,
      lifetimePoints,
      nextTierThreshold: nextTierInfo.nextTier
        ? this.config.tierThresholds[nextTierInfo.nextTier]
        : lifetimePoints,
      progressToNextTier: nextTierInfo.progress,
      benefits,
      expiresAt
    };
  }

  /**
   * Get loyalty program statistics
   */
  async getProgramStatistics(): Promise<{
    totalMembers: number;
    membersByTier: Record<LoyaltyTier, number>;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalPointsExpired: number;
    averagePointsPerMember: number;
  }> {
    await this.ensureInitialized();

    const totalMembers = await prisma.guest.count({
      where: { status: 'active' }
    });

    const membersByTierRaw = await prisma.guest.groupBy({
      by: ['loyalty'],
      where: { status: 'active' },
      _count: true
    });

    const membersByTier: Record<LoyaltyTier, number> = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      diamond: 0
    };

    for (const tier of Object.keys(membersByTierRaw) as LoyaltyTier[]) {
      membersByTier[tier] = membersByTierRaw[tier]?._count || 0;
    }

    const pointsStats = await prisma.pointsTransaction.groupBy({
      by: ['type'],
      _sum: {
        amount: true
      }
    });

    const totalPointsIssued =
      pointsStats.find(s => s.type === 'earn')?._sum.amount || 0;
    const totalPointsRedeemed =
      Math.abs(pointsStats.find(s => s.type === 'redeem')?._sum.amount || 0);
    const totalPointsExpired =
      Math.abs(pointsStats.find(s => s.type === 'expire')?._sum.amount || 0);

    const averagePointsPerMember = totalMembers > 0 ? totalPointsIssued / totalMembers : 0;

    return {
      totalMembers,
      membersByTier,
      totalPointsIssued,
      totalPointsRedeemed,
      totalPointsExpired,
      averagePointsPerMember
    };
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

const defaultLoyalty = new LoyaltyProgramEngine();

/**
 * Calculate points for stay
 */
export async function calculatePoints(
  stay: { totalPrice: number; numberOfNights?: number },
  guestTier: LoyaltyTier = 'bronze'
): Promise<number> {
  await defaultLoyalty.initialize();
  return defaultLoyalty.calculatePoints(stay, guestTier);
}

/**
 * Check tier upgrade
 */
export async function checkTierUpgrade(guestId: string): Promise<TierUpgrade | null> {
  await defaultLoyalty.initialize();
  return defaultLoyalty.checkTierUpgrade(guestId);
}

/**
 * Get tier benefits
 */
export function getTierBenefits(tier: LoyaltyTier): string[] {
  return defaultLoyalty.getTierBenefits(tier);
}

/**
 * Add points to guest
 */
export async function addPoints(
  guestId: string,
  amount: number,
  description: string
): Promise<number> {
  await defaultLoyalty.initialize();
  return defaultLoyalty.addPoints(guestId, amount, description);
}

/**
 * Redeem points
 */
export async function redeemPoints(
  guestId: string,
  amount: number,
  optionId: string
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  await defaultLoyalty.initialize();
  return defaultLoyalty.redeemPoints(guestId, amount, optionId);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { LoyaltyProgramEngine };
export default LoyaltyProgramEngine;

export type {
  LoyaltyTier,
  LoyaltyConfig,
  RedemptionOption,
  PointsTransaction,
  TierUpgrade,
  LoyaltyStatus
};
