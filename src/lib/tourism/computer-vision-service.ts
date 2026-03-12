/**
 * Computer Vision Service for Tourism Properties
 * Handles: Photo Quality Analysis, Amenity Detection, Damage Detection
 */

import { GoogleGenerativeAI } from '@huggingface/inference';

interface PhotoAnalysisResult {
  qualityScore: number;
  qualityMetrics: {
    brightness: number;
    sharpness: number;
    composition: number;
    professionalism: number;
  };
  amenities: Array<{
    name: string;
    confidence: number;
    category: string;
  }>;
  damage: {
    detected: boolean;
    type?: string;
    severity?: string;
    description?: string;
    confidence?: number;
  };
  suggestions: string[];
}

interface AnalysisMetadata {
  model: string;
  processingTime: number;
  imageUrl: string;
  timestamp: Date;
}

export class ComputerVisionService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
  }

  /**
   * Analyze photo for quality, amenities, and damage
   */
  async analyzePhoto(
    imageUrl: string,
    analysisTypes: Array<'quality' | 'amenity' | 'damage'> = ['quality', 'amenity', 'damage']
  ): Promise<{ result: PhotoAnalysisResult; metadata: AnalysisMetadata }> {
    const startTime = Date.now();

    try {
      // Use Gemini 2.5 Flash Image or FLUX for analysis
      const prompt = this.buildAnalysisPrompt(analysisTypes);
      
      const analysis = await this.callVisionModel(imageUrl, prompt);
      
      const parsedResult = this.parseAnalysisResult(analysis, analysisTypes);

      return {
        result: parsedResult,
        metadata: {
          model: 'gemini-2.5-flash-image',
          processingTime: Date.now() - startTime,
          imageUrl,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      console.error('Photo analysis failed:', error);
      throw new Error(`Computer vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build prompt for vision model based on analysis types
   */
  private buildAnalysisPrompt(analysisTypes: Array<'quality' | 'amenity' | 'damage'>): string {
    const parts: string[] = [];

    if (analysisTypes.includes('quality')) {
      parts.push(`
        Analyze the photo quality:
        - Rate overall quality (0-100)
        - Assess brightness (0-100)
        - Assess sharpness (0-100)
        - Assess composition (0-100)
        - Assess professionalism (0-100)
        - Provide 3-5 specific suggestions for improvement
      `);
    }

    if (analysisTypes.includes('amenity')) {
      parts.push(`
        Detect all visible amenities and features:
        - List each amenity with confidence score (0-1)
        - Categorize: technology, comfort, kitchen, bathroom, outdoor, safety, entertainment
        - Include: WiFi, TV, AC, heating, pool, gym, parking, balcony, view, etc.
      `);
    }

    if (analysisTypes.includes('damage')) {
      parts.push(`
        Check for any damage or maintenance issues:
        - Water damage (stains, mold, peeling paint)
        - Fire damage (burn marks, smoke)
        - Structural damage (cracks, holes)
        - Wear and tear (scratches, dents, worn furniture)
        - Rate severity: none, minor, moderate, severe
        - Provide description if damage found
      `);
    }

    return `
You are a professional hotel property photographer and inspector.
Analyze this property photo and provide JSON output.

${parts.join('\n')}

Respond ONLY with valid JSON in this exact format:
{
  "qualityScore": 85,
  "qualityMetrics": {
    "brightness": 90,
    "sharpness": 85,
    "composition": 80,
    "professionalism": 85
  },
  "amenities": [
    {"name": "WiFi router", "confidence": 0.95, "category": "technology"},
    {"name": "Flat-screen TV", "confidence": 0.98, "category": "entertainment"}
  ],
  "damage": {
    "detected": false,
    "type": null,
    "severity": null,
    "description": null,
    "confidence": null
  },
  "suggestions": [
    "Increase lighting to reduce shadows",
    "Straighten the frame for better composition"
  ]
}
    `.trim();
  }

  /**
   * Call vision model (Gemini/FLUX)
   */
  private async callVisionModel(imageUrl: string, prompt: string): Promise<string> {
    // Using inference.sh or direct API call
    const response = await fetch('https://api.inference.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Parse AI response into structured result
   */
  private parseAnalysisResult(
    aiResponse: string,
    analysisTypes: Array<'quality' | 'amenity' | 'damage'>
  ): PhotoAnalysisResult {
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from AI');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        qualityScore: analysisTypes.includes('quality') ? (parsed.qualityScore ?? 0) : 0,
        qualityMetrics: analysisTypes.includes('quality') ? (parsed.qualityMetrics ?? {
          brightness: 0, sharpness: 0, composition: 0, professionalism: 0
        }) : { brightness: 0, sharpness: 0, composition: 0, professionalism: 0 },
        amenities: analysisTypes.includes('amenity') ? (parsed.amenities ?? []) : [],
        damage: analysisTypes.includes('damage') ? (parsed.damage ?? { detected: false }) : { detected: false },
        suggestions: parsed.suggestions ?? [],
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return default structure on parse error
      return {
        qualityScore: 0,
        qualityMetrics: { brightness: 0, sharpness: 0, composition: 0, professionalism: 0 },
        amenities: [],
        damage: { detected: false },
        suggestions: ['Unable to analyze photo - please try again'],
      };
    }
  }

  /**
   * Batch analyze multiple photos
   */
  async batchAnalyzePhotos(
    photos: Array<{ id: string; imageUrl: string }>,
    analysisTypes: Array<'quality' | 'amenity' | 'damage'> = ['quality', 'amenity']
  ): Promise<Map<string, { result: PhotoAnalysisResult; metadata: AnalysisMetadata }>> {
    const results = new Map();

    for (const photo of photos) {
      try {
        const { result, metadata } = await this.analyzePhoto(photo.imageUrl, analysisTypes);
        results.set(photo.id, { result, metadata });
      } catch (error) {
        console.error(`Failed to analyze photo ${photo.id}:`, error);
        results.set(photo.id, { error: error instanceof Error ? error.message : 'Analysis failed' });
      }
    }

    return results;
  }

  /**
   * Get quality improvement recommendations
   */
  generateQualityRecommendations(analysis: PhotoAnalysisResult): string[] {
    const recommendations: string[] = [];

    if (analysis.qualityMetrics.brightness < 70) {
      recommendations.push('Improve lighting - consider professional photography lighting or shoot during golden hour');
    }

    if (analysis.qualityMetrics.sharpness < 70) {
      recommendations.push('Use a tripod or increase shutter speed to reduce blur');
    }

    if (analysis.qualityMetrics.composition < 70) {
      recommendations.push('Improve composition - follow rule of thirds and keep horizons level');
    }

    if (analysis.qualityMetrics.professionalism < 70) {
      recommendations.push('Consider hiring a professional photographer for best results');
    }

    if (analysis.damage.detected) {
      recommendations.push(`Address ${analysis.damage.type || 'damage'} before photographing: ${analysis.damage.description}`);
    }

    return [...recommendations, ...analysis.suggestions];
  }

  /**
   * Calculate amenity completeness score
   */
  calculateAmenityScore(amenities: PhotoAnalysisResult['amenities'], expectedAmenities: string[]): number {
    if (expectedAmenities.length === 0) return 100;

    const detectedNames = amenities.map(a => a.name.toLowerCase());
    const matches = expectedAmenities.filter(expected =>
      detectedNames.some(detected => detected.includes(expected.toLowerCase()))
    );

    return Math.round((matches.length / expectedAmenities.length) * 100);
  }
}

export const computerVisionService = new ComputerVisionService();
