// Test GSQLDB connection
import { Client } from 'pg';

async function testConnection() {
  console.log('🔍 Testing GSQLDB connection...\n');
  
  // Try different combinations
  const configs = [
    { user: 'postgres', password: '', database: 'agentflow' },
    { user: 'postgres', password: 'postgres', database: 'agentflow' },
    { user: 'admin', password: '', database: 'agentflow' },
    { user: 'admin', password: 'admin', database: 'agentflow' },
    { user: 'root', password: '', database: 'agentflow' },
    { user: 'omm', password: '', database: 'agentflow' }, // GaussDB default user
    { user: 'omm', password: 'Gauss@123', database: 'agentflow' }, // GaussDB default password
  ];
  
  for (const config of configs) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      ...config
    });
    
    try {
      await client.connect();
      console.log(`✅ SUCCESS! user="${config.user}", password="${config.password || '(empty)'}"`);
      
      // List databases
      const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
      console.log('\nDatabases:');
      dbs.rows.forEach(row => console.log(`  - ${row.datname}`));
      
      await client.end();
      return config;
    } catch (error) {
      console.log(`❌ Failed: user="${config.user}", password="${config.password || '(empty)'}"`);
    }
  }
  
  console.log('\n❌ No combination worked!');
  console.log('\n💡 Please provide:');
  console.log('1. GSQLDB username');
  console.log('2. GSQLDB password');
  console.log('3. Database name for AgentFlow');
  
  return null;
}

testConnection();
