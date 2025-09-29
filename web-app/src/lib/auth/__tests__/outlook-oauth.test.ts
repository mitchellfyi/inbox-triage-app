/**
 * @jest-environment jsdom
 */

import { 
  storeTokens, 
  getStoredTokens, 
  clearStoredTokens,
  isAuthenticated 
} from '../outlook-oauth';
import type { OutlookTokens } from '../../../types/outlook';

// Mock @azure/msal-browser since it's not available in test environment
jest.mock('@azure/msal-browser', () => ({
  PublicClientApplication: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    handleRedirectPromise: jest.fn().mockResolvedValue(null),
    loginPopup: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      expiresOn: new Date(Date.now() + 3600000),
      tokenType: 'Bearer',
      scopes: ['https://graph.microsoft.com/Mail.Read']
    }),
    getAllAccounts: jest.fn().mockReturnValue([]),
    acquireTokenSilent: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      expiresOn: new Date(Date.now() + 3600000),
      tokenType: 'Bearer',
      scopes: ['https://graph.microsoft.com/Mail.Read']
    }),
    logoutPopup: jest.fn().mockResolvedValue(undefined)
  })),
  InteractionRequiredAuthError: class MockInteractionRequiredAuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'InteractionRequiredAuthError';
    }
  }
}));

describe('Outlook OAuth', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Token Storage', () => {
    it('should store and retrieve tokens', () => {
      const tokens: OutlookTokens = {
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://graph.microsoft.com/Mail.Read',
        expires_at: Date.now() + 3600000
      };

      storeTokens(tokens);
      const retrieved = getStoredTokens();

      expect(retrieved).toEqual(tokens);
    });

    it('should return null when no tokens are stored', () => {
      const retrieved = getStoredTokens();
      expect(retrieved).toBeNull();
    });

    it('should clear stored tokens', () => {
      const tokens: OutlookTokens = {
        access_token: 'test-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://graph.microsoft.com/Mail.Read',
        expires_at: Date.now() + 3600000
      };

      storeTokens(tokens);
      expect(getStoredTokens()).toEqual(tokens);

      clearStoredTokens();
      expect(getStoredTokens()).toBeNull();
    });

    it('should handle expired tokens', () => {
      const expiredTokens: OutlookTokens = {
        access_token: 'expired-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://graph.microsoft.com/Mail.Read',
        expires_at: Date.now() - 1000 // Expired 1 second ago
      };

      storeTokens(expiredTokens);
      const retrieved = getStoredTokens();

      // Should return null for expired tokens
      expect(retrieved).toBeNull();
    });

    it('should handle corrupted token data', () => {
      // Manually set invalid JSON in localStorage
      localStorage.setItem('outlook_oauth_tokens', 'invalid-json');

      const retrieved = getStoredTokens();
      expect(retrieved).toBeNull();

      // Should have cleared the corrupted data
      expect(localStorage.getItem('outlook_oauth_tokens')).toBeNull();
    });
  });

  describe('Authentication State', () => {
    it('should return false when no tokens are stored', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false when tokens are expired', () => {
      const expiredTokens: OutlookTokens = {
        access_token: 'expired-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://graph.microsoft.com/Mail.Read',
        expires_at: Date.now() - 1000
      };

      storeTokens(expiredTokens);
      expect(isAuthenticated()).toBe(false);
    });
  });
});