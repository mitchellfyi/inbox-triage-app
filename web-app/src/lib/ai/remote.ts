/**
 * Remote AI API helpers for user-defined model API keys
 * Supports external providers like Gemini, OpenAI, and Anthropic
 */

import type { ModelProvider, CustomModelKey } from '../../types/preferences';
import type { DraftTone } from './promptDrafts';

export interface RemoteAPIError extends Error {
  code: 'INVALID_KEY' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'UNSUPPORTED_PROVIDER' | 'UNKNOWN';
  userMessage: string;
  provider: ModelProvider;
}

export interface RemoteSummaryResult {
  tldr: string;
  keyPoints: string[];
  usedRemote: true;
  provider: ModelProvider;
}

export interface RemoteDraftResult {
  drafts: Array<{
    subject: string;
    body: string;
  }>;
  usedRemote: true;
  provider: ModelProvider;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface AnthropicResponse {
  content?: Array<{
    text?: string;
  }>;
}

/**
 * Create a user-friendly error for remote API failures
 */
function createRemoteAPIError(
  originalError: unknown, 
  operation: string, 
  provider: ModelProvider
): RemoteAPIError {
  const error = new Error(`Remote ${operation} failed`) as RemoteAPIError;
  error.provider = provider;
  
  if (originalError instanceof Error) {
    const message = originalError.message.toLowerCase();
    
    if (message.includes('401') || message.includes('invalid') || message.includes('unauthorized')) {
      error.code = 'INVALID_KEY';
      error.userMessage = `Invalid API key for ${provider}. Please check your key in settings.`;
    } else if (message.includes('429') || message.includes('rate limit') || message.includes('quota')) {
      error.code = 'RATE_LIMIT';
      error.userMessage = `Rate limit exceeded for ${provider}. Please try again later.`;
    } else if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
      error.code = 'NETWORK_ERROR';
      error.userMessage = `Network error connecting to ${provider}. Please check your connection.`;
    } else {
      error.code = 'UNKNOWN';
      error.userMessage = `${provider} API error. Please try again or check the service status.`;
    }
  } else {
    error.code = 'UNKNOWN';
    error.userMessage = `Unknown error with ${provider} API. Please try again.`;
  }
  
  return error;
}

/**
 * Call Gemini API for text processing
 */
async function callGeminiAPI(
  apiKey: string,
  prompt: string,
  operation: 'summarise' | 'draft'
): Promise<string> {
  const model = operation === 'summarise' ? 'gemini-1.5-flash' : 'gemini-1.5-pro';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: operation === 'draft' ? 0.7 : 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: operation === 'draft' ? 2048 : 1024,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const result: GeminiResponse = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/**
 * Call OpenAI API for text processing
 */
async function callOpenAIAPI(
  apiKey: string,
  prompt: string,
  operation: 'summarise' | 'draft'
): Promise<string> {
  const model = operation === 'summarise' ? 'gpt-4o-mini' : 'gpt-4o';
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: operation === 'draft' ? 0.7 : 0.3,
      max_tokens: operation === 'draft' ? 2048 : 1024,
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const result: OpenAIResponse = await response.json();
  return result.choices?.[0]?.message?.content || '';
}

/**
 * Call Anthropic API for text processing
 */
async function callAnthropicAPI(
  apiKey: string,
  prompt: string,
  operation: 'summarise' | 'draft'
): Promise<string> {
  const model = operation === 'summarise' ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-20241022';
  const url = 'https://api.anthropic.com/v1/messages';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: operation === 'draft' ? 2048 : 1024,
      temperature: operation === 'draft' ? 0.7 : 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Anthropic API error (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const result: AnthropicResponse = await response.json();
  return result.content?.[0]?.text || '';
}

/**
 * Summarise text using a remote API provider
 */
export async function summariseRemote(
  text: string,
  customKey: CustomModelKey
): Promise<RemoteSummaryResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Empty input text for summarisation');
  }

  if (!customKey.apiKey || customKey.apiKey.trim().length === 0) {
    throw createRemoteAPIError(
      new Error('Empty API key'), 
      'summarise', 
      customKey.provider
    );
  }

  const prompt = `Please analyse this email thread and provide:
1. A concise TL;DR summary (1-2 sentences)
2. Key points as a bulleted list (maximum 5 points)

Email thread:
${text}

Respond in JSON format:
{
  "tldr": "Brief summary here",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}`;

  try {
    let responseText: string;
    
    switch (customKey.provider) {
      case 'gemini':
        responseText = await callGeminiAPI(customKey.apiKey, prompt, 'summarise');
        break;
      case 'openai':
        responseText = await callOpenAIAPI(customKey.apiKey, prompt, 'summarise');
        break;
      case 'anthropic':
        responseText = await callAnthropicAPI(customKey.apiKey, prompt, 'summarise');
        break;
      default:
        throw createRemoteAPIError(
          new Error(`Unsupported provider: ${customKey.provider}`),
          'summarise',
          customKey.provider
        );
    }

    if (!responseText) {
      throw new Error('Empty response from API');
    }

    // Parse JSON response
    let parsed: { tldr: string; keyPoints: string[] };
    try {
      // Extract JSON from response if it contains extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!parsed.tldr || !Array.isArray(parsed.keyPoints)) {
      throw new Error('Invalid response structure');
    }

    return {
      tldr: parsed.tldr.trim(),
      keyPoints: parsed.keyPoints.slice(0, 5),
      usedRemote: true,
      provider: customKey.provider
    };
  } catch (error) {
    console.error(`Remote summarisation failed for ${customKey.provider}:`, error);
    throw createRemoteAPIError(error, 'summarise', customKey.provider);
  }
}

