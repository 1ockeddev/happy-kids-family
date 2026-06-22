import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { serverError } from '@/lib/api-helpers';

// GET - List all LINE users and groups for autocomplete
export async function GET() {
  try {
    // Get all LINE users with active status
    const users = await query(
      `SELECT 
        line_user_id as id,
        display_name,
        line_display_name,
        role,
        'user' as type
       FROM app_user
       WHERE line_user_id IS NOT NULL 
         AND status = 'active'
       ORDER BY display_name ASC`
    );

    // Get all active LINE groups
    const groups = await query(
      `SELECT 
        line_group_id as id,
        group_name as display_name,
        group_type,
        'group' as type
       FROM line_groups
       WHERE status = 'active'
       ORDER BY group_name ASC`
    );

    // Combine and format results
    const recipients = [
      ...users.map((u: any) => ({
        id: u.id,
        label: `${u.display_name || u.line_display_name || 'User'} (${u.role})`,
        type: 'user',
        role: u.role
      })),
      ...groups.map((g: any) => ({
        id: g.id,
        label: `${g.display_name || 'Group'} (${g.group_type || 'group'})`,
        type: 'group',
        groupType: g.group_type
      }))
    ];

    return NextResponse.json({ recipients });
  } catch (err) {
    return serverError(err);
  }
}
