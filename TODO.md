# TODO List

Project-wide task tracker for the **Inbox Triage App**. Each task includes a title, optional owner, links to issues/PRs, and current status.

## How to use this TODO

**For contributors:**
1. **Pick a task** – Choose an item marked `[ ]` (to do) or `[~]` (help wanted)  
2. **Create a branch** – Use pattern `feature/task-name` or `fix/issue-name`
3. **Mark in progress** – Change `[ ]` to `[~]` and add your name as owner
4. **Work and PR** – Follow the workflow in [AGENTS.md](AGENTS.md), commit early and often, write comprehensive tests
5. **Update status** – Mark `[x]` when merged, link to PR number
6. **Update docs** – After feature completion, update README.md, AGENTS.md, and TODO.md to reflect current functionality

**For project maintainers:**
- Add new tasks as `[ ]` with clear acceptance criteria
- Reference GitHub issues when available (`Issue: #123`)
- Keep status current and update priorities as needed
- Archive completed sections periodically

## Legend
- **[ ]** To do (available)
- **[~]** In progress (assigned)  
- **[x]** Done (completed)
- **[?]** Blocked or needs clarification

## Docs

- [x] **Tighten README.md** – Add crisp overview, docs map, quickstart, architecture, privacy guarantees, contributing flow. (PR: #??)
- [x] **Update SPEC.md** – Add non-goals, constraints, API boundaries, acceptance criteria format. (PR: #??)
- [x] **Update AGENTS.md** – Add "Where to start", agent loop, coding rules, commit patterns, "don't" list. (PR: #??)
- [x] **Create .github/copilot-instructions.md** – Reference key docs, guardrails, "When contributing" bullets. (PR: #??)
- [x] **Restructure TODO.md** – Project-wide checklist with sections and usage guidance. (PR: #??)
- [ ] **Add GitHub templates** – PR template and issue templates for feature/bug reports. (Issue: #??)
- [ ] **Verify documentation links** – Ensure all inter-document links are relative and working. (Issue: #??)
- [ ] **Update documentation after Chrome AI integration** – Once AI Task APIs are integrated, update README.md features list and AGENTS.md patterns. (Issue: #??)
- [ ] **Update documentation after Gmail OAuth** – Document OAuth flow, update README.md features, add security considerations to AGENTS.md. (Issue: #??)
- [ ] **Update documentation after attachment parsing** – Document supported file types, update README.md, add parsing patterns to AGENTS.md. (Issue: #??)
- [ ] **Update documentation after UI components** – Document component usage, accessibility features, update AGENTS.md UI patterns. (Issue: #??)
- [ ] **Regular documentation review** – Quarterly review to ensure all docs reflect current functionality and remove outdated information. (Issue: #??)

## Extension Core

- [x] **Scaffold web app project structure** – Create `/web-app` folder with React + Next.js + TypeScript; set up basic routing and CI/CD for deployment. (Issue: #??)
- [x] **Add ESLint, Prettier and unit test framework** – Ensure code quality and consistency across contributions. (Issue: #??)
- [x] **Integrate Chrome AI Task APIs** – Add Summarizer, Prompt, and Multimodal API detection and integration with availability checks. (Issue: #??)
- [x] **Build AI processing modules** – Create `src/lib/ai/` modules for summarizer, prompt, and multimodal processing with error handling. (Issue: #??)
- [x] **Add AI model availability checker** – UI component that checks and displays Chrome AI model status with download guidance. (Issue: #??)

## Gmail Extraction

- [ ] **Gmail OAuth implementation** – PKCE flow for Gmail API access with minimal read-only scopes. (Issue: #??)
- [ ] **Gmail thread import** – Fetch email threads and attachments via Gmail API, parse into standard format. (Issue: #??)  
- [ ] **Gmail webhook subscription** – Use Google Pub/Sub to receive new message notifications. (Issue: #??)
- [ ] **Gmail content parsing** – Extract email body, attachments, metadata while preserving thread structure. (Issue: #??)

## Outlook Extraction  

- [ ] **Outlook OAuth implementation** – Microsoft Graph API integration with minimal scopes. (Issue: #??)
- [ ] **Outlook thread import** – Fetch conversations and attachments via Graph API. (Issue: #??)
- [ ] **Outlook webhook subscription** – Microsoft Graph webhook notifications for new emails. (Issue: #??)
- [ ] **Outlook content parsing** – Handle Outlook-specific email formats and attachment types. (Issue: #??)

## Drafting

- [x] **Reply draft generation** – Use Prompt API with JSON schema to produce three reply drafts with tone control. (Issue: #??)
- [x] **Tone and style controls** – UI for selecting professional, friendly, formal, casual reply styles. (Issue: #??)
- [x] **Custom guidance input** – Textarea for user instructions that get appended to reply generation prompts. (Issue: #??)
- [x] **Voice guidance via Speech API** – Web Speech API integration for dictating additional instructions with client-side processing, microphone button, visual feedback, and accessibility features. (Issue: #8)

## Side Panel UI

- [x] **Email thread input interface** – Text area and import buttons with validation and character count. (Issue: #??)
- [x] **Attachment upload and parsing** – Drag-and-drop file interface with PDF.js, mammoth.js, SheetJS integration. (Issue: #??)
- [x] **Multimodal image Q&A** – Image upload with question input for Prompt API multimodal processing. (Issue: #??)
- [x] **Results display components** – Clean, accessible presentation of summaries, key points, and reply drafts. (Issue: #??)
- [x] **Settings and preferences** – User configuration for default tone, hybrid mode, guidance text. (Issue: #??)
- [x] **Loading states and error handling** – Progressive feedback during AI processing and clear error messages. (Issue: #??)

## QA

- [ ] **Prepare demo fixtures** – Sample email thread, PDF, DOCX, XLSX, and image for demonstration purposes. (Issue: #??)
- [ ] **Write demo script** – Three-minute showcase script covering all major features. (Issue: #??)
- [ ] **Unit test coverage** – Tests for AI integration, file parsing, OAuth flows, and UI components. (Issue: #??)
- [ ] **End-to-end testing** – Browser automation tests for complete user workflows. (Issue: #??)
- [ ] **Accessibility audit** – WCAG 2.1 AA compliance verification and keyboard navigation testing. (Issue: #??)
- [ ] **Performance testing** – Load testing for file parsing and AI processing with large inputs. (Issue: #??)

---

**Last updated**: [Current date] | **Next priorities**: Chrome AI integration, file parsing, Gmail OAuth