/**
 * Generate reply drafts using a remote API provider
 */
export async function draftRemote(
  text: string,
  customKey: CustomModelKey,
  tone: DraftTone = 'neutral',
  guidance: string = ''
): Promise<RemoteDraftResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Empty input text for draft generation');
  }

  if (!customKey.apiKey || customKey.apiKey.trim().length === 0) {
    throw createRemoteAPIError(
      new Error('Empty API key'), 
      'generate drafts', 
      customKey.provider
    );
  }

  const toneInstructions = {
    neutral: 'professional and balanced, avoiding overly formal or casual language',
    friendly: 'warm and approachable while maintaining professionalism',
    assertive: 'confident and direct while remaining respectful',
    formal: 'highly professional and structured with formal language conventions'
  };

  const guidanceText = guidance.trim() ? `\n\nAdditional user guidance: ${guidance.trim()}` : '';

  const prompt = `You are an expert email assistant. Generate exactly 3 reply drafts for the given email thread. Each draft should be ${toneInstructions[tone]}.

The three drafts should vary in length and approach:
1. Short reply (1-2 sentences): Brief acknowledgment or quick response
2. Medium reply (3-5 sentences): Includes clarifications or additional context
3. Comprehensive reply (5-8 sentences): Detailed response with next steps or full explanation

Each reply must include:
- An appropriate subject line (max 120 characters)  
- A complete email body with greeting, main content, and professional closing (max 2000 characters)
- Contextually relevant content based on the email thread${guidanceText}

Email thread to reply to:
${text}

Respond in JSON format only:
{
  "drafts": [
    {"subject": "Re: Subject line", "body": "Dear [Name],\\n\\n[Content]\\n\\nBest regards,\\n[Your name]"},
    {"subject": "Re: Subject line", "body": "Dear [Name],\\n\\n[Content]\\n\\nBest regards,\\n[Your name]"},
    {"subject": "Re: Subject line", "body": "Dear [Name],\\n\\n[Content]\\n\\nBest regards,\\n[Your name]"}
  ]
}`;

  try {
    let responseText: string;
    
    switch (customKey.provider) {
      case 'gemini':
        responseText = await callGeminiAPI(customKey.apiKey, prompt, 'draft');
        break;
      case 'openai':
        responseText = await callOpenAIAPI(customKey.apiKey, prompt, 'draft');
        break;
      case 'anthropic':
        responseText = await callAnthropicAPI(customKey.apiKey, prompt, 'draft');
        break;
      default:
        throw createRemoteAPIError(
          new Error(`Unsupported provider: ${customKey.provider}`),
          'generate drafts',
          customKey.provider
        );
    }

    if (!responseText) {
      throw new Error('Empty response from API');
    }

    // Parse JSON response
    let parsed: { drafts: Array<{ subject: string; body: string }> };
    try {
      // Extract JSON from response if it contains extra text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;
      parsed = JSON.parse(jsonStr);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (!parsed.drafts || !Array.isArray(parsed.drafts) || parsed.drafts.length !== 3) {
      throw new Error('Invalid response structure: expected 3 drafts');
    }

    // Validate each draft
    const drafts = [];
    for (const draft of parsed.drafts) {
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
      usedRemote: true,
      provider: customKey.provider
    };
  } catch (error) {
    console.error(`Remote draft generation failed for ${customKey.provider}:`, error);
    throw createRemoteAPIError(error, 'generate drafts', customKey.provider);
  }
}

/**
 * Test a custom API key to verify it works
 */
export async function testCustomModelKey(customKey: CustomModelKey): Promise<boolean> {
  try {
    const testText = "Test email: Hello, this is a test message to verify the API connection is working properly.";
    await summariseRemote(testText, customKey);
    return true;
  } catch (error) {
    console.error('Custom key test failed:', error);
    return false;
  }
}