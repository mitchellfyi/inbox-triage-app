# Inbox Triage App

**Cut through email overload in seconds, not minutes.**

A web-based email triage companion that helps you summarise email threads, understand attachments and generate reply drafts — all running primarily on-device using Chrome's built-in AI. Works outside Gmail/Outlook with support for paste, import, and webhook integrations.

**Key value:** Turn 15-minute email processing into 30-second decisions while keeping your data private.

## Docs map

Navigate the project documentation:

- **[SPEC.md](SPEC.md)** – Complete functional and technical requirements
- **[AGENTS.md](AGENTS.md)** – Development guide for AI coding agents and contributors  
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** – GitHub Copilot configuration and rules
- **[TODO.md](TODO.md)** – Project task list and progress tracking

## Quickstart

### Prerequisites
- Chrome browser (for built-in AI APIs)
- Node.js 18+ and npm

### Install, develop, and test
```bash
# Clone and navigate
git clone https://github.com/mitchellfyi/inbox-triage-app.git
cd inbox-triage-app/web-app

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in Chrome

# Run tests and linting
npm run test:run
npm run lint
npm run format
```

### Production build
```bash
npm run build
npm run start
```

## Architecture at a glance

The app follows a **privacy-first, on-device AI** architecture:

- **Frontend**: Next.js 15 + React + TypeScript with App Router
- **AI Processing**: Chrome's built-in Task APIs (Summarizer, Prompt, Multimodal)
- **File Parsing**: Client-side parsers (PDF.js, mammoth.js, SheetJS)
- **Email Integration**: OAuth flows (Gmail/Outlook) with minimal scopes
- **Webhooks**: Optional server endpoints for new email notifications
- **Hybrid Fallback**: Secure server processing when local AI unavailable
- **Storage**: localStorage for preferences (on-device mode)

For detailed architecture and components, see [SPEC.md](SPEC.md).

## Features

- **Thread summarisation** – Paste or import an email thread and get a TL;DR plus key points.
- **Attachment understanding** – Upload PDFs, DOCX, XLSX or images; the app parses and summarises them locally.
- **Reply drafts with tone control** – Generate three reply drafts with custom tone and optional guidance.
- **Multimodal Q&A** – Ask questions about images or screenshots using the Prompt API's multimodal capabilities.
- **Voice guidance** – Dictate additional instructions via the Web Speech API.
- **Email import & webhooks** – Sign in with Gmail or Outlook to fetch threads and attachments; optional server webhook to receive new messages.
- **Hybrid fallback** – When the device can't process locally, fallback to a secure server using minimal derived text; you control whether this happens.

## Privacy guarantees

**Default: 100% on-device processing**
- All AI tasks run in Chrome's built-in models
- Email content never leaves your device
- Attachments parsed locally (PDF.js, mammoth.js, SheetJS)
- User preferences stored in browser localStorage

**Optional: Hybrid fallback mode**
- Used only when local models unavailable or context too large
- Sends only derived text summaries, never raw emails or attachments
- Requires explicit user consent with clear data flow explanation
- Server processing is minimal and stateless

See [SPEC.md](SPEC.md) for complete privacy and security details.

## Contributing flow

1. **Read the docs first**: [SPEC.md](SPEC.md) → [AGENTS.md](AGENTS.md) → [TODO.md](TODO.md)
2. **Find or create a task**: Check [TODO.md](TODO.md) for open items or GitHub issues
3. **Assign and branch**: Claim a task, create a feature branch
4. **Develop with quality**: Follow [AGENTS.md](AGENTS.md) coding rules, commit early and often with clear messages
5. **Write comprehensive tests**: Add unit tests for new functionality, ensure all tests pass without workarounds
6. **Test and lint frequently**: Run `npm run test:run`, `npm run lint` before each commit and before submitting
7. **Pull request**: Reference issue, describe changes, ensure CI passes
8. **Update documentation**: After merging, update README.md, AGENTS.md, and TODO.md to reflect current functionality

### Development rules
- **On-device first**: Use Chrome AI APIs; only fallback to server when needed
- **British English**: All user-facing text
- **No external dependencies**: Avoid unnecessary packages
- **Accessibility**: WCAG 2.1 AA compliance
- **Type safety**: Comprehensive TypeScript usage
- **Test coverage**: Comprehensive unit tests for critical functionality, all tests must pass cleanly
- **Commit quality**: Frequent, small commits with clear conventional commit messages
- **Documentation maintenance**: Update docs after completing features to reflect current state

## Available Scripts

In the `web-app` directory, you can run:

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier