import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple fallback AI implementations for when local models are unavailable
 * These provide basic functionality until proper cloud AI integration is added
 */

/**
 * Generate a basic TL;DR summary from text
 */
function generateBasicSummary(text: string): { tldr: string; keyPoints: string[] } {
  // Split into sentences and paragraphs for basic analysis
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  
  // Extract first few sentences as TL;DR (simplified approach)
  const tldrSentences = sentences.slice(0, 2).map(s => s.trim()).filter(Boolean);
  const tldr = tldrSentences.length > 0 
    ? tldrSentences.join('. ') + '.'
    : 'Email thread requiring attention.';
  
  // Extract key points from paragraph starts (simplified approach)
  const keyPoints: string[] = [];
  
  // Look for bullet points, numbered lists, or paragraph starts
  const bulletRegex = /[•\-\*]\s*(.+?)(?=[•\-\*\n]|$)/g;
  const matches = text.match(bulletRegex);
  if (matches) {
    keyPoints.push(...matches.slice(0, 3).map(m => m.replace(/[•\-\*]\s*/, '').trim()));
  }
  
  // If no bullet points found, extract from paragraph starts
  if (keyPoints.length === 0) {
    paragraphs.slice(0, 3).forEach(p => {
      const firstSentence = p.split(/[.!?]/)[0]?.trim();
      if (firstSentence && firstSentence.length > 10) {
        keyPoints.push(firstSentence + '.');
      }
    });
  }
  
  // Fallback if no key points found
  if (keyPoints.length === 0) {
    keyPoints.push('Email contains important information requiring review.');
  }
  
  return { tldr: tldr.trim(), keyPoints };
}

/**
 * Generate basic reply drafts with different tones
 */
function generateBasicDrafts(text: string, options: { tone?: string; guidance?: string } = {}) {
  const tone = options.tone || 'neutral';
  const guidance = options.guidance || '';
  
  // Extract potential subject from text (simplified)
  const subjectMatch = text.match(/Subject:\s*(.+?)(?:\n|$)/i);
  const originalSubject = subjectMatch?.[1]?.trim() || 'Your message';
  const replySubject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
  
  // Basic templates based on tone
  const templates = {
    neutral: {
      greeting: 'Hello',
      closing: 'Best regards'
    },
    friendly: {
      greeting: 'Hi there',
      closing: 'Kind regards'
    },
    assertive: {
      greeting: 'Good day',
      closing: 'Regards'
    },
    formal: {
      greeting: 'Dear Colleague',
      closing: 'Yours sincerely'
    }
  };
  
  const template = templates[tone as keyof typeof templates] || templates.neutral;
  
  const drafts = [
    {
      subject: replySubject,
      body: `${template.greeting},\n\nThank you for your message. I'll review this and get back to you shortly.\n\n${template.closing},\n[Your name]`
    },
    {
      subject: replySubject,
      body: `${template.greeting},\n\nThank you for reaching out regarding this matter. I've noted the details and will provide a comprehensive response within the next business day. ${guidance ? `\n\nAs requested: ${guidance}` : ''}\n\n${template.closing},\n[Your name]`
    },
    {
      subject: replySubject,
      body: `${template.greeting},\n\nI appreciate you bringing this to my attention. After reviewing the information provided, I understand the key points you've raised. I'll coordinate with the relevant team members and provide a detailed response with next steps and recommendations by [specific date].\n\nPlease let me know if you need any clarification in the meantime.${guidance ? `\n\nAdditional context: ${guidance}` : ''}\n\n${template.closing},\n[Your name]`
    }
  ];
  
  return { drafts };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, text, options = {} } = body;
    
    // Validation
    if (!type || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: type and text' },
        { status: 400 }
      );
    }
    
    if (typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Only text content is allowed for privacy protection' },
        { status: 400 }
      );
    }
    
    // Ensure text is not too long (basic protection)
    if (text.length > 50000) {
      return NextResponse.json(
        { error: 'Text content too large for processing' },
        { status: 413 }
      );
    }
    
    switch (type) {
      case 'summarise': {
        const result = generateBasicSummary(text);
        return NextResponse.json({
          type: 'summarise',
          tldr: result.tldr,
          keyPoints: result.keyPoints,
          inputLength: text.length,
          processed: true
        });
      }
        
      case 'draft': {
        const result = generateBasicDrafts(text, options);
        return NextResponse.json({
          type: 'draft',
          drafts: result.drafts,
          inputLength: text.length,
          options,
          processed: true
        });
      }
        
      default:
        return NextResponse.json(
          { error: 'Unsupported fallback type. Supported: summarise, draft' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Hybrid fallback error:', error);
    return NextResponse.json(
      { error: 'Internal server error during hybrid processing' },
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