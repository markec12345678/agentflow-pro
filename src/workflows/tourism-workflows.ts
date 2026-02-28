/**
 * AgentFlow Pro - Tourism Workflows
 * MVP use cases for tourism industry
 */

import { Orchestrator } from '../orchestrator/Orchestrator';
import { createResearchAgent } from '../agents/research/ResearchAgent';
import { createContentAgent } from '../agents/content/ContentAgent';
import { createReservationAgent } from '../agents/reservation/reservationAgent';
import { createCommunicationAgent } from '../agents/communication/communicationAgent';

export interface TourismWorkflowInput {
  useCase: 'property_description' | 'tour_package' | 'destination_blog' | 'guest_automation' | 'social_media' | 'translation';
  propertyData?: {
    name: string;
    location: string;
    type: string;
    amenities: string[];
    rating?: number;
    targetAudience?: string;
  };
  tourData?: {
    destination: string;
    duration: number;
    activities: string[];
    accommodation: string;
    priceRange?: string;
    targetMarket?: string;
  };
  destinationData?: {
    location: string;
    topics: string[];
    tone?: string;
    targetAudience?: string;
    seoKeywords?: string[];
  };
  guestData?: {
    guestId: string;
    reservationId: string;
    messageType: 'pre_arrival' | 'post_stay' | 'check_in' | 'check_out';
    language?: string;
    personalization?: string;
  };
  socialData?: {
    platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
    contentType: 'image' | 'text' | 'story';
    topic: string;
    brandVoice?: string;
  };
  translationData?: {
    content: string;
    sourceLanguage: string;
    targetLanguages: string[];
    contentType: 'description' | 'email' | 'social' | 'blog';
  };
}

export interface TourismWorkflowOutput {
  success: boolean;
  content?: {
    description?: string;
    blogPost?: string;
    socialContent?: string;
    emailContent?: string;
    translatedContent?: Record<string, string>;
  };
  metadata?: {
    wordCount?: number;
    seoScore?: number;
    languages?: string[];
    generatedAt: Date;
    workflowType: string;
  };
  errors?: string[];
}

export class TourismWorkflows {
  private orchestrator: Orchestrator;

  constructor() {
    this.orchestrator = new Orchestrator();
    this.initializeAgents();
  }

  private initializeAgents(): void {
    this.orchestrator.registerAgent(createResearchAgent());
    this.orchestrator.registerAgent(createContentAgent());
    this.orchestrator.registerAgent(createReservationAgent());
    this.orchestrator.registerAgent(createCommunicationAgent());
  }

  async executeWorkflow(input: TourismWorkflowInput): Promise<TourismWorkflowOutput> {
    try {
      switch (input.useCase) {
        case 'property_description':
          return await this.generatePropertyDescription(input);
        case 'tour_package':
          return await this.generateTourPackage(input);
        case 'destination_blog':
          return await this.generateDestinationBlog(input);
        case 'guest_automation':
          return await this.automateGuestCommunication(input);
        case 'social_media':
          return await this.generateSocialMediaContent(input);
        case 'translation':
          return await this.translateContent(input);
        default:
          return {
            success: false,
            errors: [`Unknown use case: ${input.useCase}`]
          };
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  private async generatePropertyDescription(input: TourismWorkflowInput): Promise<TourismWorkflowOutput> {
    if (!input.propertyData) {
      return { success: false, errors: ['Property data required'] };
    }

    // Research competitor properties
    const researchTaskId = await this.orchestrator.queueTask('research', {
      query: `${input.propertyData.location} ${input.propertyData.type} property descriptions amenities`,
      urls: []
    });

    const researchResult = await this.orchestrator.getTask(researchTaskId);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for completion

    // Generate content using research + property data
    const contentTaskId = await this.orchestrator.queueTask('content', {
      topic: `${input.propertyData.name} ${input.propertyData.location}`,
      format: 'blog',
      brandVoiceSummary: 'Luxury hospitality, professional yet welcoming',
      audienceContext: input.propertyData.targetAudience,
      companyKnowledge: {
        propertyName: input.propertyData.name,
        location: input.propertyData.location,
        amenities: input.propertyData.amenities,
        type: input.propertyData.type,
        rating: input.propertyData.rating
      }
    });

    const contentResult = await this.orchestrator.getTask(contentTaskId);
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      success: true,
      content: {
        description: (contentResult?.result as any)?.blog || 'Generated property description'
      },
      metadata: {
        wordCount: (contentResult?.result as any)?.blog?.length || 0,
        generatedAt: new Date(),
        workflowType: 'property_description'
      }
    };
  }

  private async generateTourPackage(input: TourismWorkflowInput): Promise<TourismWorkflowOutput> {
    if (!input.tourData) {
      return { success: false, errors: ['Tour data required'] };
    }

    // Research destination and competitor packages
    const researchTaskId = await this.orchestrator.queueTask('research', {
      query: `${input.tourData.destination} tour packages ${input.tourData.duration} days activities`,
      urls: []
    });

    // Generate comprehensive tour package content
    const contentTaskId = await this.orchestrator.queueTask('content', {
      topic: `${input.tourData.destination} ${input.tourData.duration} day tour package`,
      format: 'blog',
      brandVoiceSummary: 'Exciting, adventurous, informative',
      audienceContext: input.tourData.targetMarket,
      companyKnowledge: {
        destination: input.tourData.destination,
        duration: input.tourData.duration,
        activities: input.tourData.activities,
        accommodation: input.tourData.accommodation,
        priceRange: input.tourData.priceRange
      }
    });

    const contentResult = await this.orchestrator.getTask(contentTaskId);
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      success: true,
      content: {
        blogPost: (contentResult?.result as any)?.blog || 'Generated tour package content'
      },
      metadata: {
        wordCount: (contentResult?.result as any)?.blog?.length || 0,
        generatedAt: new Date(),
        workflowType: 'tour_package'
      }
    };
  }

  private async generateDestinationBlog(input: TourismWorkflowInput): Promise<TourismWorkflowOutput> {
    if (!input.destinationData) {
      return { success: false, errors: ['Destination data required'] };
    }

    // Research destination trends and topics
    const researchTaskId = await this.orchestrator.queueTask('research', {
      query: `${input.destinationData.location} travel guide ${input.destinationData.topics.join(' ')}`,
      urls: []
    });

    // Generate SEO-optimized blog content
    const contentTaskId = await this.orchestrator.queueTask('content', {
      topic: `${input.destinationData.location} ${input.destinationData.topics[0]}`,
      format: 'blog',
      brandVoiceSummary: input.destinationData.tone || 'Informative, engaging, travel-focused',
      audienceContext: input.destinationData.targetAudience,
      companyKnowledge: {
        location: input.destinationData.location,
        topics: input.destinationData.topics,
        keywords: input.destinationData.seoKeywords
      }
    });

    const contentResult = await this.orchestrator.getTask(contentTaskId);
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
      success: true,
      content: {
        blogPost: (contentResult?.result as any)?.blog || 'Generated destination blog content'
      },
      metadata: {
        wordCount: (contentResult?.result as any)?.blog?.length || 0,
        seoScore: 85, // Mock SEO score
        generatedAt: new Date(),
        workflowType: 'destination_blog'
      }
    };
  }

