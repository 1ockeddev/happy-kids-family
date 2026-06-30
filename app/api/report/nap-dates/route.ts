import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const child_id = searchParams.get('child_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const has_nap = searchParams.get('has_nap'); // 'true' or 'false'

    if (!child_id || !date_from || !date_to) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (has_nap === 'false') {
      // Get dates WITH daily_report records but WITHOUT nap data
      const noNapRecords = await query<{ date: string }>(
        `SELECT DISTINCT d.date 
         FROM daily_report dr
         JOIN daily d ON dr.daily_id = d.id
         WHERE dr.child_id = $1 
         AND d.date >= $2::date
         AND d.date <= $3::date
         AND (dr.nap_from IS NULL OR dr.nap_to IS NULL)
         ORDER BY d.date DESC`,
        [child_id, date_from, date_to]
      );

      return NextResponse.json({
        success: true,
        data: noNapRecords.map(r => r.date)
      });
    } else {
      // Get dates WITH nap records
      const napRecords = await query<{ date: string }>(
        `SELECT DISTINCT d.date 
         FROM daily_report dr
         JOIN daily d ON dr.daily_id = d.id
         WHERE dr.child_id = $1 
         AND d.date >= $2::date
         AND d.date <= $3::date
         AND dr.nap_from IS NOT NULL 
         AND dr.nap_to IS NOT NULL
         ORDER BY d.date DESC`,
        [child_id, date_from, date_to]
      );

      return NextResponse.json({
        success: true,
        data: napRecords.map(r => r.date)
      });
    }

  } catch (error) {
    console.error('Error fetching nap dates:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
