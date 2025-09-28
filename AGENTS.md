# Agents Development Guide for Inbox Triage App

This guide is for AI coding agents and human contributors working on the **Inbox Triage App**, a web‑based companion to the Inbox Triage Chrome extension. It explains where to find the project docs, how to approach development, and best practices to ensure consistency, quality and privacy.

## Where to start

**Essential reading order:**
1. **[SPEC.md](SPEC.md)** – Understand the high-level goals, functional and technical requirements, constraints, and acceptance criteria
2. **[README.md](README.md)** – Get the project overview, architecture, and quickstart instructions  
3. **[TODO.md](TODO.md)** – Review current tasks, their status, and find an item to work on
4. **GitHub issues** – Check for detailed problem statements and solution outlines

**Before writing any code:**
- Ensure you understand the privacy-first, on-device constraints
- Confirm you can run the development environment (`npm run dev`, tests, linting)
- Choose a specific task from TODO.md or create a GitHub issue
- Read the acceptance criteria for your chosen feature

## Agent loop: read → plan → small PRs → tests → docs update

**1. Read and understand**
- Study SPEC.md for requirements and constraints
- Review existing code architecture and patterns  
- Understand the specific task acceptance criteria

**2. Plan the solution**  
- Break down the task into minimal, testable changes
- Consider edge cases and error handling
- Ensure alignment with on-device AI principles
- Plan for accessibility and performance

**3. Implement in small increments**
- Create a focused feature branch
- Make the smallest possible changes to achieve the goal
- Follow existing code patterns and naming conventions
- Test each change immediately

**4. Tests and quality**
- Add or update unit tests for new functionality
- Run `npm run test`, `npm run lint` before committing
- Verify accessibility with keyboard navigation
- Check responsiveness across screen sizes

**5. Documentation updates**
- Update relevant sections in README.md, SPEC.md, or this guide
- Mark completed tasks in TODO.md
- Add new tasks if your work creates them

## Best practices for quality contributions

