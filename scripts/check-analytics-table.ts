import { query } from '../lib/db';

async function checkTable() {
  try {
    console.log('Checking if user_analytics table exists...');
    
    const result = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_analytics'
      );
    `);
    
    const exists = result[0]?.exists;
    console.log('Table exists:', exists);
    
    if (exists) {
      const count = await query('SELECT COUNT(*) FROM user_analytics');
      console.log('Row count:', count[0].count);
      
      const sample = await query('SELECT * FROM user_analytics LIMIT 5');
      console.log('Sample data:', sample);
    } else {
      console.log('❌ Table does not exist! Run migration:');
      console.log('   psql $DATABASE_URL -f db/migrations/011_create_user_analytics.sql');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTable();
