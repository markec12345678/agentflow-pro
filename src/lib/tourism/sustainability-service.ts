// Sustainability service stub
export class SustainabilityService {
  async calculateFootprint(): Promise<any> {
    return { carbon: 0, waste: 0 };
  }
}

export const sustainabilityService = new SustainabilityService();
