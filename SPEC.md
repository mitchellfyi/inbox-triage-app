# Specification

## Problem Statement

Modern email management suffers from information overload, with users spending excessive time reading lengthy email threads, processing attachments, and crafting appropriate responses. While email clients provide basic functionality, they lack intelligent summarisation, context-aware draft generation, and efficient attachment analysis. Users need a solution that can quickly distill email content into actionable insights and generate contextually appropriate responses while maintaining privacy and working across different email providers.

## Project Overview

This web application is a privacy-first email triage companion that solves email overload through intelligent on-device AI processing. It allows users to triage email threads outside their inbox by pasting text, importing messages via OAuth, or receiving notifications via webhooks. The app uses Chrome's built-in AI APIs to summarise conversations, understand attachments, and generate reply drafts locally. When local processing isn't possible, it provides an optional hybrid fallback that sends only derived text (never raw content) to a secure server with explicit user consent.

The application demonstrates the power of on-device AI for sensitive workflows while providing real utility for email management across Gmail, Outlook, and manual input methods.

## Objectives

- **Primary Value**: Reduce email processing time from minutes to seconds through intelligent summarisation and draft generation
- **Privacy-First**: Provide complete email triage functionality with default on-device processing and transparent hybrid fallback options
- **Universal Access**: Support multiple input methods (paste, Gmail/Outlook import, webhook notifications) for flexible workflow integration
- **Attachment Intelligence**: Parse and summarise common document types (PDF, DOCX, XLSX) and provide multimodal Q&A for images
- **Personalised Experience**: Learn user preferences and provide customisable draft generation with voice guidance support
- **Technical Excellence**: Demonstrate proper use of Chrome's AI Task APIs with graceful fallbacks and secure architecture

## Functional Requirements

### 1. Thread Summarisation (FR1)
**Purpose**: Transform lengthy email threads into concise, actionable summaries using on-device AI processing.

**Requirements**:
- Users can paste email thread text into a dedicated text area and receive automated analysis
- Imported threads from Gmail or Outlook OAuth flows produce equivalent summaries
- Summaries include both TL;DR (executive summary) and structured key points
- Processing uses Chrome's Summarizer API with availability checks and graceful error handling
- Support for threads up to 50,000 characters with automatic chunking for longer content

**Acceptance Criteria**:
- [ ] Text area accepts email thread input with proper validation and sanitisation
- [ ] Summarizer API availability is checked before processing with user feedback
- [ ] TL;DR summary is generated in under 3 seconds for threads ≤ 10,000 characters
- [ ] Key points are presented as structured, scannable bullet points
- [ ] Error states are handled gracefully with clear user messaging
- [ ] Summaries maintain context and accuracy for multi-participant conversations
- [ ] Results are displayed in an accessible, responsive interface

### 2. Attachment Parsing and Analysis (FR2)
**Purpose**: Extract and analyse content from common document formats using client-side processing.

**Requirements**:
- Support for PDF, DOCX, XLSX, CSV, PNG, and JPG file uploads via drag-and-drop or file picker
- Client-side parsing using PDF.js, mammoth.js, and SheetJS with no server-side processing
- Extracted text content is summarised using the Summarizer API
- Images are processed via Prompt API multimodal endpoints for content description
- File size limits and format validation with clear user feedback

**Acceptance Criteria**:
- [ ] File upload interface supports drag-and-drop and click-to-browse functionality
- [ ] PDF text extraction works for standard PDF documents (non-scanned)
- [ ] DOCX files are converted to plain text preserving basic structure
- [ ] XLSX/CSV files extract cell content with sheet selection for multi-sheet workbooks
- [ ] Image files generate descriptive captions via multimodal Prompt API
- [ ] File size validation prevents uploads exceeding reasonable limits (10MB per file)
- [ ] Error handling for corrupted files and unsupported formats
- [ ] Extracted content is summarised and presented alongside original file information
- [ ] Processing status indicators show progress for large files

### 3. Reply Draft Generation (FR3)
**Purpose**: Generate contextually appropriate email responses with customisable tone and user guidance.

