const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'school_attendance',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '0000',
  });

  try {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();
    
    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, '../db/migrations/012_add_nap_note.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Running migration 012_add_nap_note...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added nap_note column to daily_report table');
    
    client.release();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
