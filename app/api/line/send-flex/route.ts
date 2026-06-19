import { NextRequest, NextResponse } from 'next/server';
import { serverError } from '@/lib/api-helpers';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

export async function POST(req: NextRequest) {
  try {
    if (!CHANNEL_ACCESS_TOKEN) {
      console.error('[LINE] CHANNEL_ACCESS_TOKEN not configured');
      return NextResponse.json(
        { error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    console.log('[LINE] Request body:', { userId: body.userId, hasFlexMessage: !!body.flexMessage });

    const { userId, flexMessage } = body;

    if (!userId || !flexMessage) {
      console.error('[LINE] Missing required fields:', { userId: !!userId, flexMessage: !!flexMessage });
      return NextResponse.json(
        { error: 'userId and flexMessage are required', details: { userId: !!userId, flexMessage: !!flexMessage } },
        { status: 400 }
      );
    }

    // Support both user ID (U...) and group ID (C...)
    const isGroupId = userId.startsWith('C');
    console.log('[LINE] Sending to:', isGroupId ? 'group' : 'user', userId);

    // Detect message type: Flex Message or Template Message
    let message;
    
    if (flexMessage.type === 'template') {
      // Template Message (buttons, confirm, carousel, image carousel)
      console.log('[LINE] Detected Template Message type:', flexMessage.template?.type);
      message = flexMessage; // Use as-is (already has type, altText, template)
    } else {
      // Flex Message (bubble, carousel)
      console.log('[LINE] Detected Flex Message type:', flexMessage.type);
      message = {
        type: 'flex',
        altText: flexMessage.altText || 'Flex Message',
        contents: flexMessage
      };
    }

    // Send message via LINE Messaging API
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [message]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[LINE] Send flex message failed:', error);
      return NextResponse.json(
        { error: 'Failed to send message', details: error },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
