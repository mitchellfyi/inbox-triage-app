# Copilot Instructions for Inbox Triage App

## Project Overview

The **Inbox Triage App** is a privacy-first web application that helps users summarise email threads, understand attachments, and generate reply drafts using Chrome's built-in AI APIs. It operates primarily on-device with optional hybrid fallback mode.

## Key Documentation

Before making any changes, **read these documents in order**:

1. **[SPEC.md](../SPEC.md)** – Complete functional and technical requirements, constraints, and acceptance criteria
2. **[README.md](../README.md)** – Project overview, architecture, quickstart, and contributing flow  
3. **[AGENTS.md](../AGENTS.md)** – Development guide with coding rules, workflow, and common gotchas
4. **[TODO.md](../TODO.md)** – Current tasks, status tracking, and available work items

## Development Principles

### Privacy-First Architecture
- **On-device default**: All AI processing uses Chrome's built-in Task APIs (Summarizer, Prompt, Multimodal)
- **Explicit consent**: Server-side hybrid processing requires clear user opt-in
- **Data minimisation**: Only derived text (never raw attachments/emails) sent to servers
- **User control**: Complete preference management with data deletion capabilities

### Technical Stack
- **Frontend**: Next.js 15+ with React 19+ and TypeScript
- **AI Processing**: Chrome AI Task APIs with availability checks
- **File Parsing**: Client-side libraries (PDF.js, mammoth.js, SheetJS)
- **Styling**: Tailwind CSS with accessibility focus
- **Testing**: Jest and React Testing Library

### Code Quality Standards
- **British English**: All user-facing text
- **Type safety**: Comprehensive TypeScript usage
- **Accessibility**: WCAG 2.1 AA compliance
- **Error handling**: Graceful fallbacks with user-friendly messages
- **Performance**: Async processing, loading states, no blocking

## When Contributing

### Before Starting
- Choose a task from [TODO.md](../TODO.md) or create a GitHub issue
- Understand the acceptance criteria and privacy constraints
- Ensure you can run the development environment (`cd web-app && npm run dev`)

### Development Workflow
1. **Read the specs**: Understand requirements and constraints fully
2. **Small changes**: Make minimal, surgical modifications
3. **Commit frequently**: Make small, focused commits with clear messages following the pattern `type(scope): summary`
4. **Test comprehensively**: Write unit tests for new features, ensure all tests pass cleanly without workarounds
5. **Test early**: Run `npm run lint`, `npm run test:run` frequently and before each commit
6. **Follow patterns**: Match existing code style and structure
7. **British spelling**: Use "summarise", "colour", "behaviour", etc.
8. **Update docs**: After completing features, update README.md, AGENTS.md, and TODO.md to reflect current state

### Directory Structure
- **Components**: `src/components/` with PascalCase naming
- **Business logic**: `src/lib/` modules (e.g., `src/lib/ai/summarizer.ts`)
- **API routes**: `src/app/api/` with kebab-case
- **Types**: `src/types/` or co-located with components

### Error Handling
- Always check AI model availability before use
- Wrap AI calls in try/catch blocks
- Show helpful error messages to users
- Log detailed errors only in development

### Security & Privacy
- Never store email content beyond functional requirements
- Implement proper OAuth flows with minimal scopes
- Validate webhook signatures
- Clear consent flows for hybrid mode

## Common Patterns

### AI Integration
```typescript
// Check availability first
const available = await ai.summarizer.capabilities();
if (available.available === 'no') {
  // Show user-friendly message
  return;
}

// Use with error handling
try {
  const summary = await ai.summarizer.summarise(text);
  return summary;
} catch (error) {
  console.error('Summarisation failed:', error);
  // Provide fallback or user message
}
```

### File Parsing
```typescript
// Client-side parsing only
import { pdfjs } from 'pdf-js'; // Example
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Parse locally, never send raw files to server
```

### British English Examples
- "Summarise" not "Summarize"
- "Colour" not "Color"  
- "Behaviour" not "Behavior"
- "Optimisation" not "Optimization"

## Don't Do These Things

- ❌ Add server dependencies for file parsing
- ❌ Send raw email content or attachments to external servers
- ❌ Skip AI model availability checks
- ❌ Use American spelling in user-facing text
- ❌ Add unnecessary external dependencies
- ❌ Block the main thread with heavy processing
- ❌ Store user data without explicit consent
- ❌ Implement features without reading SPEC.md acceptance criteria

## Testing & Quality

- Run `npm run lint` and `npm run test:run` before submitting
- Add unit tests for critical functionality
- Test error conditions and edge cases
- Verify accessibility with keyboard navigation
- Test with Chrome AI models available and unavailable

## Development Best Practices

### Commit Frequency and Quality
- **Commit early and often**: Make small, focused commits that represent logical units of work
- **Clear commit messages**: Use the conventional commit format: `type(scope): summary`
- **Working increments**: Each commit should leave the codebase in a functional state
- **Before major changes**: Always commit current progress before attempting large refactors

### Testing Standards
- **Write tests first**: Follow test-driven development where possible
- **Comprehensive coverage**: Ensure unit tests cover critical business logic and edge cases
- **Clean test passes**: Tests must pass without workarounds like arbitrary timeouts or overly broad mocks
- **Integration testing**: Test component interactions and API flows
- **Accessibility testing**: Verify keyboard navigation and screen reader compatibility

### Documentation Maintenance
- **Update after completion**: Once a feature is complete, update README.md, AGENTS.md, and TODO.md
- **Reflect current state**: Documentation should accurately represent the current functionality
- **Task management**: Mark completed TODO.md items as `[x]` and add new tasks discovered during development
- **API documentation**: Add JSDoc comments for public interfaces and complex functions

Remember: This project demonstrates privacy-preserving AI workflows. Every decision should prioritise user privacy and on-device processing while maintaining excellent user experience.
