# Specification

## Project Overview

This web application is a companion to the Inbox Triage Extension. It allows users to triage email threads outside of their inbox by pasting text, importing messages via OAuth, or receiving notifications via webhooks. The app uses on‑device AI features in the browser to summarise conversations, understand attachments, and generate reply drafts. When necessary and with user consent, it can fall back to a server for heavy processing.

## Objectives

- Provide a standalone web interface for summarising and drafting replies to email threads.
- Support uploading and summarising common attachment types (PDF, DOCX, XLSX, images).
- Expose a multimodal Q&A feature for images and screenshots.
- Allow users to import threads from Gmail and Outlook via OAuth and to receive messages via webhooks.
- Enable tone‑controlled draft generation with optional free‑text and voice guidance.
- Persist user preferences and memory for personalised replies.
- Offer a hybrid fallback path when the device cannot process data locally.

## Functional Requirements

1. **Thread Summarisation (FR1)**  
   - Users can paste an email thread into a text area and receive a TL;DR summary and key points.  
   - Imported threads from Gmail or Outlook must produce the same summary.  
   - Summaries are generated locally using the Summarizer API and presented in the UI.

2. **Attachment Parsing (FR2)**  
   - Users can upload attachments (PDF, DOCX, XLSX, CSV, PNG/JPG) for analysis.  
   - The app parses the file client‑side (PDF.js, mammoth.js, SheetJS) and extracts text.  
   - Extracted text is summarised using the Summarizer API.  
   - Images are sent to the Prompt API’s multimodal endpoint for captioning; the caption is summarised for display.

3. **Reply Draft Generation (FR3)**  
   - For any summarised thread, users can generate three reply drafts with selectable tone (neutral, friendly, assertive, formal).  
   - Users may provide additional instructions via a free‑text box; these instructions are appended to the Prompt API request.  
   - Voice dictation populates the instructions box via Web Speech API.  
   - Drafts are generated using the Prompt API with a JSON schema to ensure predictable structure.

4. **Multimodal Q&A (FR4)**  
   - Users can upload an image or select a region of an attachment and ask a question about it.  
   - The app sends the image and question to the Prompt API’s multimodal endpoint and displays the answer.  
   - Answers are summarised or condensed into key points via the Summarizer API when appropriate.

5. **Email Import & Webhooks (FR5)**  
   - Users can sign in via OAuth to Gmail or Outlook with read‑only scopes to fetch email threads and attachments.  
   - Import flows should comply with provider guidelines and use PKCE.  
   - An optional webhook endpoint allows the app to receive notifications of new messages; messages pulled via the webhook are summarised and displayed in the interface.

6. **User Memory & Personalisation (FR6)**  
   - The app stores user preferences (tone, default mode, history of replies) in local storage or user profile.  
   - Preferences and memory are used to tailor draft generation.  
   - User memory may be persisted on the server only with explicit consent.

7. **Hybrid Fallback (FR7)**  
   - When on‑device AI models are unavailable or the input exceeds device limits, the app can send derived text to a server for processing.  
   - Users must opt in to hybrid mode; the UI clearly indicates when cloud processing occurs.  
   - Only extracted text is sent; raw attachments and images remain local.

8. **User Interface (FR8)**  
   - The app provides a responsive, accessible interface built with React and Tailwind.  
   - Pages: Home (paste/import), Summaries, Attachments, Drafts, Settings.  
   - Provide clear loading states, error messages, and privacy notices.

## Technical Requirements

1. **Client Technology (TR1)**  
   - Use React with Vite for the front end.  
   - Use TypeScript for type safety.  
   - Use Chrome’s built‑in AI task APIs (Summarizer, Prompt) available in the browser.

2. **Parsing Libraries (TR2)**  
   - PDF.js for PDF extraction.  
   - mammoth.js for DOCX conversion to text.  
   - SheetJS for XLS/XLSX/CSV parsing.

3. **Authentication (TR3)**  
   - Implement OAuth 2.0 with PKCE for Gmail (Google Identity) and Outlook (Microsoft Identity).  
   - Store tokens securely in the browser (e.g., IndexedDB) and refresh using refresh tokens where permitted.  
   - Only request scopes necessary for reading messages and attachments.

4. **Voice and Multimodal (TR4)**  
   - Use the Web Speech API for dictation.  
   - Use the Prompt API’s multimodal endpoints for image Q&A.  
   - Implement fallbacks when APIs are unavailable.

5. **Hybrid Fallback Service (TR5)**  
   - Provide a small server (Firebase Functions or similar) to process summarisation or draft generation when local models are unavailable.  
   - Expose an endpoint that accepts extracted text and returns summaries or drafts.  
   - Enforce rate limiting and authentication to protect the service.

6. **Webhook Handling (TR6)**  
   - Implement a server endpoint to receive push notifications from Gmail or Outlook.  
   - Validate messages, fetch the new email content via provider APIs, and forward it to the client.  
   - Secure the endpoint with a secret token.

7. **Security (TR7)**  
   - Serve the app over HTTPS.  
   - Sanitize all user inputs to prevent injection attacks.  
   - Follow OAuth best practices for token storage and revocation.

## Evaluation Criteria

The success of this project will be judged on:

- **Functionality** – Does the app meet the functional requirements above? Are all features implemented and working?  
- **Purpose** – Does it solve the problem of email overload in a meaningful way?  
- **User Experience** – Is the interface intuitive, responsive and accessible?  
- **Technical Execution** – Are on‑device AI features used properly? Are fallbacks secure and privacy‑conscious?  
- **Content Quality** – Are summaries and drafts relevant, concise and helpful?

## Non‑Functional Requirements

- **Privacy** – Default to on‑device processing. Never send raw attachments or images to the server. Provide clear privacy settings and disclosures.  
- **Performance** – Summarisation and draft generation should complete in under 3 seconds for typical email threads (\u2264 10k characters) on supported devices.  
- **Accessibility** – Follow WCAG guidelines; ensure keyboard navigation and screen reader compatibility.  
- **Internationalisation** – Use British English by default; consider translation or locale detection as a stretch goal.  
- **Maintainability** – Organise code into modular components; write clear documentation; include unit tests.  
- **Scalability** – Design the server components (webhook and hybrid service) to handle reasonable load from concurrent users.  
