import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This endpoint is primarily for client-side OAuth flows
    // The actual Microsoft Graph API calls are made directly from the client
    // This endpoint could be used for server-side operations if needed
    
    return NextResponse.json(
      { 
        message: 'Outlook import uses client-side authentication and API calls',
        supportedOperations: ['client-side OAuth', 'Microsoft Graph API access']
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Outlook import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Outlook import endpoint',
      description: 'This endpoint supports client-side Outlook integration via Microsoft Graph API',
      authFlow: 'OAuth 2.0 with PKCE using MSAL',
      scopes: ['https://graph.microsoft.com/Mail.Read'],
      privacy: 'Read-only access to emails, processed locally by default'
    },
    { status: 200 }
  );
}