/**
 * AgentFlow Pro - Competitor Rate Shopping
 * Monitor and analyze competitor pricing
 */

export interface CompetitorData {
  competitorId: string;
  name: string;
  url: string;
  location: {
    latitude: number;
    longitude: number;
    distance: number; // km from property
  };
  propertyType: 'hotel' | 'apartment' | 'house' | 'camp';
  starRating?: number;
  guestRating?: number;
  amenities: string[];
  roomTypes: CompetitorRoomType[];
  prices: CompetitorPrice[];
  lastUpdated: Date;
}

export interface CompetitorRoomType {
  roomId: string;
  name: string;
  maxOccupancy: number;
  bedType: string;
  size: number; // m²
  amenities: string[];
}

export interface CompetitorPrice {
  date: Date;
  roomId: string;
  price: number;
  currency: string;
  available: boolean;
  minStay?: number;
  cancellationPolicy?: 'free' | 'moderate' | 'strict';
  boardType?: 'room_only' | 'breakfast' | 'half_board' | 'full_board';
}

export interface RateShoppingConfig {
  propertyId: string;
  competitors: string[]; // competitor IDs
  checkIn: Date;
  checkOut: Date;
  rooms: number;
  guests: number;
  currency: string;
}

export interface RateShoppingResult {
  timestamp: Date;
  propertyPosition: {
    rank: number;
    totalCompetitors: number;
    percentile: number;
  };
  priceComparison: {
    yourPrice: number;
    avgCompetitorPrice: number;
    minCompetitorPrice: number;
    maxCompetitorPrice: number;
    priceDifference: number;
    priceDifferencePercent: number;
  };
  marketInsights: {
    marketTrend: 'increasing' | 'stable' | 'decreasing';
    avgOccupancy: number;
    demandLevel: 'low' | 'medium' | 'high';
    recommendedAction: string;
  };
  competitiveSet: CompetitorSummary[];
}

export interface CompetitorSummary {
  competitorId: string;
  name: string;
  price: number;
  pricePosition: 'below_market' | 'at_market' | 'above_market';
  valueScore: number; // price vs quality ratio
  threatLevel: 'low' | 'medium' | 'high';
}

