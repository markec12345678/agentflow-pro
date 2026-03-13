/**
 * AgentFlow Pro - AI Dynamic Pricing Engine
 * Machine learning-powered pricing optimization for tourism
 */

export interface PricingInput {
  propertyId: string;
  roomId?: string;
  checkIn: Date;
  checkOut: Date;
  basePrice: number;
  currency: string;
  occupancy?: number;
  competitors?: CompetitorPrice[];
  events?: LocalEvent[];
  seasonality?: SeasonalityFactor;
  historicalData?: HistoricalBooking[];
}

export interface CompetitorPrice {
  competitorId: string;
  name: string;
  price: number;
  quality: number; // 1-10
  distance: number; // km
  amenities: string[];
}

export interface LocalEvent {
  name: string;
  date: Date;
  impact: 'low' | 'medium' | 'high' | 'very_high';
  expectedAttendees?: number;
}

export interface SeasonalityFactor {
  period: 'low' | 'shoulder' | 'high' | 'peak';
  multiplier: number;
  demandForecast: number; // 0-1
}

export interface HistoricalBooking {
  date: Date;
  price: number;
  occupancy: number;
  bookingsCount: number;
  revenue: number;
}

export interface PricingOutput {
  recommendedPrice: number;
  confidence: number; // 0-1
  factors: PricingFactor[];
  priceChange: number; // percentage
  expectedOccupancy: number;
  expectedRevenue: number;
  strategy: PricingStrategy;
}

export interface PricingFactor {
  name: string;
  impact: number; // -1 to 1
  description: string;
  weight: number; // 0-1
}

export type PricingStrategy =
  | 'aggressive' // Maximize occupancy
  | 'conservative' // Maximize ADR
  | 'balanced' // Optimize RevPAR
  | 'competitive' // Match competition
  | 'demand_based'; // Based on demand forecast

export class DynamicPricingEngine {
  private config: {
    minPriceMultiplier: number;
    maxPriceMultiplier: number;
    defaultStrategy: PricingStrategy;
    competitorWeight: number;
    demandWeight: number;
    seasonalityWeight: number;
    eventWeight: number;
  };

  constructor(config?: Partial<typeof DynamicPricingEngine.prototype.config>) {
    this.config = {
      minPriceMultiplier: 0.7, // Never go below 70% of base price
      maxPriceMultiplier: 2.5, // Never go above 250% of base price
      defaultStrategy: 'balanced',
      competitorWeight: 0.3,
      demandWeight: 0.3,
      seasonalityWeight: 0.2,
      eventWeight: 0.2,
      ...config,
    };
  }

  /**
   * Calculate optimal price
   */
  calculatePrice(input: PricingInput): PricingOutput {
    const factors: PricingFactor[] = [];
    let priceMultiplier = 1.0;

    // 1. Competitor Analysis
    if (input.competitors && input.competitors.length > 0) {
      const competitorFactor = this.analyzeCompetitors(input);
      factors.push(competitorFactor);
      priceMultiplier += competitorFactor.impact * this.config.competitorWeight;
    }

    // 2. Demand Forecasting
    if (input.seasonality) {
      const demandFactor = this.analyzeDemand(input);
      factors.push(demandFactor);
      priceMultiplier += demandFactor.impact * this.config.demandWeight;
    }

    // 3. Seasonality
    if (input.seasonality) {
      const seasonalityFactor = this.analyzeSeasonality(input);
      factors.push(seasonalityFactor);
      priceMultiplier += seasonalityFactor.impact * this.config.seasonalityWeight;
    }

    // 4. Local Events
    if (input.events && input.events.length > 0) {
      const eventFactor = this.analyzeEvents(input);
      factors.push(eventFactor);
      priceMultiplier += eventFactor.impact * this.config.eventWeight;
    }

    // 5. Historical Performance
    if (input.historicalData && input.historicalData.length > 0) {
      const historicalFactor = this.analyzeHistoricalData(input);
      factors.push(historicalFactor);
      priceMultiplier += historicalFactor.impact * 0.1;
    }

    // Apply constraints
    priceMultiplier = Math.max(
      this.config.minPriceMultiplier,
      Math.min(this.config.maxPriceMultiplier, priceMultiplier)
    );

    // Calculate final price
    const recommendedPrice = Math.round(input.basePrice * priceMultiplier);
    const priceChange = ((recommendedPrice - input.basePrice) / input.basePrice) * 100;

    // Determine strategy
    const strategy = this.determineStrategy(factors);

    // Calculate expected metrics
    const expectedOccupancy = this.calculateExpectedOccupancy(priceChange, input);
    const expectedRevenue = recommendedPrice * expectedOccupancy;

    // Calculate confidence
    const confidence = this.calculateConfidence(factors);

    return {
      recommendedPrice,
      confidence,
      factors,
      priceChange: Math.round(priceChange * 100) / 100,
      expectedOccupancy: Math.round(expectedOccupancy * 100) / 100,
      expectedRevenue: Math.round(expectedRevenue * 100) / 100,
      strategy,
    };
  }

