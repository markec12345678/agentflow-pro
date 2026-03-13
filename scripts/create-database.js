// Create database if not exists
import { Client } from 'pg';

async function createDatabase() {
  // Connect to default 'postgres' database first
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'agentflow'"
    );

    if (result.rows.length === 0) {
      // Create database
      await client.query('CREATE DATABASE agentflow');
      console.log('✅ Database "agentflow" created');
    } else {
      console.log('ℹ️  Database "agentflow" already exists');
    }

    // Grant privileges
    await client.query('GRANT ALL PRIVILEGES ON DATABASE agentflow TO postgres');
    console.log('✅ Privileges granted');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