**Requirements**:
- Generate three distinct reply drafts for any summarised email thread
- Tone selection options: neutral, friendly, assertive, and formal
- Free-text guidance box for additional user instructions
- Voice dictation support via Web Speech API for guidance input
- JSON schema-based generation for consistent draft structure
- Integration of user preferences and instruction memory

**Acceptance Criteria**:
- [ ] Three varied draft responses are generated for each summarisation
- [ ] Tone selector produces noticeably different response styles
- [ ] Guidance text box accepts up to 500 characters of user instructions
- [ ] Voice dictation activates with microphone button and populates guidance box
- [ ] Generated drafts maintain professional quality and contextual relevance
- [ ] Drafts include appropriate greeting, body, and closing elements
- [ ] User can copy, edit, or regenerate drafts with modified parameters
- [ ] Draft generation completes within 5 seconds for typical inputs
- [ ] Error states handle API failures with retry options

### 4. Multimodal Q&A (FR4)
**Purpose**: Enable users to ask questions about images and visual content using AI analysis.

**Requirements**:
- Image upload support for PNG, JPG, and screenshot capture
- Text input for questions about uploaded images
- Prompt API multimodal endpoint integration for visual analysis
- Results summarisation for lengthy responses
- Support for common image-based queries (charts, diagrams, text in images)

**Acceptance Criteria**:
- [ ] Image upload accepts standard formats with preview display
- [ ] Question input field provides contextual prompts and examples
- [ ] Multimodal processing generates relevant answers about image content
- [ ] Text within images is recognised and can be queried
- [ ] Chart and diagram content is interpreted accurately
- [ ] Response quality is maintained for various image types and questions
- [ ] Processing time remains under 10 seconds for typical image/question combinations
- [ ] Results are formatted clearly with proper citations to image elements

### 5. Email Import and Webhook Integration (FR5)
**Purpose**: Seamlessly integrate with Gmail and Outlook for automated email retrieval and processing.

**Requirements**:
- OAuth 2.0 flows with PKCE for Gmail (Google Identity) and Outlook (Microsoft Graph)
- Read-only email access with minimal required scopes
- Secure token storage using IndexedDB with automatic refresh
- Webhook endpoints for push notifications of new emails
- Automatic processing of newly received messages when webhooks are configured

**Acceptance Criteria**:
- [ ] Gmail OAuth flow completes successfully with appropriate scope requests
- [ ] Outlook OAuth integration works across major browsers
- [ ] Email threads and attachments are imported without data loss
- [ ] Token refresh occurs automatically before expiration
- [ ] Webhook subscription setup includes clear privacy disclosures
- [ ] New email notifications trigger automatic summarisation when enabled
- [ ] Import history maintains thread context and participant information
- [ ] OAuth token revocation is supported with clear user controls
- [ ] Rate limiting compliance prevents API quota issues

### 6. User Memory and Personalisation (FR6)
**Purpose**: Learn and apply user preferences to improve draft generation and user experience over time.

**Requirements**:
- Persistent storage of user preferences (tone, guidance defaults, hybrid mode selection)
- User-specific instruction memory for custom prompt templates
- Privacy controls for data storage location (local vs server with consent)
- Preference application in draft generation and UI customisation
- Export/import capability for user settings

**Acceptance Criteria**:
- [ ] User preferences persist across browser sessions using localStorage
- [ ] Custom instruction templates can be saved, edited, and reused
- [ ] Privacy settings clearly indicate where preferences are stored
- [ ] Server-side preference storage requires explicit opt-in consent
- [ ] Preference changes immediately affect subsequent AI processing
- [ ] Settings export/import enables backup and device synchronisation
- [ ] Default preferences provide sensible starting configuration
- [ ] Preference reset functionality restores factory defaults

### 7. Hybrid Fallback Processing (FR7)
**Purpose**: Provide server-based processing option when local AI capabilities are insufficient or unavailable.

**Requirements**:
- Automatic detection of local AI model availability and capability
- User opt-in required for any server-side processing with clear data handling disclosure
- Server endpoints that process only derived text content (never raw files or images)
- Clear UI indicators when cloud processing is active
- Fallback decision logic based on content size and model availability

