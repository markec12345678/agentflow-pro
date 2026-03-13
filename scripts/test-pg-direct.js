// Direct PostgreSQL connection test
import { Client } from 'pg';

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  
  // Try with current system environment
  const config = {
    host: 'localhost',
    port: 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: 'postgres'
  };
  
  console.log('Config:', {
    ...config,
    password: config.password ? '***' : '(empty)'
  });
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('\n✅ Connected successfully!');
    
    // List databases
    const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false");
    console.log('\nDatabases:');
    dbs.rows.forEach(row => console.log(`  - ${row.datname}`));
    
    // Create agentflow if not exists
    const exists = dbs.rows.some(r => r.datname === 'agentflow');
    if (!exists) {
      await client.query('CREATE DATABASE agentflow');
      console.log('\n✅ Created database "agentflow"');
    } else {
      console.log('\nℹ️  Database "agentflow" already exists');
    }
    
    await client.end();
    
    console.log('\n✅ SUCCESS! Update .env.local:');
    const pwd = process.env.PGPASSWORD || '';
    console.log(`DATABASE_URL="postgresql://${config.user}:${pwd}@localhost:5432/agentflow?connection_limit=20&connect_timeout=15"`);
    
  } catch (error) {
    console.log('\n❌ Connection failed');
    console.log('Error:', error.message);
    
    if (error.message.includes('password')) {
      console.log('\n💡 Password authentication failed.');
      console.log('Set PGPASSWORD environment variable or edit .env.local');
    }
  }
}

testConnection();
