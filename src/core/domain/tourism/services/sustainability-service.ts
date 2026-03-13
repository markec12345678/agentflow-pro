/**
 * Sustainability Service for Tourism Properties
 * Handles: Carbon Footprint, Eco Practices, Certifications
 */

interface CarbonFootprintData {
  energyKwh: number;
  waterM3: number;
  wasteKg: number;
  recyclingKg: number;
  nightsStayed?: number;
  guests?: number;
}

interface CarbonFootprintResult {
  totalCarbonKg: number;
  breakdown: {
    energy: number;
    water: number;
    waste: number;
    recycling: number;
  };
  perNight?: number;
  perGuest?: number;
  rating: 'A' | 'B' | 'C' | 'D' | 'E';
  suggestions: string[];
}

interface EcoPracticeTemplate {
  id: string;
  name: string;
  category: 'energy' | 'water' | 'waste' | 'sourcing' | 'mobility';
  description: string;
  impactLevel: 'low' | 'medium' | 'high';
  estimatedSavings?: {
    amount: number;
    unit: string;
    period: 'monthly' | 'yearly';
  };
}

export class SustainabilityService {
  // Carbon emission factors (kg CO2e per unit)
  private emissionFactors = {
    energy: 0.233, // kg CO2e per kWh (Slovenia grid mix)
    water: 0.344,  // kg CO2e per m³ (treatment + heating)
    waste: 0.5,    // kg CO2e per kg waste
    recycling: -0.3, // negative = credit for recycling
  };

  /**
   * Calculate carbon footprint for a property
   */
  calculateCarbonFootprint(data: CarbonFootprintData, periodDays: number = 30): CarbonFootprintResult {
    const { energyKwh, waterM3, wasteKg, recyclingKg, nightsStayed, guests } = data;

    // Calculate emissions
    const energyCarbon = energyKwh * this.emissionFactors.energy;
    const waterCarbon = waterM3 * this.emissionFactors.water;
    const wasteCarbon = wasteKg * this.emissionFactors.waste;
    const recyclingCredit = recyclingKg * this.emissionFactors.recycling;

    const totalCarbon = energyCarbon + waterCarbon + wasteCarbon + recyclingCredit;

    // Calculate per-night and per-guest if data available
    const perNight = nightsStayed ? totalCarbon / nightsStayed : undefined;
    const perGuest = guests ? totalCarbon / guests : undefined;

    // Determine rating (simplified EU hotel standard)
    const rating = this.calculateSustainabilityRating(totalCarbon, nightsStayed || 1);

    // Generate suggestions
    const suggestions = this.generateSustainabilitySuggestions(data, totalCarbon);

    return {
      totalCarbonKg: Math.round(totalCarbon * 100) / 100,
      breakdown: {
        energy: Math.round(energyCarbon * 100) / 100,
        water: Math.round(waterCarbon * 100) / 100,
        waste: Math.round(wasteCarbon * 100) / 100,
        recycling: Math.round(recyclingCredit * 100) / 100,
      },
      perNight: perNight ? Math.round(perNight * 100) / 100 : undefined,
      perGuest: perGuest ? Math.round(perGuest * 100) / 100 : undefined,
      rating,
      suggestions,
    };
  }

  /**
   * Calculate sustainability rating
   */
  private calculateSustainabilityRating(totalCarbonKg: number, nights: number): 'A' | 'B' | 'C' | 'D' | 'E' {
    const carbonPerNight = totalCarbonKg / nights;

    // EU Hotel Carbon Measurement Initiative thresholds
    if (carbonPerNight < 10) return 'A'; // Excellent
    if (carbonPerNight < 20) return 'B'; // Good
    if (carbonPerNight < 30) return 'C'; // Average
    if (carbonPerNight < 40) return 'D'; // Below Average
    return 'E'; // Poor
  }

