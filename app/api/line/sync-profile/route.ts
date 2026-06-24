import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

// Get LINE profile from LINE API
async function getLineProfile(userId: string) {
  try {
    const r = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}` },
    });
    if (!r.ok) return null;
    return await r.json() as { 
      userId: string; 
      displayName: string; 
      pictureUrl?: string;
      statusMessage?: string;
    };
  } catch (err) {
    console.error('[LINE Profile] Error:', err);
    return null;
  }
}

// POST - Sync single user profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, displayName, pictureUrl, statusMessage } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    let profile;

    // If displayName and pictureUrl are provided (from LIFF), use them directly
    if (displayName !== undefined) {
      profile = {
        userId,
        displayName,
        pictureUrl,
        statusMessage
      };
      console.log(`[LINE Sync] Using LIFF profile data for ${userId}`);
    } else {
      // Otherwise, get profile from LINE API
      profile = await getLineProfile(userId);

      if (!profile) {
        return NextResponse.json(
          { error: 'Failed to get LINE profile' },
          { status: 404 }
        );
      }
      console.log(`[LINE Sync] Got profile from LINE API for ${userId}`);
    }

    // Update database
    const result = await queryOne(
      `UPDATE app_user 
       SET line_display_name = $1, 
           picture_url = $2,
           updated_at = NOW()
       WHERE line_user_id = $3
       RETURNING id, line_user_id, display_name, line_display_name, picture_url`,
      [profile.displayName, profile.pictureUrl ?? null, userId]
    );

    if (!result) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log(`[LINE Sync] Updated profile for ${userId}: ${profile.displayName}`);

    return NextResponse.json({
      success: true,
      user: result,
      synced: {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl
      }
    });
  } catch (err) {
    return serverError(err);
  }
}

// GET - Sync all users
export async function GET() {
  try {
    if (!CHANNEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Get all active users with LINE ID
    const users = await query<{ line_user_id: string; display_name: string }>(
      `SELECT line_user_id, display_name 
       FROM app_user 
       WHERE line_user_id IS NOT NULL 
         AND status = 'active'
       ORDER BY created_at DESC`
    );

    const results = {
      total: users.length,
      updated: 0,
      failed: 0,
      details: [] as Array<{ userId: string; status: string; displayName?: string; error?: string }>
    };

    // Sync each user (with rate limiting)
    for (const user of users) {
      try {
        const profile = await getLineProfile(user.line_user_id);

        if (!profile) {
          results.failed++;
          results.details.push({
            userId: user.line_user_id,
            status: 'failed',
            error: 'Failed to get profile from LINE'
          });
          continue;
        }

        // Update database
        await queryOne(
          `UPDATE app_user 
           SET line_display_name = $1, 
               picture_url = $2,
               updated_at = NOW()
           WHERE line_user_id = $3`,
          [profile.displayName, profile.pictureUrl ?? null, user.line_user_id]
        );

        results.updated++;
        results.details.push({
          userId: user.line_user_id,
          status: 'updated',
          displayName: profile.displayName
        });

        console.log(`[LINE Sync] Updated ${user.line_user_id}: ${profile.displayName}`);

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        results.failed++;
        results.details.push({
          userId: user.line_user_id,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
        console.error(`[LINE Sync] Failed for ${user.line_user_id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: results.total,
        updated: results.updated,
        failed: results.failed
      },
      details: results.details
    });

  } catch (err) {
    return serverError(err);
  }
}
