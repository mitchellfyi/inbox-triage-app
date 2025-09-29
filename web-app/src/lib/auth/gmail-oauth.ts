/**
 * Gmail OAuth 2.0 PKCE implementation for secure authentication
 */

import type { 
  GmailOAuthConfig, 
  OAuthTokens, 
  PKCEChallenge 
} from '../../types/gmail';

const GMAIL_OAUTH_CONFIG: GmailOAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '',
  redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/import`,
  scope: 'https://www.googleapis.com/auth/gmail.readonly'
};

const STORAGE_KEY = 'gmail_oauth_tokens';
const PKCE_STORAGE_KEY = 'gmail_pkce_challenge';

/**
 * Generate a cryptographically secure random string for PKCE
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

/**
 * Generate SHA256 hash and encode as base64url
 */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  
  // Convert to base64url (RFC 4648 section 5)
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate PKCE challenge pair
 */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await sha256(codeVerifier);
  const state = generateRandomString(32);
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
    state
  };
}

/**
 * Store PKCE challenge for later verification
 */
export function storePKCEChallenge(challenge: PKCEChallenge): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify({
    codeVerifier: challenge.codeVerifier,
    state: challenge.state,
    timestamp: Date.now()
  }));
}

/**
 * Retrieve and validate stored PKCE challenge
 */
export function retrievePKCEChallenge(): { codeVerifier: string; state: string } | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(PKCE_STORAGE_KEY);
    if (!stored) return null;
    
    const { codeVerifier, state, timestamp } = JSON.parse(stored);
    
    // PKCE challenges should expire after 10 minutes for security
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      localStorage.removeItem(PKCE_STORAGE_KEY);
      return null;
    }
    
    return { codeVerifier, state };
  } catch (error) {
    console.error('Error retrieving PKCE challenge:', error);
    localStorage.removeItem(PKCE_STORAGE_KEY);
    return null;
  }
}

/**
 * Clear stored PKCE challenge
 */
export function clearPKCEChallenge(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PKCE_STORAGE_KEY);
}

/**
 * Generate OAuth authorization URL with PKCE
 */
export async function generateAuthUrl(): Promise<string> {
  const challenge = await generatePKCEChallenge();
  storePKCEChallenge(challenge);
  
  const params = new URLSearchParams({
    client_id: GMAIL_OAUTH_CONFIG.clientId,
    redirect_uri: GMAIL_OAUTH_CONFIG.redirectUri,
    scope: GMAIL_OAUTH_CONFIG.scope,
    response_type: 'code',
    code_challenge: challenge.codeChallenge,
    code_challenge_method: challenge.codeChallengeMethod,
    state: challenge.state,
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string, 
  state: string
): Promise<OAuthTokens> {
  const storedChallenge = retrievePKCEChallenge();
  
  if (!storedChallenge) {
    throw new Error('PKCE challenge not found or expired');
  }
  
  if (storedChallenge.state !== state) {
    throw new Error('State parameter mismatch - possible CSRF attack');
  }
  
  const tokenParams = new URLSearchParams({
    client_id: GMAIL_OAUTH_CONFIG.clientId,
    code,
    code_verifier: storedChallenge.codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: GMAIL_OAUTH_CONFIG.redirectUri
  });
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
    }
    
    const tokenData = await response.json();
    const tokens: OAuthTokens = {
      ...tokenData,
      expires_at: Date.now() + (tokenData.expires_in * 1000)
    };
    
    // Store tokens securely
    storeTokens(tokens);
    clearPKCEChallenge();
    
    return tokens;
  } catch (error) {
    clearPKCEChallenge();
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
  const refreshParams = new URLSearchParams({
    client_id: GMAIL_OAUTH_CONFIG.clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: refreshParams.toString()
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${errorData.error_description || response.statusText}`);
  }
  
  const tokenData = await response.json();
  const tokens: OAuthTokens = {
    ...tokenData,
    refresh_token: refreshToken, // Preserve refresh token if not provided
    expires_at: Date.now() + (tokenData.expires_in * 1000)
  };
  
  storeTokens(tokens);
  return tokens;
}

/**
 * Store OAuth tokens securely in localStorage
 */
export function storeTokens(tokens: OAuthTokens): void {
  if (typeof window === 'undefined') return;
  
  // Only store in localStorage for now - in production, consider IndexedDB with encryption
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

/**
 * Retrieve stored OAuth tokens
 */
export function getStoredTokens(): OAuthTokens | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const tokens: OAuthTokens = JSON.parse(stored);
    
    // Check if tokens are expired
    if (Date.now() >= tokens.expires_at) {
      // Token is expired, try to refresh if we have a refresh token
      if (tokens.refresh_token) {
        // Don't automatically refresh here, let the caller handle it
        return tokens;
      } else {
        // No refresh token, clear expired tokens
        clearStoredTokens();
        return null;
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('Error retrieving stored tokens:', error);
    clearStoredTokens();
    return null;
  }
}

/**
 * Clear stored OAuth tokens
 */
export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  const tokens = getStoredTokens();
  return tokens !== null && Date.now() < tokens.expires_at;
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens) return null;
  
  // If token is still valid, return it
  if (Date.now() < tokens.expires_at) {
    return tokens.access_token;
  }
  
  // Token is expired, try to refresh
  if (tokens.refresh_token) {
    try {
      const newTokens = await refreshAccessToken(tokens.refresh_token);
      return newTokens.access_token;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      clearStoredTokens();
      return null;
    }
  }
  
  // No refresh token available
  clearStoredTokens();
  return null;
}

/**
 * Revoke OAuth tokens and sign out
 */
export async function signOut(): Promise<void> {
  const tokens = getStoredTokens();
  
  if (tokens?.access_token) {
    try {
      // Revoke the token with Google
      await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });
    } catch (error) {
      console.warn('Failed to revoke token with Google:', error);
      // Continue with local cleanup even if revocation fails
    }
  }
  
  // Clear all stored data
  clearStoredTokens();
  clearPKCEChallenge();
}