/**
 * Chrome LanguageModel (Prompt) API wrapper for reply draft generation
 * Provides structured reply drafts with tone control, user guidance and hybrid fallback
 */

import { makeHybridDecision, callHybridFallback } from './hybrid';
import { draftRemote } from './remote';
import type { ProcessingMode, CustomModelKey } from '../../types/preferences';

// Type definitions for Chrome's built-in LanguageModel API
declare global {
  interface AI {
    languageModel?: {
      capabilities(): Promise<{
        available: 'readily' | 'after-download' | 'no';
      }>;
      create(options?: {
        systemPrompt?: string;
        initialPrompts?: Array<{
          role: 'system' | 'user' | 'assistant';
          content: string;
        }>;
        temperature?: number;
        topK?: number;
      }): Promise<{
        prompt(input: string, options?: {
          responseConstraint?: string;
        }): Promise<string>;
        destroy(): void;
      }>;
    };
  }
}

export enum PromptAvailability {
  READILY_AVAILABLE = 'readily',
  AFTER_DOWNLOAD = 'after-download', 
  UNAVAILABLE = 'no'
}

export interface PromptError extends Error {
  code: 'UNAVAILABLE' | 'TOKEN_LIMIT' | 'NETWORK_ERROR' | 'INVALID_JSON' | 'HYBRID_FALLBACK' | 'UNKNOWN';
  userMessage: string;
}

export interface Draft {
  subject: string;
  body: string;
}

export type DraftTone = 'neutral' | 'friendly' | 'assertive' | 'formal';

export interface DraftResult {
  drafts: Draft[];
  usedHybrid: boolean;
  usedCustomKey?: boolean;
  provider?: string;
  reason?: string;
}

// JSON schema constraint for structured draft generation
const DRAFT_RESPONSE_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    drafts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          subject: {
            type: 'string',
            maxLength: 120
          },
          body: {
            type: 'string',
            maxLength: 2000
          }
        },
        required: ['subject', 'body']
      },
      minItems: 3,
      maxItems: 3
    }
  },
  required: ['drafts']
});

/**
 * Check if Chrome's LanguageModel API is available
 */
export async function checkPromptAvailability(): Promise<PromptAvailability> {
  try {
    if (!window.ai?.languageModel) {
      return PromptAvailability.UNAVAILABLE;
    }

    const capabilities = await window.ai.languageModel.capabilities();
    return capabilities.available as PromptAvailability;
  } catch (error) {
    console.error('Error checking prompt availability:', error);
    return PromptAvailability.UNAVAILABLE;
  }
}

/**
 * Create a user-friendly error with appropriate messaging
 */
function createPromptError(originalError: unknown, operation: string): PromptError {
  const error = new Error(`Failed to ${operation}`) as PromptError;
  
  if (originalError instanceof Error) {
    if (originalError.message.includes('token') || originalError.message.includes('length')) {
      error.code = 'TOKEN_LIMIT';
      error.userMessage = 'The thread is too long for draft generation; please shorten it or enable hybrid mode';
    } else if (originalError.message.includes('network') || originalError.message.includes('connection')) {
      error.code = 'NETWORK_ERROR'; 
      error.userMessage = 'Network error occurred. Please check your connection and try again';
    } else if (originalError.message.includes('JSON') || originalError.message.includes('parse') || 
               originalError.message.includes('Invalid response structure') || 
               originalError.message.includes('Invalid draft structure')) {
      error.code = 'INVALID_JSON';
      error.userMessage = 'Unable to generate structured drafts. Please try again';
    } else if (originalError.message.includes('Unavailable')) {
      error.code = 'UNAVAILABLE';
      error.userMessage = 'Draft generation is currently unavailable on this device';
    } else if (originalError.message.includes('Cloud processing failed') || originalError.message.includes('hybrid')) {
      error.code = 'HYBRID_FALLBACK';
      error.userMessage = 'Cloud processing failed. Please try again or check your connection';
    } else {
      error.code = 'UNKNOWN';
      error.userMessage = `Unable to ${operation}. Please try again or enable hybrid mode`;
    }
  } else {
    error.code = 'UNAVAILABLE';
    error.userMessage = 'Draft generation is currently unavailable on this device';
  }
  
  return error;
}

/**
 * Build the system prompt for draft generation
 */
