/**
 * AgentFlow Pro - Multi-Modal AI Agent
 * Image generation, analysis, and editing using FLUX, Gemini, and other models
 */

import type { Agent } from "../../orchestrator/Orchestrator";

export interface ImageGenerationInput {
  prompt: string;
  negativePrompt?: string;
  model?: 'flux-dev' | 'flux-schnell' | 'gemini-image' | 'stable-diffusion';
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  style?: 'photorealistic' | 'artistic' | 'anime' | '3d-render' | 'sketch';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:2';
}

export interface ImageAnalysisInput {
  imageUrl: string;
  task: 'caption' | 'object_detection' | 'ocr' | 'scene_understanding' | 'quality_check';
  prompt?: string;
}

export interface ImageEditingInput {
  baseImageUrl: string;
  maskImageUrl?: string;
  prompt: string;
  editType: 'inpaint' | 'outpaint' | 'modify' | 'enhance';
  strength?: number;
}

export interface ImageOutput {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  metadata?: {
    model: string;
    width: number;
    height: number;
    seed?: number;
    generationTime: number;
  };
  analysis?: {
    caption?: string;
    objects?: Array<{ label: string; confidence: number; bbox?: number[] }>;
    text?: string;
    colors?: string[];
    quality?: number;
  };
  error?: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
  createdAt: string;
  metadata: any;
}

export class MultiModalAgent {
  private apiKey: string;
  private generatedImages: Map<string, GeneratedImage> = new Map();

  constructor() {
    this.apiKey = process.env.INFERENCE_SH_API_KEY || process.env.HUGGINGFACE_API_KEY || '';
  }

  /**
   * Create image generation agent
   */
  createImageAgent(): Agent {
    return {
      id: 'image-agent',
      type: 'image',
      name: 'Multi-Modal Image Agent',
      execute: async (input: unknown): Promise<ImageOutput> => {
        const genInput = input as ImageGenerationInput;
        return this.generateImage(genInput);
      },
    };
  }

  /**
   * Create image analysis agent
   */
  createAnalysisAgent(): Agent {
    return {
      id: 'image-analysis-agent',
      type: 'image',
      name: 'Image Analysis Agent',
      execute: async (input: unknown): Promise<ImageOutput> => {
        const analysisInput = input as ImageAnalysisInput;
        return this.analyzeImage(analysisInput);
      },
    };
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(input: ImageGenerationInput): Promise<ImageOutput> {
    const startTime = Date.now();

    try {
      // Resolve aspect ratio
      const dimensions = this.resolveDimensions(input.aspectRatio, input.width, input.height);

      // Prepare request
      const model = this.resolveModel(input.model, input.style);
      const prompt = this.enhancePrompt(input.prompt, input.style);

      const response = await fetch('https://api.inference.sh/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          negative_prompt: input.negativePrompt,
          width: dimensions.width,
          height: dimensions.height,
          steps: input.steps || 28,
          guidance_scale: input.guidanceScale || 7.5,
          seed: input.seed,
        }),
      });

      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      const imageUrl = result.data?.[0]?.url || result.images?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      // Store generated image
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const generatedImage: GeneratedImage = {
        id: imageId,
        url: imageUrl,
        prompt: input.prompt,
        model,
        width: dimensions.width,
        height: dimensions.height,
        createdAt: new Date().toISOString(),
        metadata: {
          seed: result.seed,
          steps: input.steps,
          guidanceScale: input.guidanceScale,
        },
      };

      this.generatedImages.set(imageId, generatedImage);

