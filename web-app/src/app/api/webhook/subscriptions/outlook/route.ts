import { NextRequest, NextResponse } from 'next/server';
import type { WebhookSubscription } from '../../../../types/webhooks';

/**
 * Outlook webhook subscription management
 * Handles creating and managing Microsoft Graph webhook subscriptions
 */

export async function POST(request: NextRequest) {
  try {
    const { action, userEmail, accessToken } = await request.json();
    
    if (!userEmail || !accessToken) {
      return NextResponse.json(
        { error: 'User email and access token are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create':
        return await createOutlookSubscription(accessToken, userEmail);
      case 'delete':
        const { subscriptionId } = await request.json();
        return await deleteOutlookSubscription(accessToken, subscriptionId);
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "create" or "delete"' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Outlook subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create Microsoft Graph webhook subscription
 */
async function createOutlookSubscription(accessToken: string, userEmail: string): Promise<NextResponse> {
  try {
    const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/outlook`;
    
    // Create subscription for inbox messages
    const subscriptionData = {
      changeType: 'created',
      notificationUrl: notificationUrl,
      resource: "me/mailFolders('Inbox')/messages",
      expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days max
      clientState: `inbox-triage-${userEmail}-${Date.now()}`
    };

    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Microsoft Graph subscription error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to create Outlook subscription',
          details: errorData.error?.message 
        },
        { status: response.status }
      );
    }

    const subscriptionResponse = await response.json();
    
    // Store subscription info (in production, use a database)
    const subscription: WebhookSubscription = {
      id: `outlook-${userEmail}-${Date.now()}`,
      provider: 'outlook',
      userId: userEmail,
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(subscriptionResponse.expirationDateTime),
      subscriptionId: subscriptionResponse.id
    };

    return NextResponse.json({
      message: 'Outlook subscription created successfully',
      subscription,
      graphResponse: subscriptionResponse
    });

  } catch (error) {
    console.error('Error creating Outlook subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

/**
 * Delete Microsoft Graph webhook subscription
 */
async function deleteOutlookSubscription(accessToken: string, subscriptionId: string): Promise<NextResponse> {
  try {
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required for deletion' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Microsoft Graph delete subscription error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to delete Outlook subscription',
          details: errorData.error?.message 
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      message: 'Outlook subscription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Outlook subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}

/**
 * Get all active subscriptions for a user
 */
async function getOutlookSubscriptions(accessToken: string): Promise<NextResponse> {
  try {
    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Microsoft Graph get subscriptions error:', errorData);
      return NextResponse.json(
        { 
          error: 'Failed to get Outlook subscriptions',
          details: errorData.error?.message 
        },
        { status: response.status }
      );
    }

    const subscriptionsData = await response.json();

    return NextResponse.json({
      subscriptions: subscriptionsData.value || []
    });

  } catch (error) {
    console.error('Error getting Outlook subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const accessToken = url.searchParams.get('accessToken');

  if (action === 'list' && accessToken) {
    return await getOutlookSubscriptions(accessToken);
  }

  return NextResponse.json({
    message: 'Outlook webhook subscription management',
    description: 'POST to create or delete Microsoft Graph webhook subscriptions',
    actions: ['create', 'delete'],
    queryParams: {
      'action=list&accessToken={token}': 'Get all active subscriptions'
    }
  });
}