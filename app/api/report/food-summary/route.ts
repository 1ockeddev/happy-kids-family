import { query } from '@/lib/db';
import { ok, badRequest, serverError } from '@/lib/api-helpers';
import { NextRequest } from 'next/server';

// GET /api/report/food-summary?child_id=xxx&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
// สรุปสถิติการกินอาหาร ผลไม้ นม การนอน และการขับถ่ายของเด็กในช่วงเวลา
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const child_id = searchParams.get('child_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    if (!child_id) return badRequest('child_id จำเป็น');

    let sql = `
      SELECT 
        food_amount,
        COUNT(*) as count
      FROM daily_report dr
      JOIN daily d ON dr.daily_id = d.id
      WHERE dr.child_id = $1
        AND food_amount IS NOT NULL
    `;

    const params: (string | number)[] = [child_id];
    let paramIdx = 2;

    if (date_from) {
      sql += ` AND d.date >= $${paramIdx}`;
      params.push(date_from);
      paramIdx++;
    }

    if (date_to) {
      sql += ` AND d.date <= $${paramIdx}`;
      params.push(date_to);
      paramIdx++;
    }

    sql += `
      GROUP BY food_amount
      ORDER BY food_amount
    `;

    const foodStats = await query(sql, params);

    // Query for fruit statistics
    let fruitSql = `
      SELECT 
        fruit_amount,
        COUNT(*) as count
      FROM daily_report dr
      JOIN daily d ON dr.daily_id = d.id
      WHERE dr.child_id = $1
        AND fruit_amount IS NOT NULL
    `;

    const fruitParams: (string | number)[] = [child_id];
    let fruitParamIdx = 2;

    if (date_from) {
      fruitSql += ` AND d.date >= $${fruitParamIdx}`;
      fruitParams.push(date_from);
      fruitParamIdx++;
    }

    if (date_to) {
      fruitSql += ` AND d.date <= $${fruitParamIdx}`;
      fruitParams.push(date_to);
      fruitParamIdx++;
    }

    fruitSql += `
      GROUP BY fruit_amount
      ORDER BY fruit_amount
    `;

    const fruitStats = await query(fruitSql, fruitParams);

    // Query for milk1 statistics
    let milk1Sql = `
      SELECT 
        milk1 as milk_amount,
        COUNT(*) as count
      FROM daily_report dr
      JOIN daily d ON dr.daily_id = d.id
      WHERE dr.child_id = $1
        AND milk1 IS NOT NULL
    `;

    const milk1Params: (string | number)[] = [child_id];
    let milk1ParamIdx = 2;

    if (date_from) {
      milk1Sql += ` AND d.date >= $${milk1ParamIdx}`;
      milk1Params.push(date_from);
      milk1ParamIdx++;
    }

    if (date_to) {
      milk1Sql += ` AND d.date <= $${milk1ParamIdx}`;
      milk1Params.push(date_to);
      milk1ParamIdx++;
    }

    milk1Sql += `
      GROUP BY milk1
      ORDER BY milk1
    `;

    const milk1Stats = await query(milk1Sql, milk1Params);

    // Query for milk2 statistics
    let milk2Sql = `
      SELECT 
        milk2 as milk_amount,
        COUNT(*) as count
      FROM daily_report dr
      JOIN daily d ON dr.daily_id = d.id
      WHERE dr.child_id = $1
        AND milk2 IS NOT NULL
    `;

    const milk2Params: (string | number)[] = [child_id];
    let milk2ParamIdx = 2;

    if (date_from) {
      milk2Sql += ` AND d.date >= $${milk2ParamIdx}`;
      milk2Params.push(date_from);
      milk2ParamIdx++;
    }

    if (date_to) {
      milk2Sql += ` AND d.date <= $${milk2ParamIdx}`;
      milk2Params.push(date_to);
      milk2ParamIdx++;
    }

    milk2Sql += `
      GROUP BY milk2
      ORDER BY milk2
    `;

    const milk2Stats = await query(milk2Sql, milk2Params);

    // Query for nap statistics
    let napSql = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN nap_from IS NOT NULL AND nap_to IS NOT NULL THEN 1 END) as nap_days,
        AVG(
          CASE 
            WHEN nap_from IS NOT NULL AND nap_to IS NOT NULL THEN
              EXTRACT(EPOCH FROM (nap_to::time - nap_from::time)) / 3600
            ELSE NULL
          END
        ) as avg_hours
      FROM daily_report dr
      JOIN daily d ON dr.daily_id = d.id
      WHERE dr.child_id = $1
    `;

    const napParams: (string | number)[] = [child_id];
    let napParamIdx = 2;

    if (date_from) {
      napSql += ` AND d.date >= $${napParamIdx}`;
      napParams.push(date_from);
      napParamIdx++;
    }

    if (date_to) {
      napSql += ` AND d.date <= $${napParamIdx}`;
      napParams.push(date_to);
      napParamIdx++;
    }

    const napStats = await query(napSql, napParams);

    // Query for excretion statistics
    let excretionSql = `
      SELECT 
        e.type,
        e.action,
        COUNT(*) as count
      FROM child_excretion e
      JOIN daily d ON e.daily_id = d.id
      WHERE e.child_id = $1
    `;

    const excretionParams: (string | number)[] = [child_id];
    let excretionParamIdx = 2;

    if (date_from) {
      excretionSql += ` AND d.date >= $${excretionParamIdx}::date`;
      excretionParams.push(date_from);
      excretionParamIdx++;
    }

    if (date_to) {
      excretionSql += ` AND d.date <= $${excretionParamIdx}::date`;
      excretionParams.push(date_to);
      excretionParamIdx++;
    }

    excretionSql += `
      GROUP BY e.type, e.action
      ORDER BY e.type, e.action
    `;

    const excretionStats = await query(excretionSql, excretionParams);

    return ok({
      food: foodStats,
      fruit: fruitStats,
      milk1: milk1Stats,
      milk2: milk2Stats,
      nap: napStats[0] || { total_days: 0, nap_days: 0, avg_hours: null },
      excretions: excretionStats
    });
  } catch (err) {
    console.error('Food summary API error:', err);
    return serverError(err);
  }
}
