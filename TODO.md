# TODO List

This document tracks tasks for developing the **Inbox Triage App**. Each task should have a status and link to the related issue when available. Feel free to update statuses and add new tasks as the project evolves.

## Legend
- **[ ]** To do
- **[\~]** In progress
- **[x]** Done

## Project setup

- [x] **Scaffold web app project structure** – Create `/web-app` folder with React + Next.js + TypeScript; set up basic routing and CI/CD for deployment. (Issue: #??)
- [x] **Add ESLint, Prettier and unit test framework** – Ensure code quality and consistency across contributions. (Issue: #??)

## Core features

- [ ] **Integrate Summarizer API** – Implement a module for TL;DR and key points summarisation of email threads. Handle availability checks and errors. (Issue: #??)
- [ ] **Integrate Prompt API for draft generation** – Use JSON schema to produce three reply drafts with adjustable tone and incorporate free-text guidance. (Issue: #??)
- [ ] **Implement attachment parsing** – Parse PDFs (PDF.js), DOCX (mammoth.js), XLS/XLSX/CSV (SheetJS) and extract text for summarisation. (Issue: #??)
- [ ] **Implement multimodal Q&A** – Let users upload images or select screenshots and ask questions using the Prompt API with image input; summarise results. (Issue: #??)
- [ ] **Add guidance box and voice dictation** – Provide a textarea for user instructions appended to prompt; use Web Speech API for voice input. (Issue: #??)

## Email integration

- [ ] **Gmail OAuth import** – Implement Gmail OAuth PKCE flow to fetch email threads and attachments via the Gmail API; request minimal read-only scopes. (Issue: #??)
- [ ] **Outlook OAuth import** – Implement Microsoft identity + Graph API flow to fetch email threads and attachments; ensure cross-browser compatibility. (Issue: #??)
- [ ] **Webhook subscription for new emails** – Allow users to receive notifications when new emails arrive via Gmail or Outlook webhooks, retrieving message content automatically. (Issue: #??)

## Hybrid and privacy

- [ ] **Hybrid fallback logic** – Write a `hybrid/decider.ts` module that checks model availability and context size, falling back to a server summarisation endpoint when needed. (Issue: #??)
- [ ] **User configuration & privacy toggle** – Build a settings dialog where users choose on-device only vs hybrid mode, with clear explanations of what data leaves the device. (Issue: #??)
- [ ] **Define hybrid decision rules and privacy copy** – Document thresholds for switching to cloud and craft user-facing privacy copy; update docs accordingly. (Issue: #??)

## Memory and preferences

- [ ] **Persist user preferences** – Store tone, hybrid mode choice, default guidance text and other settings in `localStorage` or server storage (with consent). (Issue: #??)
- [ ] **User-specific instruction memory** – Allow users to save custom instructions or prompts that the app uses for generating drafts; show them in the UI. (Issue: #??)

## Demo and testing

- [ ] **Prepare demo fixtures** – Collect a sample email thread, a PDF, a DOCX, an XLSX and a chart image for demo purposes; add them to `demo-fixtures/`. (Issue: #??)
- [ ] **Write demo script** – Prepare a three-minute script that showcases thread summarisation, attachment analysis, multimodal Q&A, guidance input and hybrid fallback. (Issue: #??)

## Documentation

- [ ] **Update README.md** – Reflect new features, installation steps, permissions, privacy explanation and usage instructions. (Issue: #??)
- [ ] **Update SPEC.md** – Add requirements for webhooks, OAuth imports, user memory and hybrid mode; include acceptance criteria for each. (Issue: #??)
- [ ] **Update AGENTS.md** – Reference the new features and update the workflow or gotchas as needed. (Issue: #??)
- [ ] **Maintain this TODO** – After completing tasks or adding new ones, update statuses and issue references.
