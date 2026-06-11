const { Pool } = require('pg');

async function verifyTable() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'school_attendance',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '0000',
  });

  try {
    console.log('🔍 Checking user_analytics table...');
    const client = await pool.connect();
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_analytics'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Table user_analytics exists');
      
      // Check columns
      const columns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_analytics'
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Columns:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
      
      // Check indexes
      const indexes = await client.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'user_analytics';
      `);
      
      console.log('\n🔑 Indexes:');
      indexes.rows.forEach(idx => {
        console.log(`  - ${idx.indexname}`);
      });
      
      console.log('\n✨ Analytics system is ready!');
    } else {
      console.log('❌ Table user_analytics does not exist');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

verifyTable();
