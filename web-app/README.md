# Inbox Triage App

This is a web-based email triage companion that helps you summarise email threads, understand attachments and generate reply drafts using Chrome's built-in AI.

## Features

- **Thread Summarisation**: Generate TL;DR summaries and key points from email threads
- **Attachment Parsing**: Extract content from PDF, DOCX, XLSX, and other document formats
- **Image Q&A**: Ask questions about uploaded images using multimodal AI
- **Reply Draft Generation**: Create contextual reply drafts with tone control
- **Privacy-First**: All processing happens on-device using Chrome's built-in AI
- **Hybrid Fallback**: Optional server-side processing for enhanced capabilities

## Architecture

The app uses Next.js 15 with the App Router for modern React development with the following structure:

- **Pages**: File-based routing with `/`, `/import`, `/settings`
- **API Routes**: Server-side endpoints for future integrations:
  - `/api/gmail-import` - Gmail OAuth and email import
  - `/api/outlook-import` - Outlook OAuth and email import  
  - `/api/webhook/gmail` - Gmail webhook notifications
  - `/api/webhook/outlook` - Outlook webhook notifications
  - `/api/fallback` - Hybrid AI processing fallback
- **Components**: Reusable React components in `/src/components`

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

```bash
npm run build
npm run start
```

### Testing

```bash
# Run tests
npm run test:run

# Run tests in watch mode  
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## Environment Variables

Create a `.env.local` file based on `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Configure the environment variables as needed for OAuth, webhooks, and hybrid services.

## Features Implemented

- ✅ Next.js 15 with App Router
- ✅ TypeScript support
- ✅ Tailwind CSS styling
- ✅ File-based routing
- ✅ API routes structure
- ✅ Jest testing setup
- ✅ ESLint and Prettier
- ✅ Navigation component
- ✅ Basic pages (Home, Import, Settings)
- ✅ Responsive design
- ✅ Chrome AI Summarizer integration (TL;DR and key points)
- ✅ Chrome AI Prompt API integration (reply draft generation)
- ✅ Chrome AI Multimodal API integration (image Q&A)
- ✅ Client-side attachment parsing (PDF.js, mammoth.js, SheetJS)
- ✅ Image Q&A component with drag-and-drop upload
- ✅ Error handling and availability checks for AI models
- ✅ Comprehensive unit tests (93 tests passing)

## Features Planned

These features will be implemented in future iterations:

- [ ] Gmail/Outlook OAuth authentication  
- [ ] Webhook implementations
- [ ] User preferences persistence
- [ ] Hybrid fallback logic
- [ ] Voice guidance (Web Speech API)
- [ ] Screenshot capture functionality

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── fallback/       # Hybrid processing fallback
│   │   ├── gmail-import/   # Gmail import endpoint
│   │   ├── outlook-import/ # Outlook import endpoint
│   │   └── webhook/        # Webhook endpoints
│   ├── import/             # Import page
│   ├── settings/           # Settings page  
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Reusable components
│   ├── __tests__/          # Component tests
│   ├── AttachmentSection.tsx
│   ├── AttachmentUpload.tsx
│   ├── EmailThreadInput.tsx
│   ├── ImageQA.tsx         # Image Q&A component
│   ├── Navigation.tsx
│   ├── ReplyDrafts.tsx
│   └── ThreadSummary.tsx
├── lib/                    # Business logic modules
│   ├── ai/                 # AI integration modules
│   │   ├── __tests__/      # AI module tests
│   │   ├── multimodal.ts   # Multimodal image Q&A
│   │   ├── promptDrafts.ts # Reply draft generation
│   │   └── summarizer.ts   # Thread summarization
│   └── parse/              # File parsing modules
│       ├── __tests__/      # Parser tests
│       ├── docx.ts         # DOCX parsing
│       ├── image.ts        # Image processing
│       ├── index.ts        # Main parser
│       ├── pdf.ts          # PDF parsing
│       ├── utils.ts        # Utility functions
│       └── xlsx.ts         # Spreadsheet parsing
├── test/                   # Test utilities and mocks
└── types/                  # TypeScript type definitions
    └── attachment.ts       # Attachment-related types
```

## Contributing

See the main [AGENTS.md](../AGENTS.md) for development guidelines and workflow.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
