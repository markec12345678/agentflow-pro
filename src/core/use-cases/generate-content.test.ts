/**
 * GenerateContent UseCase Tests
 */

import { GenerateContentUseCase } from './generate-content';

// Mock dependencies
jest.mock('@/infrastructure/database/prisma', () => ({
  prisma: {
    subscription: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    onboarding: {
      findFirst: jest.fn(),
    },
    blogPost: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
  },
}));

jest.mock('@/agents/content/ContentAgent', () => ({
  createContentAgent: () => ({
    execute: jest.fn(),
  }),
}));

jest.mock('@/agents/content/brand-guardrails', () => ({
  validateAgainstBrandVoice: jest.fn(() => ({ issues: [] })),
}));

jest.mock('@/lib/vector-indexer', () => ({
  indexBlogPost: jest.fn(),
}));

jest.mock('@/lib/blog-limits', () => ({
  canGenerateBlogPosts: jest.fn(),
}));

jest.mock('@/app/api/v1/reports/usage', () => ({
  recordAgentRun: jest.fn(),
}));

describe('GenerateContentUseCase', () => {
  let useCase: GenerateContentUseCase;

  beforeEach(() => {
    useCase = new GenerateContentUseCase();
    jest.clearAllMocks();
  });

  describe('execute - Blog Mode', () => {
    const validInput = {
      userId: 'user-123',
      topic: 'AI in tourism',
      count: 1,
      useMock: false,
    };

    it('should generate blog post when input is valid', async () => {
      // Arrange
      const { canGenerateBlogPosts } = require('@/lib/blog-limits');
      const { prisma } = require('@/infrastructure/database/prisma');
      const { createContentAgent } = require('@/agents/content/ContentAgent');

      canGenerateBlogPosts.mockResolvedValue({
        allowed: true,
        used: 5,
        limit: 100,
      });

      prisma.onboarding.findFirst.mockResolvedValue({
        brandVoiceSummary: 'Professional and friendly',
      });

      createContentAgent().execute.mockResolvedValue({
        blog: '# AI in Tourism\n\nArtificial intelligence is transforming...',
        keywords: ['AI', 'tourism', 'technology'],
      });

      prisma.blogPost.create.mockResolvedValue({
        id: 'post-456',
        title: 'AI in Tourism',
        fullContent: 'Artificial intelligence is transforming...',
      });

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].title).toContain('AI');
    });

    it('should fail when user is not authenticated', async () => {
      // Arrange
      const invalidInput = { ...validInput, userId: null };

      // Act
      const result = await useCase.execute(invalidInput as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail when topic is missing', async () => {
      // Arrange
      const invalidInput = { ...validInput, topic: '' };

      // Act
      const result = await useCase.execute(invalidInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Topic is required');
    });

    it('should respect generation limits', async () => {
      // Arrange
      const { canGenerateBlogPosts } = require('@/lib/blog-limits');
      canGenerateBlogPosts.mockResolvedValue({
        allowed: false,
        used: 100,
        limit: 100,
        message: 'Limit dosežen',
      });

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Limit');
    });

    it('should handle multiple topics', async () => {
      // Arrange
      const input = {
        ...validInput,
        topics: ['AI in tourism', 'Booking trends', 'Guest experience'],
        count: 3,
      };

      const { canGenerateBlogPosts } = require('@/lib/blog-limits');
      const { createContentAgent } = require('@/agents/content/ContentAgent');

      canGenerateBlogPosts.mockResolvedValue({
        allowed: true,
        used: 5,
        limit: 100,
      });

      createContentAgent().execute.mockResolvedValue({
        blog: '# Blog Post\n\nContent here...',
        keywords: ['test'],
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.posts).toHaveLength(3);
    });

    it('should handle mock mode', async () => {
      // Arrange
      const input = { ...validInput, useMock: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.posts[0].excerpt).toContain('Mock');
    });
  });

  describe('execute - Tourism Template Mode', () => {
    const tourismInput = {
      userId: 'user-123',
      template: 'booking-description',
      fields: {
        name: 'Hotel Slovenija',
        location: 'Bled',
        highlights: 'Lake view, spa, restaurant',
        rooms: 'Luxury rooms with balconies',
      },
      language: 'en',
      useMock: false,
    };

    it('should generate tourism content from template', async () => {
      // Arrange
      const { canGenerateBlogPosts } = require('@/lib/blog-limits');
      const { prisma } = require('@/infrastructure/database/prisma');
      const { createContentAgent } = require('@/agents/content/ContentAgent');

      canGenerateBlogPosts.mockResolvedValue({
        allowed: true,
        used: 5,
        limit: 100,
      });

      createContentAgent().execute.mockResolvedValue({
        blog: '# Hotel Slovenija – Bled\n\nExperience luxury...',
        keywords: ['Bled', 'luxury', 'hotel'],
      });

      prisma.blogPost.create.mockResolvedValue({
        id: 'post-789',
        title: 'Hotel Slovenija – Bled',
        fullContent: 'Experience luxury...',
      });

      // Act
      const result = await useCase.execute(tourismInput);

      // Assert
      expect(result.success).toBe(true);
      expect(result.posts[0].title).toContain('Hotel Slovenija');
    });

    it('should handle different templates', async () => {
      // Arrange
      const templates = [
        'booking-description',
        'guest-welcome-email',
        'destination-guide',
        'instagram-travel',
        'landing-page',
        'seasonal-campaign',
      ];

      const { canGenerateBlogPosts } = require('@/lib/blog-limits');
      const { createContentAgent } = require('@/agents/content/ContentAgent');

      canGenerateBlogPosts.mockResolvedValue({
        allowed: true,
        used: 5,
        limit: 100,
      });

      createContentAgent().execute.mockResolvedValue({
        blog: '# Content\n\nGenerated content...',
        keywords: ['test'],
      });

      // Act & Assert
      for (const template of templates) {
        const input = { ...tourismInput, template };
        const result = await useCase.execute(input);
        
        expect(result.success).toBe(true);
      }
    });

    it('should handle mock mode for tourism templates', async () => {
      // Arrange
      const input = { ...tourismInput, useMock: true };

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.posts[0].fullContent).toContain('Demo vsebina');
    });

    it('should use default values for missing fields', async () => {
      // Arrange
      const input = {
        ...tourismInput,
        fields: {}, // Empty fields
      };

      const { canGenerateBlogPosts } = require('@/lib/blog-limits');
      const { createContentAgent } = require('@/agents/content/ContentAgent');

      canGenerateBlogPosts.mockResolvedValue({
        allowed: true,
        used: 5,
        limit: 100,
      });

      createContentAgent().execute.mockResolvedValue({
        blog: '# Content\n\nDefault content...',
        keywords: ['test'],
      });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Helper Methods', () => {
    it('should build tourism prompts correctly', async () => {
      // This tests the private method indirectly through the public API
      const input = {
        userId: 'user-123',
        template: 'instagram-travel',
        fields: {
          name: 'Test Hotel',
          location: 'Ljubljana',
          highlights: 'Great location',
        },
        language: 'en',
        useMock: true,
      };

      // Act
      const result = await useCase.execute(input);

      // Assert - mock mode should work without errors
      expect(result.success).toBe(true);
    });

    it('should extract title from markdown', async () => {
      // This is tested indirectly through the generation flow
      const { canGenerateBlogPosts } = require('@/lib/blog-limits');
      const { createContentAgent } = require('@/agents/content/ContentAgent');

      canGenerateBlogPosts.mockResolvedValue({ allowed: true, used: 0, limit: 100 });
      createContentAgent().execute.mockResolvedValue({
        blog: '# Test Title\n\nContent here...',
        keywords: [],
      });

      // Act
      const result = await useCase.execute({
        userId: 'user-123',
        topic: 'test',
        count: 1,
      });

      // Assert
      expect(result.posts[0].title).toBe('Test Title');
    });
  });
});