  /**
   * Generate sustainability improvement suggestions
   */
  private generateSustainabilitySuggestions(data: CarbonFootprintData, totalCarbon: number): string[] {
    const suggestions: string[] = [];

    // Energy suggestions
    if (data.energyKwh > 500) {
      suggestions.push('Namestite LED žarnice za zmanjšanje porabe energije do 75%');
      suggestions.push('Razmislite o sončnih panelih - dolgoročno zmanjšanje stroškov do 50%');
    }

    // Water suggestions
    if (data.waterM3 > 50) {
      suggestions.push('Namestite varčne pipe in prhe za zmanjšanje porabe vode 30%');
      suggestions.push('Implementirajte sistem za ponovno uporabo deževnice');
    }

    // Waste suggestions
    if (data.wasteKg > 100) {
      suggestions.push('Uvedite ločevanje odpadkov na 6 frakcij');
      suggestions.push('Zmanjšajte uporabo plastike z večkratnimi posodami');
    }

    // Recycling suggestions
    if (data.recyclingKg < data.wasteKg * 0.3) {
      suggestions.push('Izboljšajte sistem recikliranja - cilj: 50% odpadkov reciklirati');
    }

    // General suggestions
    if (totalCarbon > 1000) {
      suggestions.push('Naredite celovit energetski audit');
      suggestions.push('Razmislite o nakupu zelenih certifikatov za kompenzacijo');
    }

    return suggestions.length > 0 ? suggestions : ['Odlično! Vaša nastanitev je že zelo trajnostna.'];
  }

  /**
   * Get eco practice templates
   */
  getEcoPracticeTemplates(): EcoPracticeTemplate[] {
    return [
      // Energy
      {
        id: 'energy-led',
        name: 'LED Osvetljava',
        category: 'energy',
        description: 'Zamenjava vseh žarnic z LED tehnologijo',
        impactLevel: 'medium',
        estimatedSavings: { amount: 200, unit: 'EUR', period: 'yearly' },
      },
      {
        id: 'energy-solar',
        name: 'Sončni Paneli',
        category: 'energy',
        description: 'Namestitev fotonapetostnih panelov',
        impactLevel: 'high',
        estimatedSavings: { amount: 2000, unit: 'EUR', period: 'yearly' },
      },
      {
        id: 'energy-smart',
        name: 'Pametni Termostati',
        category: 'energy',
        description: 'Avtomatska regulacija temperature',
        impactLevel: 'medium',
        estimatedSavings: { amount: 300, unit: 'EUR', period: 'yearly' },
      },

      // Water
      {
        id: 'water-saving',
        name: 'Varčne Pipe',
        category: 'water',
        description: 'Namestitev varčnih glav in pip',
        impactLevel: 'low',
        estimatedSavings: { amount: 150, unit: 'EUR', period: 'yearly' },
      },
      {
        id: 'water-rainwater',
        name: 'Zbiranje Deževnice',
        category: 'water',
        description: 'Sistem za zbiranje in uporabo deževnice',
        impactLevel: 'medium',
        estimatedSavings: { amount: 100, unit: 'EUR', period: 'yearly' },
      },

      // Waste
      {
        id: 'waste-recycling',
        name: 'Ločevanje Odpadkov',
        category: 'waste',
        description: '6-frakcijsko ločevanje odpadkov',
        impactLevel: 'medium',
        estimatedSavings: { amount: 50, unit: 'EUR', period: 'yearly' },
      },
      {
        id: 'waste-compost',
        name: 'Kompostiranje',
        category: 'waste',
        description: 'Kompostiranje organskih odpadkov',
        impactLevel: 'low',
        estimatedSavings: { amount: 30, unit: 'EUR', period: 'yearly' },
      },

      // Sourcing
      {
        id: 'sourcing-local',
        name: 'Lokalna Prehrana',
        category: 'sourcing',
        description: '80% živil iz lokalnih virov (50km)',
        impactLevel: 'high',
        estimatedSavings: { amount: 500, unit: 'EUR', period: 'yearly' },
      },
      {
        id: 'sourcing-organic',
        name: 'Bio Izdelki',
        category: 'sourcing',
        description: 'Uporaba ekoloških/bio izdelkov',
        impactLevel: 'medium',
        estimatedSavings: { amount: 200, unit: 'EUR', period: 'yearly' },
      },

      // Mobility
      {
        id: 'mobility-bikes',
        name: 'Kolesa za Goste',
        category: 'mobility',
        description: 'Brezplačna kolesa za goste',
        impactLevel: 'medium',
        estimatedSavings: { amount: 0, unit: 'EUR', period: 'yearly' },
      },
      {
        id: 'mobility-ev',
        name: 'EV Polnilnica',
        category: 'mobility',
        description: 'Polnilnica za električna vozila',
        impactLevel: 'high',
        estimatedSavings: { amount: 300, unit: 'EUR', period: 'yearly' },
      },
    ];
  }

