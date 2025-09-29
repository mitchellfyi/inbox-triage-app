import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle Microsoft Graph webhook notifications
    // These notifications inform us when emails are received/changed
    console.log('Received Outlook webhook:', body);
    
    // Validate webhook notification
    if (body.value && Array.isArray(body.value)) {
      for (const notification of body.value) {
        if (notification.resource && notification.changeType) {
          console.log(`Outlook notification: ${notification.changeType} on ${notification.resource}`);
          
          // TODO: Implement webhook processing logic
          // 1. Verify the webhook signature for security
          // 2. Process the notification based on changeType (created, updated, deleted)
          // 3. Optionally fetch the new/changed email if auto-processing is enabled
          // 4. Trigger summarisation pipeline if configured
        }
      }
    }
    
    return NextResponse.json(
      { message: 'Outlook webhook received and logged' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Outlook webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle Microsoft Graph webhook validation
  // When setting up a webhook subscription, Microsoft Graph sends a validation request
  const url = new URL(request.url);
  const validationToken = url.searchParams.get('validationToken');
  
  if (validationToken) {
    // Return the validation token as plain text for webhook validation
    return new Response(validationToken, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  }
  
  return NextResponse.json(
    { 
      message: 'Outlook webhook endpoint',
      description: 'Receives Microsoft Graph webhook notifications for email changes',
      validation: 'Pass validationToken query parameter for subscription validation'
    },
    { status: 200 }
  );
}