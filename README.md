# Inbox Triage App

A web-based email triage companion that helps you summarise email threads, understand attachments and generate reply drafts — all running primarily on-device using Chrome’s built-in AI. It complements the Inbox Triage Extension by providing a browser-based interface that works outside of Gmail/Outlook and offers import and webhook integrations for new emails.

## Why build it

Modern email overload is real. The extension solves it in-context, but sometimes you want to triage outside your inbox or handle incoming messages automatically. This app lets you paste, import or subscribe to new message notifications, then uses on-device AI to produce useful summaries and responses.

## Features

- **Thread summarisation** – Paste or import an email thread and get a TL;DR plus key points.
- **Attachment understanding** – Upload PDFs, DOCX, XLSX or images; the app parses and summarises them locally.
- **Reply drafts with tone control** – Generate three reply drafts with custom tone and optional guidance.
- **Multimodal Q&A** – Ask questions about images or screenshots using the Prompt API’s multimodal capabilities.
- **Voice guidance** – Dictate additional instructions via the Web Speech API.
- **Email import & webhooks** – Sign in with Gmail or Outlook to fetch threads and attachments; optional server webhook to receive new messages.
- **Hybrid fallback** – When the device can’t process locally, fallback to a secure server using minimal derived text; you control whether this happens.

## Documentation

This repo contains several important documents to guide development:

- [SPEC.md](SPEC.md) – Functional and technical requirements.
- [AGENTS.md](AGENTS.md) – Guidelines for AI coding agents and contributors.
- [TODO.md](TODO.md) – Task list and project progress.

## Getting started

### Web Application

To run the web app locally:

1. Clone the repository and navigate to the web app:

    ```bash
    git clone https://github.com/mitchellfyi/inbox-triage-app.git
    cd inbox-triage-app/web-app
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm run dev
    ```

4. Open `http://localhost:5173` in your browser.

### Available Scripts

In the `web-app` directory, you can run:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

The web app is built with React, TypeScript, and Vite. It uses no external servers by default. To enable Gmail/Outlook import or hybrid fallback, follow the instructions in the spec.

## Contributing

- Read **SPEC.md** and **AGENTS.md** before writing code. They describe the requirements, constraints and workflow.
- Keep all processing on-device unless explicitly using the hybrid fallback.
- Use British English for all user-facing text.
- Update **TODO.md** as tasks are completed or added.
- Make pull requests against `main` with clear commit messages.

## Privacy and security

By default, all AI tasks run in the browser with no data leaving your device. When hybrid fallback is enabled, only derived text (never raw files) is sent to a remote service. See the spec for details.