function buildSystemPrompt(tone: DraftTone, guidance: string): string {
  const toneInstructions = {
    neutral: 'professional and balanced, avoiding overly formal or casual language',
    friendly: 'warm and approachable while maintaining professionalism',
    assertive: 'confident and direct while remaining respectful',
    formal: 'highly professional and structured with formal language conventions'
  };

  let prompt = `You are an expert email assistant. Generate exactly 3 reply drafts for the given email thread. Each draft should be ${toneInstructions[tone]}.

The three drafts should vary in length and approach:
1. Short reply (1-2 sentences): Brief acknowledgment or quick response
2. Medium reply (3-5 sentences): Includes clarifications or additional context  
3. Comprehensive reply (5-8 sentences): Detailed response with next steps or full explanation

Each reply must include:
- An appropriate subject line (max 120 characters)
- A complete email body with greeting, main content, and professional closing (max 2000 characters)
- Contextually relevant content based on the email thread`;

  if (guidance.trim()) {
    prompt += `\n\nAdditional user guidance: ${guidance.trim()}`;
  }

  prompt += `\n\nIMPORTANT: Respond with valid JSON only, using this exact structure:
{
  "drafts": [
    {"subject": "Re: Subject line", "body": "Dear [Name],\\n\\n[Content]\\n\\nBest regards,\\n[Your name]"},
    {"subject": "Re: Subject line", "body": "Dear [Name],\\n\\n[Content]\\n\\nBest regards,\\n[Your name]"},
    {"subject": "Re: Subject line", "body": "Dear [Name],\\n\\n[Content]\\n\\nBest regards,\\n[Your name]"}
  ]
}`;

  return prompt;
}

/**
 * Generate reply drafts with tone and guidance with hybrid fallback support
 * @param text The email thread content to generate replies for
 * @param tone The tone style for the replies
 * @param guidance Additional user instructions
 * @param processingMode User's processing mode preference
 * @param customKey Optional custom model key for external providers
 * @returns Promise resolving to a DraftResult with 3 reply drafts
 */
export async function generateDrafts(
  text: string, 
  tone: DraftTone = 'neutral', 
  guidance: string = '',
  processingMode: ProcessingMode = 'on-device',
  customKey?: CustomModelKey
): Promise<DraftResult> {
  // Input validation
  if (!text || text.trim().length === 0) {
    throw createPromptError(new Error('Empty input'), 'generate drafts');
  }

  // Check if we should use custom key
  if (customKey && customKey.enabled) {
    try {
      const result = await draftRemote(text, customKey, tone, guidance);
      return {
        drafts: result.drafts,
        usedHybrid: false,
        usedCustomKey: true,
        provider: customKey.provider,
        reason: `Used custom ${customKey.provider} key: ${customKey.name}`
      };
    } catch (error) {
      console.error('Custom key draft generation failed:', error);
      // Fall through to regular processing
    }
  }

  // Make hybrid decision
  const decision = await makeHybridDecision({
    processingMode,
    contentText: text,
    operationType: 'draft'
  });

  if (!decision.useLocal && !decision.canFallback) {
    throw createPromptError(new Error(decision.reason), 'generate drafts');
  }

  if (!decision.useLocal && decision.canFallback) {
    // Use hybrid fallback
    try {
      const result = await callHybridFallback('draft', text, { tone, guidance });
      if (result && typeof result === 'object' && 'drafts' in result) {
        const drafts = (result as { drafts: Draft[] }).drafts || [];
        return {
          drafts,
          usedHybrid: true,
          reason: decision.reason
        };
      }
      throw new Error('Invalid response from hybrid service');
    } catch (error) {
      console.error('Hybrid draft generation failed:', error);
      const hybridError = createPromptError(error, 'generate drafts using cloud processing');
      hybridError.code = 'HYBRID_FALLBACK';
      throw hybridError;
    }
  }

  // Use local processing
  try {
    if (!window.ai?.languageModel) {
      throw new Error('LanguageModel API not available');
    }

    const systemPrompt = buildSystemPrompt(tone, guidance);
    
    const session = await window.ai.languageModel.create({
      systemPrompt,
      temperature: 0.7
    });

    try {
      const response = await session.prompt(
        `Email thread to reply to:\n\n${text}`,
        {
          responseConstraint: DRAFT_RESPONSE_SCHEMA
        }
      );

      // Parse JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response);
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError, 'Response:', response);
        throw new Error('Invalid JSON response from model');
      }

      // Validate response structure
      if (!parsedResponse.drafts || !Array.isArray(parsedResponse.drafts) || parsedResponse.drafts.length !== 3) {
        throw new Error('Invalid response structure: expected 3 drafts');
      }

      // Validate each draft
      const drafts: Draft[] = [];
      for (const draft of parsedResponse.drafts) {
        if (!draft.subject || !draft.body || typeof draft.subject !== 'string' || typeof draft.body !== 'string') {
          throw new Error('Invalid draft structure: missing subject or body');
        }

        drafts.push({
          subject: draft.subject.trim(),
          body: draft.body.trim()
        });
      }

      return {
        drafts,
        usedHybrid: false,
        usedCustomKey: false,
        reason: decision.reason
      };
    } finally {
      session.destroy();
    }
  } catch (error) {
    console.error('Draft generation failed:', error);
    throw createPromptError(error, 'generate reply drafts');
  }
}