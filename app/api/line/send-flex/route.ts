import { NextRequest, NextResponse } from 'next/server';
import { serverError } from '@/lib/api-helpers';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

export async function POST(req: NextRequest) {
  try {
    if (!CHANNEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' },
        { status: 500 }
      );
    }

    const { userId, flexMessage } = await req.json();

    if (!userId || !flexMessage) {
      return NextResponse.json(
        { error: 'userId and flexMessage are required' },
        { status: 400 }
      );
    }

    // Send flex message via LINE Messaging API
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'flex',
            altText: 'Flex Message',
            contents: flexMessage
          }
        ]
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
