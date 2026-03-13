// Test PostgreSQL connection with all combinations
import { Client } from 'pg';

const users = ['postgres', 'admin', 'klemen', 'Administrator'];
const passwords = ['2225', '27081977', 'Klemen1111111@', '', 'postgres', 'admin'];

async function tryConnect(user, password) {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: user,
    password: password,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log(`✅ Connected: user="${user}", password="${password || '(empty)'}"`);
    
    // Create agentflow database
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = 'agentflow'");
    if (exists.rows.length === 0) {
      await client.query('CREATE DATABASE agentflow');
      console.log('✅ Created database "agentflow"');
    }
    
    await client.end();
    return { user, password };
  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('🔍 Testing all PostgreSQL user/password combinations...\n');
  
  for (const user of users) {
    for (const pwd of passwords) {
      const result = await tryConnect(user, pwd);
      if (result) {
        console.log('\n✅ SUCCESS!');
        console.log(`Update .env.local with:`);
        console.log(`DATABASE_URL="postgresql://${result.user}:${result.password}@localhost:5432/agentflow?connection_limit=20&connect_timeout=15"`);
        return;
      }
    }
  }
  
  console.log('\n❌ No combination worked.');
  console.log('\n💡 Try these alternatives:');
  console.log('1. Check pg_hba.conf for authentication settings');
  console.log('2. Use: psql -U postgres -c "\\du" to list users');
  console.log('3. Reset password: ALTER USER postgres WITH PASSWORD \'newpass\';');
}

main();
