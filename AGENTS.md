# Agents Development Guide for Inbox Triage App

This guide is for AI coding agents and human contributors working on the **Inbox Triage App**, a web‑based companion to the Inbox Triage Chrome extension. It explains where to find the project docs, how to approach development, and best practices to ensure consistency, quality and privacy.

## Where to start

- **Read `SPEC.md` and `README.md` first.** Understand the high‑level goals, functional and technical requirements, and the problem the app solves.
- **Check `TODO.md`.** This document lists all the current tasks, their status and links to issues. Choose a task, make sure you understand its scope and acceptance criteria, then claim it via an issue or pull request.
- **Review the GitHub issues.** Each issue contains a detailed problem statement, solution outline, tasks and definition of done. Stick to the acceptance criteria.

## Development principles

- **On‑device first, hybrid when needed.** Use Chrome’s built‑in AI Task APIs (Summarizer, Prompt, Multimodal) for all AI processing. Only fall back to a server function when local models are unavailable or context is too large. Never send raw attachments or sensitive data off the device without explicit user consent.
- **Client‑side parsing.** For attachments (PDF, DOCX, XLSX, images) use client‑side parsers (PDF.js, mammoth.js, SheetJS) and only resort to multimodal Prompt API for images or scanned documents. Avoid server‑side OCR unless hybrid mode is enabled.
- **OAuth and Webhooks.** Provide users with multiple ways to load email content: paste text manually, import threads via Gmail or Outlook OAuth flows, or subscribe to new messages via webhooks (e.g. using Google Pub/Sub for Gmail or Microsoft Graph webhooks). Make the integration optional and request the minimal read‑only scopes.
- **User memory and preferences.** The app must remember user‑specific instructions (e.g. preferred tone, default guidance text, hybrid mode choice). Persist these in `localStorage` for on‑device only mode. In hybrid mode, you may store preferences on the server (with consent) to provide continuity across devices. Always clearly inform users where their data is stored.
- **Modern Web stack.** Use React with TypeScript via Vite. Keep the component tree modular and maintainable. Write clear, self‑documenting code and comments. Separate logic into `lib/` modules and UI into `components/`.
- **Accessibility and UX.** Follow accessibility best practices: proper aria labels, keyboard navigation, high contrast and no reliance on colour alone. Keep the UI simple, with clear sections for thread input, summaries, attachments, drafts and settings.
- **Performance and responsiveness.** Avoid blocking the main thread. Use web workers or async functions for heavy parsing and AI calls. Provide loading states and handle errors gracefully.
- **Privacy and security.** Never store or log email contents, attachments or user data beyond what is necessary for the feature. When hybrid mode sends data to the server, send only the smallest required text and document the exact data flow in the privacy notice.
- **British English.** All user‑visible text should use British English spelling and punctuation.

## Workflow for agents

1. **Pick a task.** Choose an open issue or line item in `TODO.md`.
2. **Plan the solution.** Break the task into subtasks, consider edge cases and ensure it aligns with the SPEC and this guide.
3. **Implement in a feature branch.** Follow the project structure and naming conventions. Add or update unit tests where appropriate.
4. **Update docs.** If you introduce a new component, API call or configuration, update `README.md`, `SPEC.md` or this guide as necessary. If the task creates a new feature, add a corresponding line to `TODO.md`.
5. **Submit a pull request.** Reference the issue number, describe what you did, why and how, and list any trade‑offs. Ensure the PR passes lint and tests.
6. **Review and revise.** Address code review comments promptly and maintain a collaborative tone.

## Common gotchas

- **Model availability.** Always check `Summarizer.availability()` and `LanguageModel.availability()` before calling them. Show helpful messages if the user needs to download a model.
- **Token limits.** Keep prompts and inputs within the models’ token limits. Summarise in stages if necessary.
- **Error handling.** Wrap AI calls and parsers in try/catch blocks. Present friendly errors and log details only in dev tools.
- **Cross‑origin requests.** Gmail and Outlook APIs require proper OAuth flows. Use PKCE and avoid exposing secrets.
- **Webhook validation.** Webhook endpoints must verify signatures from Gmail/Graph. Rotate secrets and handle retries.

By following these guidelines and the requirements laid out in `SPEC.md`, we can build a robust, privacy‑preserving email triage web app that meets the hackathon's judging criteria and provides real value to users.
