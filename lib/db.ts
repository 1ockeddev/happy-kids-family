import { Pool, PoolClient } from 'pg';

// =============================
// Singleton Pool (Next.js hot-reload safe)
// =============================

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  // รองรับทั้ง DATABASE_URL และ config แยก
  if (process.env.DATABASE_URL) {
    // ตรวจสอบว่าเป็น Supabase และใช้ Pooler URL หรือไม่
    const isSupabase = process.env.DATABASE_URL.includes('supabase.co');
    const usePooler = process.env.DATABASE_URL.includes('pooler.supabase.com') || 
                      process.env.DATABASE_URL.includes(':6543');
    
    // สำหรับ Vercel + Supabase: ลด connection pool size
    const isProduction = process.env.NODE_ENV === 'production';
    const maxConnections = isProduction 
      ? (usePooler ? 10 : 2)  // Production: Pooler=10, Direct=2 เท่านั้น
      : 10; // Development: 10
    
    // ใน production ให้ปิด idle connections เร็วขึ้นเพื่อประหยัด connections
    const idleTimeout = isProduction ? 10000 : 30000; // 10 วินาที vs 30 วินาที
    
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: isSupabase ? { rejectUnauthorized: false } : false,
      max: maxConnections,
      min: 0, // ไม่มี minimum connections
      idleTimeoutMillis: idleTimeout,
      connectionTimeoutMillis: 5000,
      // Supabase Pooler ใช้ transaction mode
      ...(usePooler && {
        // ให้ pool ปิด connection ที่ไม่ได้ใช้เร็วขึ้น
        idleTimeoutMillis: 5000, // 5 วินาที สำหรับ pooler
        // ลด acquisition timeout
        connectionTimeoutMillis: 3000,
      })
    });
  }

  // Fallback: config แยก
  return new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    database: process.env.DB_NAME ?? 'kindergarten',
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'password',
    ssl: false,
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

// ใช้ global เพื่อไม่ให้สร้าง pool ใหม่ทุกครั้งที่ hot-reload
export const pool = global._pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  global._pgPool = pool;
}

// =============================
// Query Helper
// =============================

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

// Transaction helper
export async function transaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Health check
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export function getPool() { return pool; }