      return {
        success: true,
        imageUrl,
        metadata: {
          model,
          width: dimensions.width,
          height: dimensions.height,
          seed: result.seed,
          generationTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image generation failed',
      };
    }
  }

  /**
   * Analyze image content
   */
  async analyzeImage(input: ImageAnalysisInput): Promise<ImageOutput> {
    try {
      const analysis = await this.performImageAnalysis(
        input.imageUrl,
        input.task,
        input.prompt
      );

      return {
        success: true,
        analysis,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image analysis failed',
      };
    }
  }

  /**
   * Edit existing image
   */
  async editImage(input: ImageEditingInput): Promise<ImageOutput> {
    const startTime = Date.now();

    try {
      const model = input.editType === 'inpaint' ? 'flux-inpainting' : 'flux-edit';

      const formData = new FormData();
      formData.append('model', model);
      formData.append('prompt', input.prompt);
      formData.append('strength', String(input.strength || 0.8));

      // Upload base image
      const baseImageBlob = await this.fetchImageAsBlob(input.baseImageUrl);
      formData.append('image', baseImageBlob, 'base.png');

      // Upload mask if provided
      if (input.maskImageUrl) {
        const maskBlob = await this.fetchImageAsBlob(input.maskImageUrl);
        formData.append('mask_image', maskBlob, 'mask.png');
      }

      const response = await fetch('https://api.inference.sh/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Image editing failed: ${response.statusText}`);
      }

      const result = await response.json();
      const imageUrl = result.data?.[0]?.url || result.images?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      return {
        success: true,
        imageUrl,
        metadata: {
          model,
          width: 1024,
          height: 1024,
          generationTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image editing failed',
      };
    }
  }

  /**
   * Generate image variations
   */
  async generateVariations(
    imageUrl: string,
    count: number = 4,
    prompt?: string
  ): Promise<ImageOutput[]> {
    const results: ImageOutput[] = [];

    for (let i = 0; i < count; i++) {
      const result = await this.generateImage({
        prompt: prompt || `Variation of image`,
        seed: Date.now() + i, // Different seed for each variation
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Get generated image history
   */
  getGeneratedImages(limit: number = 20): GeneratedImage[] {
    return Array.from(this.generatedImages.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  /**
   * Perform image analysis using vision model
   */
  private async performImageAnalysis(
    imageUrl: string,
    task: string,
    customPrompt?: string
  ): Promise<NonNullable<ImageOutput['analysis']>> {
    const prompts: Record<string, string> = {
      caption: 'Describe this image in detail.',
      object_detection: 'List all objects visible in this image with their locations.',
      ocr: 'Extract all text visible in this image.',
      scene_understanding: 'Analyze the scene, context, and mood of this image.',
      quality_check: 'Evaluate the technical quality of this image (lighting, composition, focus).',
    };

    const prompt = customPrompt || prompts[task] || 'Analyze this image.';

    const response = await fetch('https://api.inference.sh/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Image analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content || '';

    // Parse analysis based on task
    return this.parseAnalysis(analysisText, task);
  }

  /**
   * Parse analysis result
   */
  private parseAnalysis(text: string, task: string): NonNullable<ImageOutput['analysis']> {
    switch (task) {
      case 'caption':
        return { caption: text };
      case 'ocr':
        return { text };
      case 'quality_check':
        return { quality: this.extractQualityScore(text) };
      default:
        return { caption: text };
    }
  }

  /**
   * Extract quality score from analysis
   */
  private extractQualityScore(text: string): number {
    // Simple heuristic - in production use structured output
    const positiveWords = ['excellent', 'good', 'great', 'high', 'sharp', 'clear'];
    const negativeWords = ['poor', 'bad', 'low', 'blurry', 'dark', 'noise'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    return Math.max(0, Math.min(1, 0.5 + (positiveCount - negativeCount) * 0.1));
  }

  /**
   * Resolve model from style
   */
  private resolveModel(model?: string, style?: string): string {
    if (model) return model;

    const styleModels: Record<string, string> = {
      'photorealistic': 'flux-dev',
      'artistic': 'stable-diffusion-xl',
      'anime': 'anime-diffusion',
      '3d-render': 'flux-dev',
      'sketch': 'stable-diffusion',
    };

    return styleModels[style || 'photorealistic'] || 'flux-dev';
  }

  /**
   * Resolve dimensions from aspect ratio
   */
  private resolveDimensions(
    aspectRatio?: string,
    width?: number,
    height?: number
  ): { width: number; height: number } {
    if (width && height) return { width, height };

    const ratios: Record<string, { width: number; height: number }> = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '4:3': { width: 1024, height: 768 },
      '3:2': { width: 1024, height: 683 },
    };

    return ratios[aspectRatio || '1:1'] || { width: 1024, height: 1024 };
  }

  /**
   * Enhance prompt for better results
   */
  private enhancePrompt(prompt: string, style?: string): string {
    const styleEnhancers: Record<string, string> = {
      'photorealistic': 'highly detailed, photorealistic, 8k, professional photography',
      'artistic': 'artistic, creative, stylized, masterpiece',
      'anime': 'anime style, studio ghibli, detailed, vibrant colors',
      '3d-render': '3d render, octane render, unreal engine 5, ray tracing',
      'sketch': 'pencil sketch, detailed drawing, black and white',
    };

    const enhancer = styleEnhancers[style || 'photorealistic'] || '';
    return `${prompt}, ${enhancer}`.trim();
  }

  /**
   * Fetch image as blob
   */
  private async fetchImageAsBlob(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    return response.blob();
  }
}

/**
 * Create multi-modal agent factory
 */
export function createMultiModalAgent(): Agent {
  const agent = new MultiModalAgent();
  return agent.createImageAgent();
}

export function createImageAnalysisAgent(): Agent {
  const agent = new MultiModalAgent();
  return agent.createAnalysisAgent();
}

export const multiModalAgent = new MultiModalAgent();