export class CompetitorRateShopping {
  private apiKey: string;
  private cache: Map<string, { data: CompetitorData; expires: Date }> = new Map();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RATE_SHOPPING_API_KEY || '';
  }

  /**
   * Shop rates for specific dates
   */
  async shopRates(config: RateShoppingConfig): Promise<RateShoppingResult> {
    // Fetch competitor prices
    const competitorData = await this.fetchCompetitorPrices(config);

    // Analyze market position
    const result = this.analyzeMarketPosition(config, competitorData);

    return result;
  }

  /**
   * Fetch competitor prices
   */
  private async fetchCompetitorPrices(
    config: RateShoppingConfig
  ): Promise<CompetitorData[]> {
    const competitors: CompetitorData[] = [];

    for (const competitorId of config.competitors) {
      // Check cache first
      const cached = this.cache.get(competitorId);
      if (cached && cached.expires > new Date()) {
        competitors.push(cached.data);
        continue;
      }

      // Fetch from API (in production, integrate with rate shopping API)
      try {
        const data = await this.fetchFromAPI(competitorId, config);
        competitors.push(data);

        // Cache for 1 hour
        this.cache.set(competitorId, {
          data,
          expires: new Date(Date.now() + 60 * 60 * 1000),
        });
      } catch (error) {
        logger.error(`Failed to fetch competitor ${competitorId}:`, error);
      }
    }

    return competitors;
  }

  /**
   * Fetch from external API
   */
  private async fetchFromAPI(
    competitorId: string,
    config: RateShoppingConfig
  ): Promise<CompetitorData> {
    // In production, integrate with:
    // - OTA Insight
    // - Duetto
    // - RateGain
    // - STR

    // Mock implementation
    return {
      competitorId,
      name: `Competitor ${competitorId}`,
      url: `https://example.com/${competitorId}`,
      location: {
        latitude: 46.0569,
        longitude: 14.5058,
        distance: Math.random() * 5,
      },
      propertyType: 'hotel',
      starRating: Math.floor(Math.random() * 2) + 3,
      guestRating: 7 + Math.random() * 2,
      amenities: ['WiFi', 'Parking', 'Breakfast'],
      roomTypes: [],
      prices: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Analyze market position
   */
  private analyzeMarketPosition(
    config: RateShoppingConfig,
    competitors: CompetitorData[]
  ): RateShoppingResult {
    // Calculate your price (in production, fetch from your system)
    const yourPrice = 100; // Mock

    // Calculate competitor statistics
    const allPrices = competitors.flatMap(c => c.prices.map(p => p.price));
    const avgCompetitorPrice = allPrices.length > 0
      ? allPrices.reduce((sum, p) => sum + p, 0) / allPrices.length
      : yourPrice;
    const minCompetitorPrice = Math.min(...allPrices, yourPrice);
    const maxCompetitorPrice = Math.max(...allPrices, yourPrice);

    // Calculate price position
    const priceDifference = yourPrice - avgCompetitorPrice;
    const priceDifferencePercent = (priceDifference / avgCompetitorPrice) * 100;

    // Calculate rank
    const cheaperCompetitors = competitors.filter(c =>
      c.prices.some(p => p.price < yourPrice)
    ).length;
    const rank = cheaperCompetitors + 1;

    // Determine market trend
    const marketTrend = this.determineMarketTrend(competitors);

    // Calculate demand level
    const demandLevel = this.estimateDemandLevel(competitors);

    // Generate competitive set
    const competitiveSet = this.generateCompetitiveSet(competitors, yourPrice);

    // Generate recommendation
    const recommendedAction = this.generateRecommendation(
      priceDifferencePercent,
      marketTrend,
      demandLevel
    );

    return {
      timestamp: new Date(),
      propertyPosition: {
        rank,
        totalCompetitors: competitors.length,
        percentile: Math.round(((competitors.length - rank + 1) / competitors.length) * 100),
      },
      priceComparison: {
        yourPrice,
        avgCompetitorPrice: Math.round(avgCompetitorPrice * 100) / 100,
        minCompetitorPrice,
        maxCompetitorPrice,
        priceDifference: Math.round(priceDifference * 100) / 100,
        priceDifferencePercent: Math.round(priceDifferencePercent * 100) / 100,
      },
      marketInsights: {
        marketTrend,
        avgOccupancy: 0.75, // Mock
        demandLevel,
        recommendedAction,
      },
      competitiveSet,
    };
  }

  /**
   * Determine market trend
   */
  private determineMarketTrend(competitors: CompetitorData[]): 'increasing' | 'stable' | 'decreasing' {
    // In production, analyze historical price data
    return 'stable';
  }

  /**
   * Estimate demand level
   */
  private estimateDemandLevel(competitors: CompetitorData[]): 'low' | 'medium' | 'high' {
    // In production, analyze availability and booking patterns
    const availabilityRate = competitors.reduce((sum, c) => {
      const available = c.prices.filter(p => p.available).length;
      return sum + (available / Math.max(1, c.prices.length));
    }, 0) / Math.max(1, competitors.length);

    if (availabilityRate < 0.3) return 'high';
    if (availabilityRate < 0.6) return 'medium';
    return 'low';
  }

  /**
   * Generate competitive set summary
   */
  private generateCompetitiveSet(competitors: CompetitorData[], yourPrice: number): CompetitorSummary[] {
    return competitors.map(c => {
      const avgPrice = c.prices.length > 0
        ? c.prices.reduce((sum, p) => sum + p.price, 0) / c.prices.length
        : yourPrice;

      const pricePosition = avgPrice < yourPrice * 0.9
        ? 'below_market'
        : avgPrice > yourPrice * 1.1
        ? 'above_market'
        : 'at_market';

      const valueScore = (c.guestRating || 7) / (avgPrice / 100);

      const threatLevel = pricePosition === 'below_market' && (c.guestRating || 7) > 8
        ? 'high'
        : pricePosition === 'at_market'
        ? 'medium'
        : 'low';

      return {
        competitorId: c.competitorId,
        name: c.name,
        price: Math.round(avgPrice),
        pricePosition,
        valueScore: Math.round(valueScore * 100) / 100,
        threatLevel,
      };
    });
  }

  /**
   * Generate pricing recommendation
   */
  private generateRecommendation(
    priceDifferencePercent: number,
    marketTrend: string,
    demandLevel: string
  ): string {
    if (demandLevel === 'high' && priceDifferencePercent < 10) {
      return 'Increase prices by 10-15% - high demand and competitive positioning';
    }

    if (priceDifferencePercent > 20) {
      return 'Consider reducing prices - you are significantly above market average';
    }

    if (priceDifferencePercent < -20) {
      return 'Opportunity to increase prices - you are below market average';
    }

    if (marketTrend === 'decreasing') {
      return 'Monitor closely - market prices are trending down';
    }

    return 'Maintain current pricing - well positioned in the market';
  }

  /**
   * Track competitor over time
   */
  async trackCompetitor(competitorId: string, days: number = 30): Promise<{
    competitorId: string;
    priceHistory: Array<{ date: Date; price: number }>;
    avgPrice: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }> {
    // In production, fetch historical data
    const priceHistory: Array<{ date: Date; price: number }> = [];
    const basePrice = 100;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      priceHistory.push({
        date,
        price: basePrice + Math.random() * 20 - 10,
      });
    }

    const avgPrice = priceHistory.reduce((sum, p) => sum + p.price, 0) / days;
    const trend = 'stable';

    return {
      competitorId,
      priceHistory,
      avgPrice: Math.round(avgPrice * 100) / 100,
      trend,
    };
  }

  /**
   * Get rate shopping alerts
   */
  getAlerts(competitors: CompetitorSummary[], yourPrice: number): Array<{
    type: 'warning' | 'opportunity' | 'info';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }> {
    const alerts: any[] = [];

    // Check for undercutting competitors
    const undercuts = competitors.filter(c => c.price < yourPrice * 0.9 && c.threatLevel === 'high');
    if (undercuts.length > 0) {
      alerts.push({
        type: 'warning',
        title: 'Competitors Undercutting Prices',
        message: `${undercuts.length} competitors are pricing significantly below you`,
        priority: 'high',
      });
    }

    // Check for pricing opportunities
    const aboveMarket = competitors.filter(c => c.price > yourPrice * 1.1);
    if (aboveMarket.length > competitors.length * 0.5) {
      alerts.push({
        type: 'opportunity',
        title: 'Pricing Opportunity',
        message: 'Most competitors are priced higher - consider increasing rates',
        priority: 'medium',
      });
    }

    return alerts;
  }
}

export const competitorRateShopping = new CompetitorRateShopping();
