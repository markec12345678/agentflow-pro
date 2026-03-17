// Pricing engine wrapper stub
export class PricingEngineWrapper {
  async getRecommendation(propertyId: string): Promise<any> {
    return { recommendedPrice: 100, confidence: 0.8 };
  }
}

export function calculatePrice(data: any): Promise<any> {
  return Promise.resolve({ total: 100 });
}