### Commit early and often
- **Small, focused commits**: Make frequent commits with single, clear purposes
- **Descriptive messages**: Follow the [commit message pattern](#commit-message-pattern) consistently
- **Logical progression**: Each commit should represent a complete, working increment
- **Before major changes**: Commit your current working state before attempting large refactors

### Write comprehensive tests
- **Test-driven approach**: Write tests for new functionality before or alongside implementation
- **Unit test coverage**: Ensure critical business logic has unit tests with meaningful assertions
- **Integration tests**: Test component interactions and API integrations where applicable  
- **No workarounds**: Tests must pass cleanly without setTimeout hacks, mocks that don't reflect reality, or skipped test cases
- **Run tests frequently**: Execute `npm run test:run` and `npm run lint` before each commit
- **Edge case coverage**: Test error conditions, boundary values, and unexpected inputs

### Follow best practices for maintainability
- **Code readability**: Write self-documenting code with clear variable and function names
- **TypeScript usage**: Leverage type safety comprehensively, avoid `any` types
- **Accessibility compliance**: Ensure WCAG 2.1 AA standards in all UI components
- **Performance considerations**: Avoid blocking the main thread, use async patterns appropriately
- **Error handling**: Implement graceful fallbacks with user-friendly error messages

### Update documentation after feature completion
- **README.md updates**: Reflect new features in the feature list and quickstart instructions
- **AGENTS.md updates**: Document new coding patterns, gotchas, or architectural decisions
- **TODO.md maintenance**: Mark completed tasks as `[x]` and add new tasks discovered during development
- **API documentation**: Update function signatures, add JSDoc comments for public interfaces
- **User-facing changes**: Ensure British English spelling and clear explanations

## Development principles

- **On‑device first, hybrid when needed.** Use Chrome’s built‑in AI Task APIs (Summarizer, Prompt, Multimodal) for all AI processing. Only fall back to a server function when local models are unavailable or context is too large. Never send raw attachments or sensitive data off the device without explicit user consent.
- **Client‑side parsing.** For attachments (PDF, DOCX, XLSX, images) use client‑side parsers (PDF.js, mammoth.js, SheetJS) and only resort to multimodal Prompt API for images or scanned documents. Avoid server‑side OCR unless hybrid mode is enabled.
- **OAuth and Webhooks.** Provide users with multiple ways to load email content: paste text manually, import threads via Gmail or Outlook OAuth flows, or subscribe to new messages via webhooks (e.g. using Google Pub/Sub for Gmail or Microsoft Graph webhooks). Make the integration optional and request the minimal read‑only scopes.
- **User memory and preferences.** The app must remember user‑specific instructions (e.g. preferred tone, default guidance text, hybrid mode choice). Persist these in `localStorage` for on‑device only mode. In hybrid mode, you may store preferences on the server (with consent) to provide continuity across devices. Always clearly inform users where their data is stored.
- **Modern Web stack.** Use React with TypeScript via Next.js. Keep the component tree modular and maintainable. Write clear, self‑documenting code and comments. Separate logic into `lib/` modules and UI into `components/`.
- **Accessibility and UX.** Follow accessibility best practices: proper aria labels, keyboard navigation, high contrast and no reliance on colour alone. Keep the UI simple, with clear sections for thread input, summaries, attachments, drafts and settings.
- **Performance and responsiveness.** Avoid blocking the main thread. Use web workers or async functions for heavy parsing and AI calls. Provide loading states and handle errors gracefully.
- **Privacy and security.** Never store or log email contents, attachments or user data beyond what is necessary for the feature. When hybrid mode sends data to the server, send only the smallest required text and document the exact data flow in the privacy notice.
- **British English.** All user‑visible text should use British English spelling and punctuation.

## Coding rules and patterns

### Directory structure and naming
- **Components**: Place in `src/components/` with PascalCase naming (`EmailThreadInput.tsx`)
- **Business logic**: Separate into `src/lib/` modules (`src/lib/ai/summarizer.ts`)
- **API routes**: Use `src/app/api/` with kebab-case (`/api/gmail-import/`)
- **Types**: Define in `src/types/` or co-located with components
- **Tests**: Mirror source structure in `__tests__/` directories

### Dependencies and imports
- **Avoid new dependencies**: Use existing libraries where possible
- **Import order**: React, Next.js, internal modules, external packages, types
- **No server dependencies**: Client-side parsing libraries only (PDF.js, mammoth.js, SheetJS)

### Error handling strategy  
- **User-facing errors**: Clear, actionable messages in British English
- **Developer errors**: Log to console.error() with context
- **AI API errors**: Check availability first, provide fallback options
- **Network errors**: Distinguish between client and server issues

### Accessibility requirements
- **Keyboard navigation**: All interactive elements accessible via keyboard
- **Screen readers**: Proper ARIA labels and semantic HTML
- **High contrast**: Ensure sufficient colour contrast ratios
- **Focus management**: Clear focus indicators and logical tab order

### Commit message pattern
```
type(scope): summary

feat(summarizer): add TL;DR generation with error handling
fix(oauth): resolve PKCE flow redirect issue
docs(readme): update quickstart instructions
test(attachment): add PDF parsing unit tests
refactor(ui): extract common button component
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`
Scopes: `summarizer`, `oauth`, `ui`, `attachment`, `webhook`, `hybrid`

## Don't list: avoid these patterns

❌ **Don't add new dependencies** without justification in SPEC.md
❌ **Don't make remote API calls** in default on-device mode  
❌ **Don't store PII** (email content, attachments) beyond session
❌ **Don't create UI without keyboard access** or screen reader support
❌ **Don't use external AI services** as primary processing method
❌ **Don't skip error handling** for AI API availability or parsing failures
❌ **Don't hard-code text strings** – use constants for user-facing text
❌ **Don't block the main thread** for heavy parsing or AI processing
❌ **Don't expose secrets** in client-side code or commit history
❌ **Don't use American English** spelling in user interface text

## Common gotchas

- **Model availability.** Always check `Summarizer.availability()` and `LanguageModel.availability()` before calling them. Show helpful messages if the user needs to download a model.
- **Token limits.** Keep prompts and inputs within the models’ token limits. Summarise in stages if necessary.
- **Error handling.** Wrap AI calls and parsers in try/catch blocks. Present friendly errors and log details only in dev tools.
- **Cross‑origin requests.** Gmail and Outlook APIs require proper OAuth flows. Use PKCE and avoid exposing secrets.
- **Webhook validation.** Webhook endpoints must verify signatures from Gmail/Graph. Rotate secrets and handle retries.

By following these guidelines and the requirements laid out in `SPEC.md`, we can build a robust, privacy‑preserving email triage web app that meets the hackathon's judging criteria and provides real value to users.
