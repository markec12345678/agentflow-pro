// Create database using trust auth
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function main() {
  console.log('🔧 Creating database with trust auth...\n');
  
  try {
    // First check if postgres is running
    console.log('Checking PostgreSQL...');
    const { stdout: readyOut } = await execAsync('pg_isready -h localhost -p 5432');
    console.log(readyOut);
    
    // Try to create database
    console.log('Creating database "agentflow"...');
    try {
      const { stdout } = await execAsync(
        'psql -U postgres -h localhost -c "CREATE DATABASE agentflow;"'
      );
      console.log('✅', stdout);
    } catch (e) {
      const err = e;
      if (err.message.includes('already exists')) {
        console.log('ℹ️  Database already exists');
      } else {
        throw e;
      }
    }
    
    // List databases
    console.log('\nListing databases:');
    const { stdout: dbs } = await execAsync(
      'psql -U postgres -h localhost -c "\\l"'
    );
    console.log(dbs);
    
    console.log('\n✅ SUCCESS!');
    console.log('DATABASE_URL="postgresql://postgres@localhost:5432/agentflow?connection_limit=20&connect_timeout=15"');
    
  } catch (error) {
    const err = error;
    console.log('❌ Error:', err.message);
    console.log('\n💡 Try:');
    console.log('1. Check if PostgreSQL service is running');
    console.log('2. Check pg_hba.conf for trust authentication');
  }
}

main();
