// List GSQLDB databases
import { Client } from 'pg';

async function listDatabases() {
  console.log('🔍 Listing GSQLDB databases...\n');
  
  // Try without username/password (trust auth)
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres' // Default database
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to GSQLDB!\n');
    
    // List all databases
    const result = await client.query(
      "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;"
    );
    
    console.log('Databases:');
    result.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. ${row.datname}`);
    });
    
    await client.end();
    
    // Check if agentflow exists
    const hasAgentflow = result.rows.some(r => r.datname.toLowerCase().includes('agentflow'));
    if (!hasAgentflow) {
      console.log('\n⚠️  Database "agentflow" does not exist!');
      console.log('Creating it now...');
      
      const client2 = new Client({
        host: 'localhost',
        port: 5432,
        database: 'postgres'
      });
      
      await client2.connect();
      await client2.query('CREATE DATABASE agentflow;');
      await client2.end();
      
      console.log('✅ Database "agentflow" created!');
    } else {
      console.log('\n✅ Database "agentflow" already exists!');
    }
    
    console.log('\n✅ Update .env.local:');
    console.log('DATABASE_URL="postgresql://localhost:5432/agentflow?connection_limit=20&connect_timeout=15"');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n💡 Try:');
    console.log('1. Check if GSQLDB is running');
    console.log('2. Check connection port (might not be 5432)');
    console.log('3. Try different default database name');
  }
}

listDatabases();