  /**
   * Analyze competitor prices
   */
  private analyzeCompetitors(input: PricingInput): PricingFactor {
    if (!input.competitors || input.competitors.length === 0) {
      return {
        name: 'Competition',
        impact: 0,
        description: 'No competitor data available',
        weight: 0,
      };
    }

    const avgCompetitorPrice =
      input.competitors.reduce((sum, c) => sum + c.price, 0) / input.competitors.length;
    const pricePosition = input.basePrice / avgCompetitorPrice;

    let impact = 0;
    let description = '';

    if (pricePosition > 1.2) {
      impact = -0.2;
      description = 'Your price is 20%+ above competition';
    } else if (pricePosition > 1.1) {
      impact = -0.1;
      description = 'Your price is 10-20% above competition';
    } else if (pricePosition < 0.8) {
      impact = 0.2;
      description = 'Your price is below competition - opportunity to increase';
    } else if (pricePosition < 0.9) {
      impact = 0.1;
      description = 'Your price is slightly below competition';
    } else {
      impact = 0;
      description = 'Your price is competitive';
    }

    return {
      name: 'Competition',
      impact,
      description,
      weight: this.config.competitorWeight,
    };
  }

  /**
   * Analyze demand forecast
   */
  private analyzeDemand(input: PricingInput): PricingFactor {
    if (!input.seasonality) {
      return {
        name: 'Demand',
        impact: 0,
        description: 'No demand data available',
        weight: 0,
      };
    }

    const demandForecast = input.seasonality.demandForecast;
    let impact = 0;
    let description = '';

    if (demandForecast > 0.8) {
      impact = 0.3;
      description = 'Very high demand forecast - increase prices';
    } else if (demandForecast > 0.6) {
      impact = 0.2;
      description = 'High demand forecast';
    } else if (demandForecast > 0.4) {
      impact = 0.1;
      description = 'Moderate demand';
    } else if (demandForecast > 0.2) {
      impact = -0.1;
      description = 'Low demand - consider discounts';
    } else {
      impact = -0.2;
      description = 'Very low demand - aggressive pricing recommended';
    }

    return {
      name: 'Demand',
      impact,
      description,
      weight: this.config.demandWeight,
    };
  }

  /**
   * Analyze seasonality
   */
  private analyzeSeasonality(input: PricingInput): PricingFactor {
    if (!input.seasonality) {
      return {
        name: 'Seasonality',
        impact: 0,
        description: 'No seasonality data',
        weight: 0,
      };
    }

    const { period, multiplier } = input.seasonality;

    const impact = (multiplier - 1) * this.config.seasonalityWeight;
    const description = `${period.charAt(0).toUpperCase() + period.slice(1)} season (multiplier: ${multiplier}x)`;

    return {
      name: 'Seasonality',
      impact,
      description,
      weight: this.config.seasonalityWeight,
    };
  }

  /**
   * Analyze local events
   */
  private analyzeEvents(input: PricingInput): PricingFactor {
    if (!input.events || input.events.length === 0) {
      return {
        name: 'Local Events',
        impact: 0,
        description: 'No significant local events',
        weight: 0,
      };
    }

    // Find highest impact event
    const impactLevels = {
      low: 0.05,
      medium: 0.1,
      high: 0.2,
      very_high: 0.3,
    };

    const maxImpactEvent = input.events.reduce((max, event) =>
      impactLevels[event.impact] > impactLevels[max.impact] ? event : max
    );

    const impact = impactLevels[maxImpactEvent.impact];
    const description = `${maxImpactEvent.name} expected to increase demand`;

    return {
      name: 'Local Events',
      impact,
      description,
      weight: this.config.eventWeight,
    };
  }

