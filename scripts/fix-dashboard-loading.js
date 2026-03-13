#!/usr/bin/env node

/**
 * Automated Dashboard Fix Script
 * Run this if dashboards aren't loading
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function exec(command) {
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    return true;
  } catch (error) {
    console.error(`Failed to execute: ${command}`);
    return false;
  }
}

async function main() {
  console.log('🔧 AgentFlow Pro - Dashboard Loading Fix\n');
  console.log('=' .repeat(60));
  
  // Step 1: Check .env file
  console.log('\n📝 Step 1: Checking environment variables...');
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found!');
    
    if (fs.existsSync(envExamplePath)) {
      const answer = await question('Create .env from .env.example? (y/n): ');
      if (answer.toLowerCase() === 'y') {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ Created .env file');
        console.log('📝 IMPORTANT: Edit .env and fill in required values:');
        console.log('   - DATABASE_URL');
        console.log('   - NEXTAUTH_SECRET');
        console.log('   - NEXTAUTH_URL');
      }
    } else {
      console.log('❌ .env.example also not found. Creating minimal .env...');
      const minimalEnv = `# Database - REQUIRED
DATABASE_URL="postgresql://postgres:password@localhost:5432/agentflow"

# Authentication - REQUIRED
NEXTAUTH_SECRET="${require('crypto').randomBytes(32).toString('base64')}"
NEXTAUTH_URL="http://localhost:3002"

# Mock mode for development
MOCK_MODE="true"
`;
      fs.writeFileSync(envPath, minimalEnv);
      console.log('✅ Created minimal .env with mock settings');
    }
  } else {
    console.log('✅ .env file exists');
    
    // Check critical variables
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
    
    for (const variable of requiredVars) {
      if (!envContent.includes(variable + '=')) {
        console.warn(`⚠️  Missing ${variable} in .env`);
      } else if (envContent.match(new RegExp(`${variable}=""`))) {
        console.warn(`⚠️  ${variable} is empty in .env`);
      }
    }
  }
  
  // Step 2: Check Node.js version
  console.log('\n📝 Step 2: Checking Node.js version...');
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    console.log(`✅ Node.js version: ${nodeVersion}`);
    
    const majorVersion = parseInt(nodeVersion.slice(1));
    if (majorVersion < 18) {
      console.warn('⚠️  Node.js 18+ recommended. Current version may cause issues.');
    }
  } catch (error) {
    console.error('❌ Failed to check Node.js version');
  }
  
  // Step 3: Install dependencies
  console.log('\n📝 Step 3: Installing dependencies...');
  const installAnswer = await question('Run npm install? (skips if node_modules exists) (y/n): ');
  
  if (installAnswer.toLowerCase() === 'y' || !fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log('Running npm install...');
    exec('npm install');
  } else {
    console.log('⏭️  Skipping npm install');
  }
  
  // Step 4: Generate Prisma client
  console.log('\n📝 Step 4: Generating Prisma client...');
  console.log('Running npm run db:generate...');
  exec('npm run db:generate');
  
  // Step 5: Database setup
  console.log('\n📝 Step 5: Database configuration...');
  const dbAnswer = await question('Run database migrations? (y/n): ');
  
  if (dbAnswer.toLowerCase() === 'y') {
    console.log('Checking database connection...');
    
    // Try to check database
    try {
      execSync('node scripts/check-database.js', { stdio: 'pipe' });
      console.log('✅ Database connection successful');
      
      const migrateAnswer = await question('Apply migrations to database? (y/n): ');
      if (migrateAnswer.toLowerCase() === 'y') {
        console.log('Running migrations...');
        exec('npm run db:migrate');
        
        const seedAnswer = await question('Seed database with test data? (recommended for dev) (y/n): ');
        if (seedAnswer.toLowerCase() === 'y') {
          console.log('Seeding database...');
          exec('npm run db:seed');
        }
      }
    } catch (error) {
      console.error('❌ Database connection failed!');
      console.log('\n📚 Database setup instructions:');
      console.log('1. Install PostgreSQL locally OR use Supabase (https://supabase.com)');
      console.log('2. Create database: agentflow');
      console.log('3. Update DATABASE_URL in .env');
      console.log('\nExample DATABASE_URL:');
      console.log('  Local: postgresql://postgres:password@localhost:5432/agentflow');
      console.log('  Supabase: postgresql://postgres.[ref]:[pass]@[host]:6543/postgres?pgbouncer=true');
      console.log('\n⚠️  Skipping migrations until database is configured');
    }
  } else {
    console.log('⏭️  Skipping database setup');
  }
  
  // Step 6: Clean build
  console.log('\n📝 Step 6: Cleaning build cache...');
  const cleanAnswer = await question('Clean Next.js cache? (recommended if having issues) (y/n): ');
  
  if (cleanAnswer.toLowerCase() === 'y') {
    console.log('Removing .next and cache directories...');
    try {
      if (fs.existsSync('.next')) {
        fs.rmSync('.next', { recursive: true, force: true });
        console.log('✅ Removed .next directory');
      }
      if (fs.existsSync('node_modules/.cache')) {
        fs.rmSync('node_modules/.cache', { recursive: true, force: true });
        console.log('✅ Removed cache directory');
      }
    } catch (error) {
      console.warn('⚠️  Failed to clean cache. You can manually delete .next folder');
    }
  }
  
  // Step 7: Start server
  console.log('\n📝 Step 7: Starting development server...');
  console.log('\n✅ Setup complete! Starting dev server...');
  console.log('\n🌐 Server will be available at: http://localhost:3002');
  console.log('📊 Dashboard: http://localhost:3002/dashboard');
  console.log('🏨 Tourism: http://localhost:3002/dashboard/tourism');
  console.log('🛎️  Receptor: http://localhost:3002/dashboard/receptor');
  console.log('\nPress Ctrl+C to stop the server\n');
  
  const startAnswer = await question('Start dev server now? (y/n): ');
  if (startAnswer.toLowerCase() === 'y') {
    exec('npm run dev');
  } else {
    console.log('\n👋 To start server later, run: npm run dev');
  }
  
  rl.close();
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
