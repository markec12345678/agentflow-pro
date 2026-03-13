// Check postgres connection using Windows auth
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkPostgres() {
  console.log('🔍 Checking PostgreSQL...\n');
  
  try {
    // Try to connect using psql with no password (Windows auth)
    const { stdout, stderr } = await execAsync(
      'psql -U postgres -h localhost -c "SELECT version();" 2>&1'
    );
    
    console.log('✅ Connected via Windows Auth!');
    console.log(stdout);
    
    // Create database
    try {
      await execAsync('psql -U postgres -h localhost -c "CREATE DATABASE agentflow;" 2>&1');
      console.log('✅ Created database "agentflow"');
    } catch (e) {
      const err = e;
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Database "agentflow" already exists');
      } else {
        throw e;
      }
    }
    
    console.log('\n✅ SUCCESS!');
    console.log('Update .env.local with:');
    console.log('DATABASE_URL="postgresql://postgres@localhost:5432/agentflow?connection_limit=20&connect_timeout=15"');
    
  } catch (error) {
    const err = error;
    console.log('❌ Connection failed');
    console.log('Error:', err.message);
    console.log('\n💡 Try these:');
    console.log('1. Set PGPASSWORD environment variable');
    console.log('2. Edit pg_hba.conf to use "trust" for localhost');
    console.log('3. Reset password: psql -U postgres -c "ALTER USER postgres WITH PASSWORD \'newpass\';"');
  }
}

checkPostgres();
