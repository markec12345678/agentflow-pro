/**
 * Test Coverage: Vector Indexer Error Handling
 * Tests for Qdrant vector indexing error scenarios
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock fetch for Qdrant HTTP calls
global.fetch = jest.fn();

describe('Vector Indexer - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Qdrant connection errors', () => {
    it('should handle Qdrant connection timeout', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('ETIMEDOUT'));
      
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', { data: 'test' }))
        .rejects
        .toThrow('Vector indexing failed: ETIMEDOUT');
    });

    it('should handle Qdrant 401 unauthorized', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid API key' })
      });
      
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', { data: 'test' }))
        .rejects
        .toThrow('Qdrant authentication failed');
    });

    it('should handle Qdrant 404 collection not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: 'Collection not found' })
      });
      
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', { data: 'test' }))
        .rejects
        .toThrow('Vector collection not found');
    });

    it('should handle Qdrant 503 service unavailable', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: 'Service temporarily unavailable' })
      });
      
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', { data: 'test' }))
        .rejects
        .toThrow('Vector service temporarily unavailable');
    });
  });

  describe('Invalid input handling', () => {
    it('should handle null onboarding data', async () => {
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', null as any))
        .rejects
        .toThrow('Invalid onboarding data');
    });

    it('should handle empty onboarding data', async () => {
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', {}))
        .rejects
        .toThrow('No content to index');
    });

    it('should handle oversized onboarding data', async () => {
      const largeData = { 
        industry: 'test',
        companyKnowledge: 'a'.repeat(100000) // Exceeds limit
      };
      
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', largeData))
        .rejects
        .toThrow('Content exceeds maximum size');
    });
  });

  describe('Retry logic', () => {
    it('should retry on transient errors', async () => {
      // Fail first 2 times, succeed on 3rd
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ result: 'success' }) });
      
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', { industry: 'test' }))
        .resolves
        .toBeDefined();
      
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should not retry on permanent errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid request' })
      });
      
      const { indexOnboarding } = await import('../../src/lib/vector-indexer');
      
      await expect(indexOnboarding('user123', { industry: 'test' }))
        .rejects
        .toThrow();
      
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('indexUserTemplate error handling', () => {
    it('should handle missing template content', async () => {
      const { indexUserTemplate } = await import('../../src/lib/vector-indexer');
      
      await expect(indexUserTemplate('template123', {
        id: 'template123',
        name: 'Test',
        basePrompt: '' // Empty content
      }))
        .rejects
        .toThrow('No content to index');
    });

    it('should handle template with invalid JSON', async () => {
      const { indexUserTemplate } = await import('../../src/lib/vector-indexer');
      
      const invalidTemplate = {
        id: 'template123',
        name: 'Test',
        customVars: 'invalid-json' // Should be JSON object
      };
      
      await expect(indexUserTemplate('template123', invalidTemplate as any))
        .rejects
        .toThrow();
    });
  });

  describe('indexBlogPost error handling', () => {
    it('should handle blog post without content', async () => {
      const { indexBlogPost } = await import('../../src/lib/vector-indexer');
      
      await expect(indexBlogPost('post123', {
        id: 'post123',
        title: 'Test Post',
        fullContent: null
      }))
        .rejects
        .toThrow('No content to index');
    });

    it('should handle very long blog post titles', async () => {
      const { indexBlogPost } = await import('../../src/lib/vector-indexer');
      
      const longTitle = 'a'.repeat(1000);
      
      await expect(indexBlogPost('post123', {
        id: 'post123',
        title: longTitle,
        fullContent: 'Test content'
      }))
        .resolves
        .toBeDefined(); // Should truncate, not fail
    });
  });

  describe('searchDocuments error handling', () => {
    it('should handle empty search query', async () => {
      const { searchDocuments } = await import('../../src/lib/vector-indexer');
      
      await expect(searchDocuments('', 5))
        .rejects
        .toThrow('Search query cannot be empty');
    });

    it('should handle search with no results', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: [] })
      });
      
      const { searchDocuments } = await import('../../src/lib/vector-indexer');
      
      const results = await searchDocuments('test query', 5);
      
      expect(results).toEqual([]);
    });

    it('should handle search with low confidence scores', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          result: [
            { score: 0.3, payload: { content: 'Low relevance' } }
          ]
        })
      });
      
      const { searchDocuments } = await import('../../src/lib/vector-indexer');
      
      const results = await searchDocuments('test query', 5);
      
      // Should filter out low confidence results
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });
});