**Acceptance Criteria**:
- [ ] Chrome AI Task API availability is checked before processing attempts
- [ ] Hybrid mode requires explicit user activation with privacy explanation
- [ ] Server fallback endpoints only accept text content, rejecting files/images
- [ ] UI clearly indicates when processing occurs locally vs remotely
- [ ] Fallback triggers only when local processing genuinely cannot handle the request
- [ ] User can disable hybrid mode and receive local-only functionality
- [ ] Server endpoints include rate limiting and authentication protection
- [ ] Fallback results maintain equivalent quality to local processing

### 8. User Interface and Experience (FR8)
**Purpose**: Provide an intuitive, accessible, and responsive interface that supports the core email triage workflow.

**Requirements**:
- Responsive design supporting desktop and tablet viewports
- Accessible implementation following WCAG 2.1 AA guidelines
- Clear navigation between Home, Import, and Settings pages
- Loading states, progress indicators, and error messaging
- British English language throughout the interface

**Acceptance Criteria**:
- [ ] Interface adapts properly to screen sizes from 768px to 1920px width
- [ ] Keyboard navigation supports all interactive elements
- [ ] Screen reader compatibility with appropriate ARIA labels
- [ ] Loading states provide clear feedback during AI processing
- [ ] Error messages are specific, actionable, and user-friendly
- [ ] British spelling and terminology used consistently (summarise, colour, etc.)
- [ ] High contrast mode compatibility for accessibility
- [ ] Touch-friendly interface elements for tablet users
- [ ] Clear visual hierarchy guides users through the triage workflow

## Technical Requirements

### 1. Client Technology Stack (TR1)
**Purpose**: Establish the core technology foundation for reliable, maintainable development.

**Requirements**:
- React 19+ with Next.js 15+ App Router for modern React patterns
- TypeScript for comprehensive type safety and development experience
- Chrome's built-in AI Task APIs (Summarizer, Prompt, Multimodal) as primary AI processing layer
- Tailwind CSS for consistent, responsive styling
- Jest and React Testing Library for comprehensive testing coverage

**Acceptance Criteria**:
- [ ] Next.js App Router provides file-based routing with proper SSR/CSR handling
- [ ] TypeScript configuration enables strict mode with full type coverage
- [ ] Chrome AI APIs are properly detected and gracefully handle unavailability
- [ ] Tailwind configuration supports accessibility patterns and responsive design
- [ ] Test suite covers critical user paths with >80% code coverage

### 2. Client-Side Parsing Libraries (TR2)
**Purpose**: Enable comprehensive document analysis without server dependencies.

**Requirements**:
- PDF.js for reliable PDF text extraction with fallback for complex layouts
- mammoth.js for DOCX to HTML/text conversion with style preservation
- SheetJS (xlsx) for comprehensive spreadsheet parsing (XLS, XLSX, CSV)
- Built-in browser APIs for image processing and canvas manipulation
- File validation and size limits to prevent performance issues

**Acceptance Criteria**:
- [ ] PDF parsing handles standard documents and provides meaningful errors for unsupported types
- [ ] DOCX conversion maintains text structure and handles complex formatting
- [ ] Spreadsheet parsing supports multiple sheets and various cell formats
- [ ] Image processing works across major browser formats (PNG, JPG, WebP)
- [ ] File size validation prevents uploads exceeding 50MB with clear user feedback

### 3. Authentication and Security (TR3)
**Purpose**: Implement secure, standards-compliant authentication for email provider integration.

**Requirements**:
- OAuth 2.0 with PKCE implementation for Gmail (Google Identity Platform)
- Microsoft Graph API integration for Outlook/Exchange Online access
- IndexedDB for secure, client-side token storage with encryption where possible
- Automatic token refresh with proper error handling and user re-authentication
- Minimal scope requests following principle of least privilege

