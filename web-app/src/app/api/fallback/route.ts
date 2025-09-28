import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // TODO: Implement hybrid fallback functionality
    // This will handle AI processing when local models are unavailable
    // Should accept extracted text (never raw attachments) for privacy
    
    const body = await request.json();
    const { type, text, options } = body;
    
    if (!type || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: type and text' },
        { status: 400 }
      );
    }
    
    // Validate that we're only processing derived text, not raw files
    if (typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Only text content is allowed for privacy protection' },
        { status: 400 }
      );
    }
    
    switch (type) {
      case 'summarise':
        // TODO: Implement server-side summarisation fallback
        return NextResponse.json(
          { 
            message: 'Server-side summarisation not yet implemented',
            type,
            inputLength: text.length
          },
          { status: 501 }
        );
        
      case 'draft':
        // TODO: Implement server-side draft generation fallback
        return NextResponse.json(
          { 
            message: 'Server-side draft generation not yet implemented',
            type,
            inputLength: text.length,
            options
          },
          { status: 501 }
        );
        
      default:
        return NextResponse.json(
          { error: 'Unsupported fallback type' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Hybrid fallback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Hybrid fallback endpoint - supports summarise and draft types',
      supportedTypes: ['summarise', 'draft']
    },
    { status: 200 }
  );
}