  private async automateGuestCommunication(input: TourismWorkflowInput): Promise<TourismWorkflowOutput> {
    if (!input.guestData) {
      return { success: false, errors: ['Guest data required'] };
    }

    // Generate personalized guest communication
    const communicationTaskId = await this.orchestrator.queueTask('communication', {
      action: 'send_message',
      guestId: input.guestData.guestId,
      reservationId: input.guestData.reservationId,
      messageType: input.guestData.messageType,
      language: input.guestData.language || 'en',
      customMessage: input.guestData.personalization
    });

    const communicationResult = await this.orchestrator.getTask(communicationTaskId);
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      content: {
        emailContent: (communicationResult?.result as any)?.content || 'Generated guest communication'
      },
      metadata: {
        wordCount: (communicationResult?.result as any)?.content?.length || 0,
        languages: [input.guestData.language || 'en'],
        generatedAt: new Date(),
        workflowType: 'guest_automation'
      }
    };
  }

  private async generateSocialMediaContent(input: TourismWorkflowInput): Promise<TourismWorkflowOutput> {
    if (!input.socialData) {
      return { success: false, errors: ['Social media data required'] };
    }

    // Generate platform-specific social content
    const contentTaskId = await this.orchestrator.queueTask('content', {
      topic: input.socialData.topic,
      format: 'social',
      brandVoiceSummary: input.socialData.brandVoice || 'Engaging, visual, travel-inspired',
      audienceContext: `${input.socialData.platform} audience`,
      companyKnowledge: {
        platform: input.socialData.platform,
        contentType: input.socialData.contentType,
        topic: input.socialData.topic
      }
    });

    const contentResult = await this.orchestrator.getTask(contentTaskId);
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      content: {
        socialContent: (contentResult?.result as any)?.social || 'Generated social media content'
      },
      metadata: {
        wordCount: (contentResult?.result as any)?.social?.length || 0,
        generatedAt: new Date(),
        workflowType: 'social_media'
      }
    };
  }

  private async translateContent(input: TourismWorkflowInput): Promise<TourismWorkflowOutput> {
    if (!input.translationData) {
      return { success: false, errors: ['Translation data required'] };
    }

    const translatedContent: Record<string, string> = {};

    // For each target language, use communication agent for translation
    for (const language of input.translationData.targetLanguages) {
      const translationTaskId = await this.orchestrator.queueTask('communication', {
        action: 'send_message',
        language,
        customMessage: input.translationData.content
      });

      const translationResult = await this.orchestrator.getTask(translationTaskId);
      await new Promise(resolve => setTimeout(resolve, 1000));

      translatedContent[language] = (translationResult?.result as any)?.content ||
        `Translated content for ${language}`;
    }

    return {
      success: true,
      content: {
        translatedContent
      },
      metadata: {
        wordCount: input.translationData.content.length,
        languages: input.translationData.targetLanguages,
        generatedAt: new Date(),
        workflowType: 'translation'
      }
    };
  }
}

// Singleton instance for application use
let tourismWorkflows: TourismWorkflows | null = null;

export function getTourismWorkflows(): TourismWorkflows {
  if (!tourismWorkflows) {
    tourismWorkflows = new TourismWorkflows();
  }
  return tourismWorkflows;
}