**Acceptance Criteria**:
- [ ] OAuth flows complete securely without exposing credentials in browser storage
- [ ] Token refresh occurs automatically before expiration with user notification on failure
- [ ] Scope requests are limited to read-only access with clear user consent screens
- [ ] Authentication state persists appropriately across browser sessions
- [ ] Token revocation fully clears stored credentials and invalidates server-side sessions

### 4. Voice and Multimodal Integration (TR4)
**Purpose**: Enhance user experience with voice input and visual content analysis capabilities.

**Requirements**:
- Web Speech API integration with proper permissions handling
- Prompt API multimodal endpoints for image analysis and question answering
- Fallback mechanisms for unsupported browsers or disabled permissions
- Privacy controls for microphone access and processing preferences
- Cross-browser compatibility testing for voice features

**Acceptance Criteria**:
- [ ] Voice dictation works reliably in supported browsers with clear permission requests
- [ ] Multimodal image analysis provides accurate, contextual responses
- [ ] Fallback UI gracefully handles unsupported features without breaking core functionality
- [ ] Voice processing respects user privacy preferences and browser settings
- [ ] Error handling provides specific guidance when features are unavailable

### 5. Hybrid Fallback Infrastructure (TR5)
**Purpose**: Provide server-side processing capabilities when local AI is insufficient.

**Requirements**:
- Next.js API routes for server-side AI processing endpoints
- Rate limiting and authentication to prevent abuse of server resources
- Text-only processing with strict validation to prevent raw file uploads
- Comprehensive logging for debugging and monitoring (excluding user content)
- Deployment compatibility with Vercel, Netlify, and self-hosted environments

**Acceptance Criteria**:
- [ ] API endpoints handle text processing requests with proper validation
- [ ] Rate limiting prevents abuse while allowing legitimate use cases
- [ ] Server processing maintains equivalent quality to local AI results
- [ ] Error responses provide actionable feedback without exposing system details
- [ ] Deployment configurations support multiple hosting platforms

### 6. Webhook and Real-time Integration (TR6)
**Purpose**: Enable automated email processing for continuous workflow integration.

**Requirements**:
- Webhook endpoints for Gmail Push notifications and Microsoft Graph change notifications
- Message validation and authentication using provider-specific verification methods
- Automatic email content retrieval and processing when notifications are received
- User preference controls for webhook subscription management
- Proper handling of webhook delivery failures and retry logic

**Acceptance Criteria**:
- [ ] Gmail webhook integration properly validates push notification signatures
- [ ] Microsoft Graph webhooks handle subscription lifecycle and renewals
- [ ] Incoming email processing triggers summarisation without user intervention
- [ ] Webhook failures are logged and reported to users appropriately
- [ ] Subscription management allows users to easily enable/disable automatic processing

### 7. Security and Privacy Controls (TR7)
**Purpose**: Implement comprehensive security measures and privacy protections.

**Requirements**:
- HTTPS enforcement for all communication with appropriate security headers
- Input sanitisation and validation to prevent XSS and injection attacks
- Content Security Policy (CSP) configuration to prevent malicious script execution
- Privacy controls with clear data handling disclosures and user consent mechanisms
- Regular security dependency updates and vulnerability scanning

**Acceptance Criteria**:
- [ ] All HTTP traffic redirects to HTTPS with proper security headers
- [ ] User inputs are sanitised and validated before processing or storage
- [ ] CSP headers prevent unauthorized script execution and data exfiltration
- [ ] Privacy controls clearly explain data handling with granular user consent options
- [ ] Security dependencies are regularly updated with automated vulnerability scanning

## High-Level Architecture

