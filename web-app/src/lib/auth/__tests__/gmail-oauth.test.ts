/**
 * @jest-environment jsdom
 */

import {
  generatePKCEChallenge,
  storePKCEChallenge,
  retrievePKCEChallenge,
  clearPKCEChallenge,
  generateAuthUrl,
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  isAuthenticated
} from '../gmail-oauth';
import type { OAuthTokens } from '../../../types/gmail';

// Mock crypto and TextEncoder for Node.js environment
const mockArrayBuffer = new ArrayBuffer(32);
const mockCrypto = {
  getRandomValues: jest.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }),
  subtle: {
    digest: jest.fn(() => Promise.resolve(mockArrayBuffer))
  }
};

const mockTextEncoder = jest.fn().mockImplementation(() => ({
  encode: jest.fn((str: string) => new Uint8Array([...str].map(c => c.charCodeAt(0))))
}));

const mockBtoa = jest.fn((str: string) => Buffer.from(str, 'binary').toString('base64'));

// Setup global mocks
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

Object.defineProperty(global, 'TextEncoder', {
  value: mockTextEncoder,
  writable: true
});

Object.defineProperty(global, 'btoa', {
  value: mockBtoa,
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const mockTokens: OAuthTokens = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'Bearer',
  scope: 'https://www.googleapis.com/auth/gmail.readonly',
  expires_at: Date.now() + 3600 * 1000
};

describe('Gmail OAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('PKCE Challenge Generation', () => {
    it('should generate a PKCE challenge with all required fields', async () => {
      const challenge = await generatePKCEChallenge();
      
      expect(challenge).toHaveProperty('codeVerifier');
      expect(challenge).toHaveProperty('codeChallenge');
      expect(challenge).toHaveProperty('codeChallengeMethod', 'S256');
      expect(challenge).toHaveProperty('state');
      
      expect(typeof challenge.codeVerifier).toBe('string');
      expect(typeof challenge.codeChallenge).toBe('string');
      expect(typeof challenge.state).toBe('string');
      
      expect(challenge.codeVerifier.length).toBeGreaterThan(0);
      expect(challenge.codeChallenge.length).toBeGreaterThan(0);
      expect(challenge.state.length).toBeGreaterThan(0);
    });

    it('should generate different challenges on subsequent calls', async () => {
      const challenge1 = await generatePKCEChallenge();
      const challenge2 = await generatePKCEChallenge();
      
      expect(challenge1.codeVerifier).not.toBe(challenge2.codeVerifier);
      expect(challenge1.state).not.toBe(challenge2.state);
      // Note: codeChallenge might be same if mocked crypto returns same values
    });
  });

  describe('PKCE Challenge Storage', () => {
    it('should store and retrieve PKCE challenge', async () => {
      const challenge = await generatePKCEChallenge();
      
      storePKCEChallenge(challenge);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gmail_pkce_challenge',
        expect.stringContaining(challenge.codeVerifier)
      );
    });

    it('should retrieve stored PKCE challenge', () => {
      const mockStoredData = JSON.stringify({
        codeVerifier: 'test-verifier',
        state: 'test-state',
        timestamp: Date.now()
      });
      
      localStorageMock.getItem.mockReturnValue(mockStoredData);
      
      const retrieved = retrievePKCEChallenge();
      
      expect(retrieved).toEqual({
        codeVerifier: 'test-verifier',
        state: 'test-state'
      });
    });

    it('should return null for expired PKCE challenge', () => {
      const mockStoredData = JSON.stringify({
        codeVerifier: 'test-verifier',
        state: 'test-state',
        timestamp: Date.now() - 11 * 60 * 1000 // 11 minutes ago (expired)
      });
      
      localStorageMock.getItem.mockReturnValue(mockStoredData);
      
      const retrieved = retrievePKCEChallenge();
      
      expect(retrieved).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gmail_pkce_challenge');
    });

    it('should clear PKCE challenge', () => {
      clearPKCEChallenge();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gmail_pkce_challenge');
    });
  });

  describe('Auth URL Generation', () => {
    it('should generate valid authorization URL', async () => {
      const authUrl = await generateAuthUrl();
      
      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id='); // Client ID is present (even if empty in test)
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('code_challenge_method=S256');
      expect(authUrl).toContain('scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly');
      expect(authUrl).toContain('code_challenge=');
      expect(authUrl).toContain('state=');
    });
  });

  describe('Token Storage', () => {
    it('should store OAuth tokens', () => {
      storeTokens(mockTokens);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'gmail_oauth_tokens',
        JSON.stringify(mockTokens)
      );
    });

    it('should retrieve stored tokens', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockTokens));
      
      const retrieved = getStoredTokens();
      
      expect(retrieved).toEqual(mockTokens);
    });

    it('should return null for non-existent tokens', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const retrieved = getStoredTokens();
      
      expect(retrieved).toBeNull();
    });

    it('should clear expired tokens without refresh token', () => {
      const expiredTokens = {
        ...mockTokens,
        refresh_token: undefined,
        expires_at: Date.now() - 1000 // Expired
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredTokens));
      
      const retrieved = getStoredTokens();
      
      expect(retrieved).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gmail_oauth_tokens');
    });

    it('should return expired tokens with refresh token for manual refresh', () => {
      const expiredTokens = {
        ...mockTokens,
        expires_at: Date.now() - 1000 // Expired
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredTokens));
      
      const retrieved = getStoredTokens();
      
      expect(retrieved).toEqual(expiredTokens);
    });

    it('should clear stored tokens', () => {
      clearStoredTokens();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('gmail_oauth_tokens');
    });
  });

  describe('Authentication Status', () => {
    it('should return true for valid authenticated state', () => {
      const validTokens = {
        ...mockTokens,
        expires_at: Date.now() + 1000 // Not expired
      } as OAuthTokens;
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(validTokens));
      
      expect(isAuthenticated()).toBe(true);
    });

    it('should return false for expired tokens', () => {
      const expiredTokens = {
        ...mockTokens,
        expires_at: Date.now() - 1000 // Expired
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredTokens));
      
      expect(isAuthenticated()).toBe(false);
    });

    it('should return false for no tokens', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      expect(isAuthenticated()).toBe(false);
    });
  });
});