# GitHub Copilot Instructions for Inbox Triage App

**Always read [SPEC.md](../SPEC.md) and [AGENTS.md](../AGENTS.md) first.**

## When contributing

Before suggesting or implementing code:

- **Read [SPEC.md](../SPEC.md) and [AGENTS.md](../AGENTS.md) first** – Understand privacy-first, on-device constraints and development principles
- **Never add network calls** or external AI services in default mode – use Chrome's built-in AI Task APIs only
- **Never add new dependencies** without explicit justification – prefer existing client-side libraries
- **Keep [TODO.md](../TODO.md) updated** after each change – mark completed tasks, add new ones as needed
- **Follow the agent loop** – read → plan → small PRs → tests → docs update
- **Use British English** for all user-facing text and documentation

## Resources

Essential project documentation (read in order):

- **[../SPEC.md](../SPEC.md)** – Complete functional and technical requirements, constraints, acceptance criteria
- **[../AGENTS.md](../AGENTS.md)** – Development guide, coding rules, workflow, patterns to follow  
- **[../README.md](../README.md)** – Project overview, architecture, quickstart, contributing flow
- **[../TODO.md](../TODO.md)** – Current task list, status tracking, and next priorities

## Guardrails

### Privacy and security
- **Default on-device processing**: All AI tasks use Chrome's Summarizer, Prompt, and Multimodal APIs  
- **No data leakage**: Email content, attachments, and user data stay on device by default
- **Hybrid fallback only**: Server processing requires explicit user consent and sends minimal derived text only
- **Client-side parsing**: Use PDF.js, mammoth.js, SheetJS – never upload files to server
- **No secrets**: Never commit API keys, tokens, or credentials

### Accessibility and performance  
- **WCAG 2.1 AA compliance**: Proper ARIA labels, keyboard navigation, high contrast
- **Responsive design**: Support mobile, tablet, and desktop screen sizes
- **No blocking**: Use web workers or async functions for heavy processing
- **Loading states**: Provide clear feedback during AI processing and file parsing
- **Error handling**: Graceful degradation with actionable user messages

### Code quality
- **TypeScript strict mode**: Comprehensive type safety with proper error handling
- **Test coverage**: Unit tests for critical functionality, especially AI API integration
- **Consistent patterns**: Follow existing code structure and naming conventions
- **Minimal changes**: Surgical, precise modifications – don't break existing functionality
- **Documentation**: Update README.md, SPEC.md, or AGENTS.md when introducing new features

## Supported mail providers and browsers

**Primary target**: Chrome browser with built-in AI Task APIs enabled

**Email integration**: Gmail and Outlook via OAuth with minimal read-only scopes

**File parsing**: Client-side support for PDF, DOCX, XLSX, CSV, PNG, JPG

## Architecture reminders

- **Frontend**: Next.js 15 + React + TypeScript with App Router
- **AI Processing**: Chrome's built-in Task APIs (check availability first)
- **State management**: localStorage for on-device preferences  
- **File uploads**: Drag-and-drop with client-side parsing
- **API routes**: Minimal server endpoints for OAuth and hybrid fallback only

Remember: This is a privacy-first, on-device AI application. Default behaviour should never send user data off the device.