  /**
   * Analyze historical booking data
   */
  private analyzeHistoricalData(input: PricingInput): PricingFactor {
    if (!input.historicalData || input.historicalData.length === 0) {
      return {
        name: 'Historical Performance',
        impact: 0,
        description: 'No historical data',
        weight: 0,
      };
    }

    // Calculate average occupancy at current price point
    const avgOccupancy =
      input.historicalData.reduce((sum, h) => sum + h.occupancy, 0) / input.historicalData.length;

    let impact = 0;
    let description = '';

    if (avgOccupancy > 0.9) {
      impact = 0.2;
      description = 'High historical occupancy - can increase prices';
    } else if (avgOccupancy > 0.7) {
      impact = 0.1;
      description = 'Good historical occupancy';
    } else if (avgOccupancy > 0.5) {
      impact = 0;
      description = 'Average historical occupancy';
    } else {
      impact = -0.1;
      description = 'Low historical occupancy - consider discounts';
    }

    return {
      name: 'Historical Performance',
      impact,
      description,
      weight: 0.1,
    };
  }

  /**
   * Determine pricing strategy
   */
  private determineStrategy(factors: PricingFactor[]): PricingStrategy {
    const totalImpact = factors.reduce((sum, f) => sum + f.impact, 0);

    if (totalImpact > 0.3) {
      return 'aggressive';
    } else if (totalImpact > 0.1) {
      return 'demand_based';
    } else if (totalImpact < -0.3) {
      return 'competitive';
    } else {
      return 'balanced';
    }
  }

  /**
   * Calculate expected occupancy based on price change
   */
  private calculateExpectedOccupancy(priceChange: number, input: PricingInput): number {
    // Price elasticity of demand (typically -0.5 to -2.0 for hotels)
    const elasticity = -1.2;
    const occupancyImpact = priceChange * elasticity / 100;

    const baseOccupancy = input.occupancy || 0.7;
    const expectedOccupancy = Math.max(0.1, Math.min(0.99, baseOccupancy + occupancyImpact));

    return expectedOccupancy;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(factors: PricingFactor[]): number {
    // More factors = higher confidence
    const factorCount = factors.filter(f => f.weight > 0).length;
    const baseConfidence = 0.5 + (factorCount * 0.1);

    // Strong consensus = higher confidence
    const impacts = factors.map(f => f.impact);
    const avgImpact = impacts.reduce((sum, i) => sum + i, 0) / impacts.length;
    const variance = impacts.reduce((sum, i) => sum + Math.pow(i - avgImpact, 2), 0) / impacts.length;
    const consensusBonus = Math.max(0, 0.2 - variance);

    return Math.min(0.95, baseConfidence + consensusBonus);
  }

  /**
   * Batch calculate prices for multiple dates
   */
  calculatePricesForDateRange(
    input: Omit<PricingInput, 'checkIn' | 'checkOut'>,
    startDate: Date,
    endDate: Date
  ): Array<{ date: Date; pricing: PricingOutput }> {
    const results: Array<{ date: Date; pricing: PricingOutput }> = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dateInput = {
        ...input,
        checkIn: new Date(current),
        checkOut: new Date(current.getTime() + 24 * 60 * 60 * 1000),
      };

      results.push({
        date: new Date(current),
        pricing: this.calculatePrice(dateInput),
      });

      current.setDate(current.getDate() + 1);
    }

    return results;
  }

  /**
   * Get pricing recommendations summary
   */
  getRecommendations(pricings: PricingOutput[]): {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    avgConfidence: number;
    totalExpectedRevenue: number;
    dominantStrategy: PricingStrategy;
  } {
    const prices = pricings.map(p => p.recommendedPrice);
    const confidences = pricings.map(p => p.confidence);
    const revenues = pricings.map(p => p.expectedRevenue);

    const strategyCounts: Record<PricingStrategy, number> = {
      aggressive: 0,
      conservative: 0,
      balanced: 0,
      competitive: 0,
      demand_based: 0,
    };

    pricings.forEach(p => {
      strategyCounts[p.strategy]++;
    });

    const dominantStrategy =
      Object.entries(strategyCounts).sort((a, b) => b[1] - a[1])[0][0] as PricingStrategy;

    return {
      avgPrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      avgConfidence: confidences.reduce((sum, c) => sum + c, 0) / confidences.length,
      totalExpectedRevenue: revenues.reduce((sum, r) => sum + r, 0),
      dominantStrategy,
    };
  }
}

export const dynamicPricingEngine = new DynamicPricingEngine();
