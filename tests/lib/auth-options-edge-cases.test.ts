/**
 * Test Coverage: Auth Options Edge Cases
 * Tests for next-auth options configuration
 * Coverage target: 85%+
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authOptions } from '../../src/lib/auth/options';

describe('Auth Options', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('NEXTAUTH_SECRET validation', () => {
    it('should throw error when NEXTAUTH_SECRET is missing in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXTAUTH_SECRET = '';
      
      expect(() => authOptions).toThrow('NEXTAUTH_SECRET');
    });

    it('should allow missing NEXTAUTH_SECRET in development', () => {
      process.env.NODE_ENV = 'development';
      process.env.NEXTAUTH_SECRET = '';
      
      expect(() => authOptions).not.toThrow();
    });

    it('should accept valid NEXTAUTH_SECRET (min 32 chars)', () => {
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.NEXTAUTH_URL = 'http://localhost:3002';
      
      expect(() => authOptions).not.toThrow();
    });
  });

  describe('Providers configuration', () => {
    it('should include credentials provider by default', () => {
      process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-characters';
      process.env.NEXTAUTH_URL = 'http://localhost:3002';
      
      const options = authOptions;
      const credentialsProvider = options.providers.find(p => p.id === 'credentials');
      
      expect(credentialsProvider).toBeDefined();
    });

    it('should include Google provider when credentials are set', () => {
      process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-characters';
      process.env.NEXTAUTH_URL = 'http://localhost:3002';
      process.env.GOOGLE_CLIENT_ID = 'test-google-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';
      
      const options = authOptions;
      const googleProvider = options.providers.find(p => p.id === 'google');
      
      expect(googleProvider).toBeDefined();
    });

    it('should exclude Google provider when credentials are missing', () => {
      process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-characters';
      process.env.NEXTAUTH_URL = 'http://localhost:3002';
      process.env.GOOGLE_CLIENT_ID = '';
      process.env.GOOGLE_CLIENT_SECRET = '';
      
      const options = authOptions;
      const googleProvider = options.providers.find(p => p.id === 'google');
      
      expect(googleProvider).toBeUndefined();
    });
  });

  describe('Callbacks', () => {
    beforeEach(() => {
      process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-characters';
      process.env.NEXTAUTH_URL = 'http://localhost:3002';
    });

    it('should have jwt callback defined', () => {
      const options = authOptions;
      expect(options.callbacks.jwt).toBeDefined();
    });

    it('should have session callback defined', () => {
      const options = authOptions;
      expect(options.callbacks.session).toBeDefined();
    });

    it('should have signIn callback defined', () => {
      const options = authOptions;
      expect(options.callbacks.signIn).toBeDefined();
    });

    describe('jwt callback', () => {
      it('should add user info to token on sign in', async () => {
        const options = authOptions;
        const token = {};
        const user = { 
          id: 'user123', 
          email: 'test@example.com',
          role: 'ADMIN' 
        };
        
        const result = await options.callbacks.jwt({ token, user });
        
        expect(result).toEqual(expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          role: 'ADMIN'
        }));
      });

      it('should return existing token when no user provided', async () => {
        const options = authOptions;
        const token = { 
          id: 'user123',
          email: 'test@example.com'
        };
        
        const result = await options.callbacks.jwt({ token });
        
        expect(result).toEqual(token);
      });
    });

    describe('session callback', () => {
      it('should add user info to session', async () => {
        const options = authOptions;
        const session = { user: {} };
        const token = { 
          id: 'user123',
          email: 'test@example.com',
          role: 'ADMIN'
        };
        
        const result = await options.callbacks.session({ session, token });
        
        expect(session.user).toEqual(expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          role: 'ADMIN'
        }));
      });
    });

    describe('signIn callback', () => {
      it('should allow sign in when no error', async () => {
        const options = authOptions;
        const result = await options.callbacks.signIn({ user: { email: 'test@example.com' } });
        
        expect(result).toBe(true);
      });

      it('should redirect to verification on OAuth error', async () => {
        const options = authOptions;
        const result = await options.callbacks.signIn({ 
          error: 'OAuthSignin',
          oauthProvider: { id: 'google' }
        });
        
        expect(result).toBe('/verify-error?error=OAuthSignin');
      });
    });
  });

  describe('Pages configuration', () => {
    beforeEach(() => {
      process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-characters';
      process.env.NEXTAUTH_URL = 'http://localhost:3002';
    });

    it('should have custom signIn page', () => {
      const options = authOptions;
      expect(options.pages.signIn).toBe('/login');
    });

    it('should have custom error page', () => {
      const options = authOptions;
      expect(options.pages.error).toBe('/login');
    });
  });

  describe('Session configuration', () => {
    beforeEach(() => {
      process.env.NEXTAUTH_SECRET = 'test-secret-key-min-32-characters';
      process.env.NEXTAUTH_URL = 'http://localhost:3002';
    });

    it('should use JWT strategy for sessions', () => {
      const options = authOptions;
      expect(options.session.strategy).toBe('jwt');
    });
  });
});
