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
        ) as avg_hours,
        MAX(
          CASE 
            WHEN nap_from IS NOT NULL AND nap_to IS NOT NULL THEN
              EXTRACT(EPOCH FROM (nap_to::time - nap_from::time)) / 3600
            ELSE NULL
          END
        ) as max_hours,
        MIN(
          CASE 
            WHEN nap_from IS NOT NULL AND nap_to IS NOT NULL THEN
              EXTRACT(EPOCH FROM (nap_to::time - nap_from::time)) / 3600
            ELSE NULL
          END
        ) as min_hours
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

    // Query for first potty date
    let firstPottySql = `
      SELECT 
        MIN(d.date) as first_potty_date
      FROM child_excretion e
      JOIN daily d ON e.daily_id = d.id
      WHERE e.child_id = $1
        AND e.action = 'potty'
    `;

    const firstPottyParams: (string | number)[] = [child_id];
    let firstPottyParamIdx = 2;

    if (date_from) {
      firstPottySql += ` AND d.date >= $${firstPottyParamIdx}::date`;
      firstPottyParams.push(date_from);
      firstPottyParamIdx++;
    }

    if (date_to) {
      firstPottySql += ` AND d.date <= $${firstPottyParamIdx}::date`;
      firstPottyParams.push(date_to);
      firstPottyParamIdx++;
    }

    const firstPottyResult = await query(firstPottySql, firstPottyParams);

    // Query for food/fruit from daily table where daily_report notes contain "เพิ่ม"
    let notesSql = `
      SELECT DISTINCT
        d.food,
        dr.food_note,
        d.fruit,
        dr.fruit_note
      FROM daily_report dr
      JOIN daily d ON dr.daily_id = d.id
      WHERE dr.child_id = $1
        AND (
          (dr.food_note ILIKE '%เพิ่ม%' AND d.food IS NOT NULL)
          OR 
          (dr.fruit_note ILIKE '%เพิ่ม%' AND d.fruit IS NOT NULL)
        )
    `;

    const notesParams: (string | number)[] = [child_id];
    let notesParamIdx = 2;

    if (date_from) {
      notesSql += ` AND d.date >= $${notesParamIdx}::date`;
      notesParams.push(date_from);
      notesParamIdx++;
    }

    if (date_to) {
      notesSql += ` AND d.date <= $${notesParamIdx}::date`;
      notesParams.push(date_to);
      notesParamIdx++;
    }

    const notesResult = await query(notesSql, notesParams);

    // Query for food/fruit that were NOT eaten
    let notEatenSql = `
      SELECT DISTINCT
        d.food,
        dr.food_note,
        d.fruit,
        dr.fruit_note
      FROM daily_report dr
      JOIN daily d ON dr.daily_id = d.id
      WHERE dr.child_id = $1
        AND (
          (dr.food_note ILIKE '%ไม่ทาน%' AND d.food IS NOT NULL)
          OR 
          (dr.fruit_note ILIKE '%ไม่ทาน%' AND d.fruit IS NOT NULL)
        )
    `;

    const notEatenParams: (string | number)[] = [child_id];
    let notEatenParamIdx = 2;

    if (date_from) {
      notEatenSql += ` AND d.date >= $${notEatenParamIdx}::date`;
      notEatenParams.push(date_from);
      notEatenParamIdx++;
    }

    if (date_to) {
      notEatenSql += ` AND d.date <= $${notEatenParamIdx}::date`;
      notEatenParams.push(date_to);
      notEatenParamIdx++;
    }

    const notEatenResult = await query(notEatenSql, notEatenParams);

    // Collect unique food and fruit items with their notes
    const foodItemsMap = new Map<string, Set<string>>();
    const fruitItemsMap = new Map<string, Set<string>>();
    const notEatenFoodMap = new Map<string, Set<string>>();
    const notEatenFruitMap = new Map<string, Set<string>>();

    notesResult.forEach((row: any) => {
      if (row.food && row.food.trim().length > 0 && row.food_note && row.food_note.includes('เพิ่ม')) {
        const foodName = row.food.trim();
        const note = row.food_note.trim();
        if (!foodItemsMap.has(foodName)) {
          foodItemsMap.set(foodName, new Set());
        }
        foodItemsMap.get(foodName)!.add(note);
      }
      if (row.fruit && row.fruit.trim().length > 0 && row.fruit_note && row.fruit_note.includes('เพิ่ม')) {
        const fruitName = row.fruit.trim();
        const note = row.fruit_note.trim();
        if (!fruitItemsMap.has(fruitName)) {
          fruitItemsMap.set(fruitName, new Set());
        }
        fruitItemsMap.get(fruitName)!.add(note);
      }
    });

    notEatenResult.forEach((row: any) => {
      if (row.food && row.food.trim().length > 0 && row.food_note && row.food_note.includes('ไม่ทาน')) {
        const foodName = row.food.trim();
        const note = row.food_note.trim();
        if (!notEatenFoodMap.has(foodName)) {
          notEatenFoodMap.set(foodName, new Set());
        }
        notEatenFoodMap.get(foodName)!.add(note);
      }
      if (row.fruit && row.fruit.trim().length > 0 && row.fruit_note && row.fruit_note.includes('ไม่ทาน')) {
        const fruitName = row.fruit.trim();
        const note = row.fruit_note.trim();
        if (!notEatenFruitMap.has(fruitName)) {
          notEatenFruitMap.set(fruitName, new Set());
        }
        notEatenFruitMap.get(fruitName)!.add(note);
      }
    });

    // Convert maps to arrays with food/fruit name and their notes
    const foodItems = Array.from(foodItemsMap.entries()).map(([name, notes]) => ({
      name,
      notes: Array.from(notes)
    }));

    const fruitItems = Array.from(fruitItemsMap.entries()).map(([name, notes]) => ({
      name,
      notes: Array.from(notes)
    }));

    const notEatenFoodItems = Array.from(notEatenFoodMap.entries()).map(([name, notes]) => ({
      name,
      notes: Array.from(notes)
    }));

    const notEatenFruitItems = Array.from(notEatenFruitMap.entries()).map(([name, notes]) => ({
      name,
      notes: Array.from(notes)
    }));

    return ok({
      food: foodStats,
      fruit: fruitStats,
      milk1: milk1Stats,
      milk2: milk2Stats,
      nap: napStats[0] || { total_days: 0, nap_days: 0, avg_hours: null, max_hours: null, min_hours: null },
      excretions: excretionStats,
      first_potty_date: firstPottyResult[0]?.first_potty_date || null,
      food_items: foodItems,
      fruit_items: fruitItems,
      not_eaten_food: notEatenFoodItems,
      not_eaten_fruit: notEatenFruitItems
    });
  } catch (err) {
    console.error('Food summary API error:', err);
    return serverError(err);
  }
}
