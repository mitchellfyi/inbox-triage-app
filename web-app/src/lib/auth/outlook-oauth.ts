/**
 * Outlook OAuth 2.0 PKCE implementation using Microsoft Authentication Library (MSAL)
 */

import { 
  PublicClientApplication, 
  type Configuration,
  type AuthenticationResult,
  type SilentRequest,
  type RedirectRequest,
  type PopupRequest,
  InteractionRequiredAuthError
} from '@azure/msal-browser';
import type { 
  OutlookOAuthConfig, 
  OutlookTokens
} from '../../types/outlook';

const OUTLOOK_OAUTH_CONFIG: OutlookOAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID || '',
  authority: 'https://login.microsoftonline.com/common',
  redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/import`,
  scopes: ['https://graph.microsoft.com/Mail.Read']
};

const STORAGE_KEY = 'outlook_oauth_tokens';

// MSAL configuration
const msalConfig: Configuration = {
  auth: {
    clientId: OUTLOOK_OAUTH_CONFIG.clientId,
    authority: OUTLOOK_OAUTH_CONFIG.authority,
    redirectUri: OUTLOOK_OAUTH_CONFIG.redirectUri,
    postLogoutRedirectUri: OUTLOOK_OAUTH_CONFIG.redirectUri
  },
  cache: {
    cacheLocation: 'localStorage', // Store tokens in localStorage
    storeAuthStateInCookie: false // Set to true if you have issues on IE11 or Edge
  }
};

let msalInstance: PublicClientApplication | null = null;

/**
 * Get or create MSAL instance
 */
function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
  }
  return msalInstance;
}

/**
 * Initialize MSAL instance
 */
export async function initializeMsal(): Promise<void> {
  const msal = getMsalInstance();
  await msal.initialize();
  
  // Handle redirect promise
  try {
    const response = await msal.handleRedirectPromise();
    if (response) {
      // Store the tokens after successful redirect
      storeTokensFromMsal(response);
    }
  } catch (error) {
    console.error('Error handling redirect promise:', error);
  }
}

/**
 * Convert MSAL AuthenticationResult to our token format
 */
function convertMsalTokens(result: AuthenticationResult): OutlookTokens {
  return {
    access_token: result.accessToken,
    expires_in: result.expiresOn ? Math.floor((result.expiresOn.getTime() - Date.now()) / 1000) : 3600,
    token_type: result.tokenType || 'Bearer',
    scope: result.scopes?.join(' ') || OUTLOOK_OAUTH_CONFIG.scopes.join(' '),
    expires_at: result.expiresOn?.getTime() || Date.now() + (3600 * 1000)
  };
}

/**
 * Store tokens from MSAL authentication result
 */
function storeTokensFromMsal(result: AuthenticationResult): void {
  const tokens = convertMsalTokens(result);
  storeTokens(tokens);
}

/**
 * Sign in using popup flow
 */
export async function signInWithPopup(): Promise<OutlookTokens> {
  const msal = getMsalInstance();
  
  const popupRequest: PopupRequest = {
    scopes: OUTLOOK_OAUTH_CONFIG.scopes,
    prompt: 'select_account'
  };

  try {
    const response = await msal.loginPopup(popupRequest);
    const tokens = convertMsalTokens(response);
    storeTokens(tokens);
    return tokens;
  } catch (error) {
    console.error('Popup sign-in failed:', error);
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Sign in using redirect flow
 */
export async function signInWithRedirect(): Promise<void> {
  const msal = getMsalInstance();
  
  const redirectRequest: RedirectRequest = {
    scopes: OUTLOOK_OAUTH_CONFIG.scopes,
    prompt: 'select_account'
  };

  try {
    await msal.loginRedirect(redirectRequest);
    // The actual token handling will occur in handleRedirectPromise after redirect
  } catch (error) {
    console.error('Redirect sign-in failed:', error);
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get access token silently (refresh if needed)
 */
export async function getValidAccessToken(): Promise<string | null> {
  const msal = getMsalInstance();
  
  try {
    const accounts = msal.getAllAccounts();
    
    if (accounts.length === 0) {
      return null;
    }

    const silentRequest: SilentRequest = {
      scopes: OUTLOOK_OAUTH_CONFIG.scopes,
      account: accounts[0] // Use the first account
    };

    const response = await msal.acquireTokenSilent(silentRequest);
    const tokens = convertMsalTokens(response);
    storeTokens(tokens);
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      // Token refresh failed, user needs to re-authenticate
      console.warn('Silent token acquisition failed, interaction required:', error);
      return null;
    }
    
    console.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  const msal = getMsalInstance();
  const accounts = msal.getAllAccounts();
  return accounts.length > 0;
}

/**
 * Get current user account information
 */
export function getCurrentAccount() {
  const msal = getMsalInstance();
  const accounts = msal.getAllAccounts();
  return accounts.length > 0 ? accounts[0] : null;
}

/**
 * Sign out and clear all tokens
 */
export async function signOut(): Promise<void> {
  const msal = getMsalInstance();
  
  try {
    const accounts = msal.getAllAccounts();
    
    if (accounts.length > 0) {
      await msal.logoutPopup({
        account: accounts[0]
      });
    }
  } catch (error) {
    console.warn('Error during sign out:', error);
    // Continue with local cleanup even if logout fails
  }
  
  // Clear stored tokens
  clearStoredTokens();
}

/**
 * Store OAuth tokens in localStorage
 */
export function storeTokens(tokens: OutlookTokens): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

/**
 * Retrieve stored OAuth tokens
 */
export function getStoredTokens(): OutlookTokens | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const tokens: OutlookTokens = JSON.parse(stored);
    
    // Check if tokens are expired
    if (Date.now() >= tokens.expires_at) {
      clearStoredTokens();
      return null;
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
 * Generate authentication URL (for redirect flow)
 */
export async function generateAuthUrl(): Promise<string> {
  // With MSAL, we don't generate URLs manually, instead we use the redirect flow
  // This function is provided for compatibility with the Gmail OAuth pattern
  await signInWithRedirect();
  return ''; // URL generation happens internally in MSAL
}