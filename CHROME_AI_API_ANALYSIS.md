# Chrome AI API Usage Analysis and Required Changes

## Problem Statement

The current implementation of Chrome's built-in AI APIs in the Inbox Triage App contains several critical issues that prevent proper functionality. After researching the official Chrome AI API documentation, the following problems have been identified:

1. **Incorrect API namespaces and method signatures**
2. **Missing proper availability checks**
3. **Inconsistent error handling patterns**
4. **Type definitions don't match actual Chrome APIs**

## Chrome AI API Documentation Summary

Based on the official Chrome AI API documentation, Chrome provides three distinct AI APIs:

### 1. Summarizer API
- **Namespace**: `window.ai.summarizer`
- **Purpose**: Text summarisation with different types (tl;dr, key-points, teaser, headline)
- **Availability check**: `await ai.summarizer.capabilities()`
- **Session creation**: `await ai.summarizer.create(options)`
- **Method**: `session.summarize(text, options)`

### 2. Language Model API (Prompt API)
- **Namespace**: `window.ai.languageModel` 
- **Purpose**: General text generation and conversation
- **Availability check**: `await ai.languageModel.capabilities()`
- **Session creation**: `await ai.languageModel.create(options)`
- **Method**: `session.prompt(text)`

### 3. Translation API
- **Namespace**: `window.ai.translator`
- **Purpose**: Text translation between languages
- **Not currently used in this project**

## Current Implementation Issues

### Issue 1: Incorrect Multimodal API Usage

**Current Code (multimodal.ts)**:
```typescript
// INCORRECT - No separate multimodal API exists
interface AI {
  prompt?: {
    capabilities(): Promise<{ available: string }>;
    create(): Promise<{
      prompt(input: string, options?: { images?: Blob[] }): Promise<string>;
    }>;
  };
}
```

**Problem**: The current implementation assumes a separate `window.ai.prompt` API that supports multimodal input with images. According to Chrome's documentation, multimodal capabilities are currently experimental and not part of the stable API.

**Required Fix**: 
- Remove or comment out multimodal functionality until Chrome provides stable multimodal support
- Use Language Model API for text-only processing
- Update availability checks accordingly

### Issue 2: Language Model API Naming

**Current Code (promptDrafts.ts)**:
```typescript
// CORRECT namespace but needs verification of method signatures
interface AI {
  languageModel?: {
    capabilities(): Promise<{ available: string }>;
    create(options?: {...}): Promise<{
      prompt(input: string, options?: {...}): Promise<string>;
    }>;
  };
}
```

**Status**: This implementation appears to be mostly correct but needs verification of method signatures and options.

### Issue 3: Summarizer API Implementation

**Current Code (summarizer.ts)**:
```typescript
// CORRECT - This implementation appears to follow the documentation
interface AI {
  summarizer?: {
    capabilities(): Promise<{ available: string }>;
    create(options?: {...}): Promise<{
      summarize(input: string, options?: {...}): Promise<string>;
    }>;
  };
}
```

**Status**: This implementation appears to be correct and follows the documented API.

## Required Changes

### 1. Fix Multimodal Implementation

**File**: `src/lib/ai/multimodal.ts`

**Changes needed**:
- Remove `window.ai.prompt` API usage
- Replace with `window.ai.languageModel` for text-only processing
- Update all method calls to use correct API
- Remove image input support until Chrome provides stable multimodal API
- Update availability checks
- Update error handling to match Language Model API patterns

### 2. Verify Language Model API Usage

**File**: `src/lib/ai/promptDrafts.ts`

**Changes needed**:
- Verify that method signatures match Chrome's documentation
- Ensure options objects use correct property names
- Update error handling if needed

### 3. Verify Summarizer API Usage

**File**: `src/lib/ai/summarizer.ts`

**Status**: Implementation appears correct, minimal changes needed

### 4. Update Image Parsing

**File**: `src/lib/parse/image.ts`

**Changes needed**:
- Remove multimodal AI functionality
- Implement fallback mechanism for image descriptions
- Update availability checks

### 5. Update Tests

**Files**: `src/lib/ai/__tests__/*.test.ts`

**Changes needed**:
- Update mocks to match correct API namespaces
- Fix failing tests related to incorrect API usage
- Update test expectations to match corrected API behaviour

## Specific API Corrections

### Language Model API (Correct Usage)

```typescript
// Check availability
const capabilities = await window.ai.languageModel.capabilities();
if (capabilities.available === 'no') {
  throw new Error('Language model not available');
}

// Create session
const session = await window.ai.languageModel.create({
  systemPrompt: 'You are a helpful assistant...',
  temperature: 0.7,
  topK: 40
});

// Generate text
const response = await session.prompt('Generate a reply to this email...');

// Clean up
session.destroy();
```

### Summarizer API (Correct Usage)

```typescript
// Check availability
const capabilities = await window.ai.summarizer.capabilities();
if (capabilities.available === 'no') {
  throw new Error('Summarizer not available');
}

// Create session
const session = await window.ai.summarizer.create({
  type: 'tl;dr', // or 'key-points', 'teaser', 'headline'
  format: 'plain-text', // or 'markdown'
  length: 'short' // or 'medium', 'long'
});

// Summarize text
const summary = await session.summarize(text, {
  context: 'Email thread'
});

// Clean up
session.destroy();
```

## Migration Strategy

1. **Phase 1**: Fix multimodal API usage by removing image support temporarily
2. **Phase 2**: Verify and correct Language Model API usage
3. **Phase 3**: Update all tests to reflect correct API usage
4. **Phase 4**: Add proper error handling and fallbacks
5. **Phase 5**: Update documentation and user messaging

## Impact Assessment

### Breaking Changes
- Multimodal image Q&A functionality will be temporarily disabled
- Error messages may change slightly
- API availability detection may be more accurate

### Benefits
- Correct API usage will ensure compatibility with Chrome updates
- More reliable error handling and availability detection
- Better performance due to correct API usage patterns
- Cleaner, more maintainable code

## Testing Requirements

1. Test with Chrome Canary/Dev builds that have AI features enabled
2. Test availability detection with AI features disabled
3. Test error handling for various failure scenarios
4. Verify fallback mechanisms work correctly
5. Test performance with correct API usage

## Next Steps

1. Create detailed implementation plan for each file
2. Fix multimodal API usage first (highest priority)
3. Verify and test Language Model API usage
4. Update tests incrementally
5. Document any remaining limitations or workarounds needed