### System Overview
The Inbox Triage App follows a hybrid client-server architecture with privacy-first design principles:

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │   UI Components │  │  Chrome AI APIs │  │ File Parsers ││
│  │  - Home/Import  │  │  - Summarizer   │  │ - PDF.js     ││
│  │  - Settings     │  │  - Prompt       │  │ - mammoth.js ││
│  │  - Results      │  │  - Multimodal   │  │ - SheetJS    ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │   localStorage  │  │    IndexedDB    │  │  OAuth Tokens││
│  │ - Preferences   │  │ - User Memory   │  │ - Gmail      ││
│  │ - UI State      │  │ - Cache         │  │ - Outlook    ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend Services (Optional)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐│
│  │ Hybrid Fallback │  │    Webhooks     │  │ OAuth Flows  ││
│  │ - Text Only     │  │ - Gmail Push    │  │ - PKCE       ││
│  │ - Rate Limited  │  │ - Graph API     │  │ - Secure     ││
│  └─────────────────┘  └─────────────────┘  └──────────────┘│
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                External Provider APIs                       │
│        Gmail API            Microsoft Graph API            │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### Frontend Application
- **React Components**: Modular UI components with accessibility built-in
- **Chrome AI Integration**: Direct browser API usage with availability detection
- **File Processing**: Client-side parsing with no server uploads
- **State Management**: Local storage and IndexedDB for user preferences and memory
- **OAuth Integration**: Secure token management with automatic refresh

#### Privacy-First Data Flow
1. **Input**: Email text via paste, file upload, or OAuth import
2. **Processing**: On-device AI analysis using Chrome APIs
3. **Storage**: Local preferences and memory only (unless user consents to server storage)
4. **Fallback**: Server processing only for derived text when local processing fails
5. **Output**: Summaries and drafts presented directly to user

#### Optional Server Components
- **Hybrid Fallback API**: Processes text-only content when local AI unavailable
- **Webhook Handlers**: Receive and process email notifications from providers
- **OAuth Endpoints**: Handle authentication flows and token management

### Data Flow and Privacy Controls

#### On-Device Processing (Default)
```
Email Thread → Chrome Summarizer API → TL;DR + Key Points
Attachment → Client Parser → Extracted Text → Local Summarization
User Guidance + Context → Chrome Prompt API → Draft Replies
```

#### Hybrid Fallback (User Opt-in Required)
```
Large Email Thread → Size Check → Local Processing Failed
                  ↓
User Consent → Extract Text Only → Server API → Results
(Never: Raw Files, Images, Full Emails)
```

#### Privacy Guarantees
- **Default Local Processing**: All AI operations use browser APIs
- **Explicit Consent**: Server processing requires clear user opt-in
- **Text-Only Fallback**: Server never receives raw files or images
- **User Control**: Complete preference management and data deletion
- **Transparency**: Clear indicators when processing occurs remotely

## Evaluation Criteria

The success of this project is measured across five key dimensions that demonstrate both technical execution and user value:

### Purpose and Problem Solving
- **Problem Clarity**: Does the application clearly address email overload with measurable time savings?
- **User Value**: Do the summarisation and draft generation features provide genuine utility?
- **Real-world Application**: Can users integrate this into their actual email workflows?
- **Privacy Respect**: Does the solution solve problems without compromising user data security?

### Functionality and Feature Completeness
- **Core Features**: Are thread summarisation, attachment parsing, and draft generation fully functional?
- **Advanced Features**: Do multimodal Q&A, voice guidance, and webhook integration work as specified?
- **Error Handling**: Does the application gracefully handle edge cases and API failures?
- **Feature Integration**: Do all features work together coherently in realistic usage scenarios?

### User Experience and Interface Design
- **Intuitive Design**: Can new users understand and use the application without extensive instruction?
- **Responsive Interface**: Does the UI work well across different screen sizes and devices?
- **Accessibility Compliance**: Are WCAG 2.1 AA guidelines followed for inclusive design?
- **Performance**: Do interactions feel fast and responsive during AI processing?
- **Feedback and Guidance**: Are loading states, errors, and success messages clear and helpful?

### Technical Execution and Architecture
- **Chrome AI Integration**: Are the Summarizer, Prompt, and Multimodal APIs used correctly?
- **Client-Side Processing**: Is file parsing and AI processing handled locally as designed?
- **Security Implementation**: Are authentication flows, data handling, and privacy controls robust?
- **Code Quality**: Is the codebase well-structured, typed, and maintainable?
- **Scalability**: Can the architecture handle reasonable user loads and feature expansion?