  /**
   * Check certification eligibility
   */
  checkCertificationEligibility(
    practices: Array<{ category: string; implemented: boolean }>,
    carbonRating: string
  ): Array<{ name: string; eligible: boolean; requirements: string[] }> {
    const certifications = [
      {
        name: 'EU Ecolabel',
        requirements: {
          energy: 10,
          water: 5,
          waste: 5,
          rating: 'B',
        },
      },
      {
        name: 'Green Key',
        requirements: {
          energy: 8,
          water: 5,
          waste: 5,
          rating: 'C',
        },
      },
      {
        name: 'Travelife',
        requirements: {
          energy: 5,
          water: 3,
          waste: 3,
          rating: 'C',
        },
      },
    ];

    const implementedByCategory = practices.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + (p.implemented ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);

    return certifications.map(cert => {
      const eligible =
        (implementedByCategory.energy || 0) >= cert.requirements.energy &&
        (implementedByCategory.water || 0) >= cert.requirements.water &&
        (implementedByCategory.waste || 0) >= cert.requirements.waste &&
        (carbonRating <= cert.requirements.rating);

      const missing: string[] = [];
      if ((implementedByCategory.energy || 0) < cert.requirements.energy) {
        missing.push(`Potrebujete še ${cert.requirements.energy - (implementedByCategory.energy || 0)} energijskih praks`);
      }
      if ((implementedByCategory.water || 0) < cert.requirements.water) {
        missing.push(`Potrebujete še ${cert.requirements.water - (implementedByCategory.water || 0)} vodnih praks`);
      }
      if ((implementedByCategory.waste || 0) < cert.requirements.waste) {
        missing.push(`Potrebujete še ${cert.requirements.waste - (implementedByCategory.waste || 0)} praks ravnanja z odpadki`);
      }
      if (carbonRating > cert.requirements.rating) {
        missing.push(`Izboljšajte ogljični odtis (trenutno: ${carbonRating}, potrebno: ${cert.requirements.rating})`);
      }

      return {
        name: cert.name,
        eligible,
        requirements: missing,
      };
    });
  }

  /**
   * Generate sustainability report
   */
  generateSustainabilityReport(
    carbonData: CarbonFootprintData,
    practices: Array<{ name: string; implemented: boolean; category: string }>,
    certifications: Array<{ name: string; status: string }>
  ): string {
    const footprint = this.calculateCarbonFootprint(carbonData);
    
    const implementedPractices = practices.filter(p => p.implemented).length;
    const totalPractices = practices.length;

    const activeCertifications = certifications.filter(c => c.status === 'active').length;

    return `
# Trajnostno Poročilo

## Ogljični Odtis
- Skupaj: ${footprint.totalCarbonKg} kg CO2e
- Na nočitev: ${footprint.perNight || 0} kg CO2e
- Ocena: ${footprint.rating}

## Implementirane Prakse
- Implementirano: ${implementedPractices}/${totalPractices} (${Math.round((implementedPractices/totalPractices)*100)}%)
- Največji vpliv: ${practices.filter(p => p.implemented).map(p => p.name).join(', ') || 'Brez implementiranih praks'}

## Certifikati
- Aktivni certifikati: ${activeCertifications}
- Status: ${certifications.map(c => `${c.name}: ${c.status}`).join(', ') || 'Brez certifikatov'}

## Priporočila
${footprint.suggestions.map(s => `- ${s}`).join('\n')}
    `.trim();
  }
}

export const sustainabilityService = new SustainabilityService();
