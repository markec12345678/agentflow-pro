// Setup GSQLDB database for AgentFlow Pro
import { Client } from 'pg';

async function setupDatabase() {
  console.log('🔧 Setting up GSQLDB database...\n');
  
  // Try to connect with different passwords
  const passwords = ['', 'postgres', 'admin', 'password', 'Gauss@123', 'omm'];
  
  for (const password of passwords) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: password,
      database: 'postgres' // Connect to default database first
    });
    
    try {
      await client.connect();
      console.log(`✅ Connected with password: "${password || '(empty)'}"`);
      
      // Check if agentflow_local exists
      const result = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = 'agentflow_local'"
      );
      
      if (result.rows.length === 0) {
        console.log('📦 Creating database "agentflow_local"...');
        await client.query('CREATE DATABASE agentflow_local;');
        console.log('✅ Database created!');
      } else {
        console.log('ℹ️  Database "agentflow_local" already exists');
      }
      
      await client.end();
      
      console.log('\n✅ SUCCESS!');
      console.log('\nUpdate .env.local with:');
      console.log(`DATABASE_URL="postgresql://postgres:${password}@localhost:5432/agentflow_local?schema=public"`);
      
      return { success: true, password };
      
    } catch (error) {
      // Try next password
    }
  }
  
  console.log('❌ Could not connect with any password');
  console.log('\n💡 Please manually set the password in .env.local');
  console.log('Common GSQLDB passwords: postgres, admin, Gauss@123, omm, empty');
  
  return { success: false };
}

setupDatabase();
