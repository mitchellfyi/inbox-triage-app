# Inbox Triage App - Next.js Version

This is the Next.js implementation of the Inbox Triage App, a web-based email triage companion that helps you summarise email threads, understand attachments and generate reply drafts using Chrome's built-in AI.

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

## Features Planned

These features will be implemented in future iterations:

- [ ] Chrome AI Task APIs integration (Summarizer, Prompt, Multimodal)
- [ ] Client-side attachment parsing (PDF.js, mammoth.js, SheetJS)
- [ ] Gmail/Outlook OAuth authentication  
- [ ] Webhook implementations
- [ ] User preferences persistence
- [ ] Hybrid fallback logic
- [ ] Voice guidance (Web Speech API)

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
└── test/                   # Test utilities
```

## Migration from Vite

This Next.js version provides the same functionality as the original Vite version with these improvements:

- Server-side rendering (SSR) capabilities
- Built-in API routes for backend functionality
- File-based routing system
- Better performance and SEO
- Integrated build optimization
- Full-stack development in single project

## Contributing

See the main [AGENTS.md](../AGENTS.md) for development guidelines and workflow.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