### Content Quality and AI Effectiveness
- **Summary Accuracy**: Do generated summaries capture key information and maintain context?
- **Draft Relevance**: Are reply drafts contextually appropriate and professionally written?
- **Tone Variation**: Do different tone settings produce meaningfully different responses?
- **Multimodal Understanding**: Does image analysis provide accurate and useful insights?
- **Consistency**: Is AI output quality maintained across different input types and lengths?

## Non-Functional Requirements

### Privacy and Data Protection
- **On-Device Default**: All AI processing occurs locally using Chrome APIs without data transmission
- **Explicit Consent**: Server-side hybrid processing requires clear user opt-in with data handling disclosure
- **Data Minimisation**: Only derived text (never raw attachments or complete emails) sent to servers when hybrid mode is enabled
- **User Control**: Complete preference management with local storage options and server-side data deletion capabilities
- **Transparency**: Clear indicators show when processing occurs locally versus remotely
- **No Tracking**: No user behaviour analytics or data collection beyond functional requirements

### Performance and Responsiveness
- **Processing Speed**: Email thread summarisation completes within 3 seconds for threads ≤ 10,000 characters on supported devices
- **File Processing**: Attachment parsing and analysis completes within 10 seconds for files ≤ 10MB
- **UI Responsiveness**: Interface interactions respond within 100ms with appropriate loading states for longer operations
- **Memory Efficiency**: Client-side processing maintains reasonable memory usage without impacting browser performance
- **Progressive Enhancement**: Core functionality remains available when advanced features are unsupported

### Accessibility and Usability
- **WCAG 2.1 AA Compliance**: Full keyboard navigation, proper ARIA labelling, and screen reader compatibility
- **Colour Independence**: Interface does not rely solely on colour to convey information
- **High Contrast Support**: Compatible with high contrast display modes and user accessibility preferences
- **Touch Accessibility**: Interface elements are appropriately sized and spaced for touch interaction
- **Cognitive Load**: Clear information hierarchy and consistent interaction patterns reduce cognitive burden

### Cross-Browser Compatibility
- **Chrome Support**: Full functionality in Chrome 118+ with Chrome AI APIs enabled
- **Baseline Functionality**: Core features work in Firefox, Safari, and Edge with graceful degradation
- **Progressive Enhancement**: Advanced features (voice input, AI processing) fail gracefully when unsupported
- **Mobile Compatibility**: Responsive design supports mobile browsers with appropriate feature adaptation
- **Legacy Handling**: Clear messaging when browsers or features are unsupported

### Reliability and Error Handling
- **Graceful Degradation**: Application remains functional when individual features fail or are unavailable
- **Error Recovery**: Comprehensive error handling with specific user guidance and retry mechanisms
- **Data Integrity**: File parsing errors do not corrupt user data or application state
- **Session Persistence**: User preferences and work-in-progress maintain state across browser sessions
- **API Failure Handling**: Chrome AI API unavailability is detected and communicated with fallback options

### Maintainability and Code Quality
- **Type Safety**: Comprehensive TypeScript usage with strict mode enabled
- **Component Architecture**: Modular React components with clear separation of concerns
- **Code Documentation**: Clear inline documentation and comprehensive README files
- **Testing Coverage**: Unit tests for critical functionality with >70% code coverage
- **Dependency Management**: Regular updates of security-critical dependencies with automated vulnerability scanning

### Scalability and Resource Management
- **Client Resources**: Efficient use of client-side processing power and memory
- **Server Capacity**: Hybrid fallback services designed to handle concurrent users with appropriate rate limiting
- **Storage Efficiency**: Local storage usage optimised for long-term user preference persistence
- **Network Usage**: Minimal bandwidth requirements with efficient data transfer protocols
- **Growth Support**: Architecture supports feature additions without requiring fundamental restructuring

### Internationalisation and Localisation
- **British English**: Default interface language uses British spelling and terminology
- **Locale Awareness**: Date, time, and number formatting respects user locale settings
- **Unicode Support**: Full Unicode character support for international email content
- **Future Localisation**: Code structure supports additional language translations
- **Cultural Sensitivity**: Interface design and content avoid cultural assumptions
