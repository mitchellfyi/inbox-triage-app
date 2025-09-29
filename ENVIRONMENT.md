# Environment Variables

This document outlines the environment variables needed for the Inbox Triage App.

## OAuth Configuration

### Gmail Integration
```bash
NEXT_PUBLIC_GMAIL_CLIENT_ID=your-gmail-client-id
```

### Outlook Integration  
```bash
NEXT_PUBLIC_OUTLOOK_CLIENT_ID=your-outlook-client-id
```

## Setting up OAuth Applications

### Gmail (Google Cloud Console)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials (Web application)
5. Add your domain to authorized origins (e.g., `https://your-app.vercel.app`)
6. Add `/import` to authorized redirect URIs (e.g., `https://your-app.vercel.app/import`)
7. Copy the Client ID to `NEXT_PUBLIC_GMAIL_CLIENT_ID`

### Outlook (Azure AD)
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create a new registration
4. Set redirect URI to your production domain + `/import` (e.g., `https://your-app.vercel.app/import`)
5. Under API permissions, add:
   - `Microsoft Graph` > `Mail.Read` (delegated permission)
6. Copy the Application (client) ID to `NEXT_PUBLIC_OUTLOOK_CLIENT_ID`

## Deployment Environment Variables

### Local Development
Create a `.env.local` file in the `web-app` directory:

```bash
NEXT_PUBLIC_GMAIL_CLIENT_ID=your-gmail-client-id
NEXT_PUBLIC_OUTLOOK_CLIENT_ID=your-outlook-client-id
```

### Vercel Deployment
Set these environment variables in your Vercel project dashboard:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables for all environments (Production, Preview, Development):

```bash
NEXT_PUBLIC_GMAIL_CLIENT_ID=your-gmail-client-id
NEXT_PUBLIC_OUTLOOK_CLIENT_ID=your-outlook-client-id
```

**Important:** Make sure to update your OAuth applications with the correct redirect URIs:
- Development: `http://localhost:3000/import`
- Production: `https://your-app.vercel.app/import`

## Security Notes

- These are **public** environment variables (prefixed with `NEXT_PUBLIC_`)
- They're safe to expose in the browser as they're used for OAuth flows
- The actual authentication happens via secure OAuth 2.0 with PKCE
- No client secrets are needed for this implementation

The app will work without these variables, but the respective import features will not be available.