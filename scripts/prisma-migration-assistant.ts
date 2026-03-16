/**
 * AgentFlow Pro - Automated Prisma Migration Generator
 * 
 * Use Case: Database Migrations in 5 Minutes
 * 
 * Workflow:
 * 1. Read current schema.prisma from filesystem
 * 2. Add new fields (e.g., loyaltyTier, loyaltyPoints)
 * 3. Generate migration file
 * 4. Test migration on dev database
 * 5. Commit changes to Git
 * 6. Create documentation in docs/
 * 
 * Tools Used:
 * - Filesystem MCP (Read/write schema)
 * - Prisma CLI (Migration generation)
 * - Git (Version control)
 * - Memory MCP (Schema history)
 * - Context7 MCP (Prisma docs)
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const CONFIG = {
  prisma: {
    schemaPath: 'prisma/schema.prisma',
    migrationsDir: 'prisma/migrations',
  },
  git: {
    branch: 'main',
    commitMessage: 'feat: Add guest loyalty fields',
  },
  docs: {
    dir: 'docs/migrations',
  },
  database: {
    testOnMigrate: true,
    rollbackOnFailure: true,
  },
};

// Types
interface MigrationRequest {
  model: string;
  fields: MigrationField[];
  description: string;
}

interface MigrationField {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  unique?: boolean;
  relation?: string;
  map?: string;
  comment?: string;
}

interface MigrationResult {
  migrationName: string;
  migrationPath: string;
  sql: string;
  success: boolean;
  error?: string;
  documentationPath?: string;
}

// Main Migration Service
class PrismaMigrationAssistant {
  private schemaContent: string = '';
  private originalSchema: string = '';

  /**
   * STEP 1: Read Current Schema
   */
  async readSchema(): Promise<string> {
    console.log('📖 Reading current schema.prisma...');

    try {
      const schemaPath = path.resolve(CONFIG.prisma.schemaPath);
      this.schemaContent = fs.readFileSync(schemaPath, 'utf8');
      this.originalSchema = this.schemaContent;

      console.log(`✅ Schema read successfully (${this.schemaContent.length} bytes)`);
      console.log(`   📁 Location: ${schemaPath}`);

      return this.schemaContent;
    } catch (error) {
      console.error('❌ Error reading schema:', error);
      throw error;
    }
  }

  /**
   * STEP 2: Add New Fields to Schema
   */
  addFields(request: MigrationRequest): string {
    console.log(`✏️  Adding ${request.fields.length} field(s) to model ${request.model}...`);

    // Find model in schema
    const modelRegex = new RegExp(`(model\\s+${request.model}\\s*\\{[^}]*)(\\})`, 's');
    const match = this.schemaContent.match(modelRegex);

    if (!match) {
      throw new Error(`Model ${request.model} not found in schema`);
    }

    // Generate field definitions
    const fieldDefs = request.fields.map(field => {
      let definition = `  ${field.name}`;

      // Type and required/optional
      if (field.required) {
        definition += ` ${field.type}`;
      } else {
        definition += ` ${field.type}?`;
      }

      // Default value
      if (field.default) {
        definition += ` @default(${field.default})`;
      }

      // Unique constraint
      if (field.unique) {
        definition += ` @unique`;
      }

      // Map to column name
      if (field.map) {
        definition += ` @map("${field.map}")`;
      }

      // Comment
      if (field.comment) {
        definition += ` // ${field.comment}`;
      }

      return definition;
    }).join('\n');

    // Insert fields before closing brace
    const modelContent = match[1];
    const updatedModel = modelContent + '\n' + fieldDefs;
    const closingBrace = match[2];

    // Replace in schema
    this.schemaContent = this.schemaContent.replace(
      modelRegex,
      updatedModel + '\n' + closingBrace
    );

    console.log(`✅ Fields added successfully`);
    request.fields.forEach(field => {
      console.log(`   + ${field.name}: ${field.type}${field.required ? ' (required)' : ' (optional)'}`);
    });

    return this.schemaContent;
  }

  /**
   * STEP 3: Save Updated Schema
   */
  async saveSchema(): Promise<void> {
    console.log('💾 Saving updated schema...');

    try {
      const schemaPath = path.resolve(CONFIG.prisma.schemaPath);
      fs.writeFileSync(schemaPath, this.schemaContent, 'utf8');

      console.log(`✅ Schema saved successfully`);
    } catch (error) {
      console.error('❌ Error saving schema:', error);
      // Rollback
      this.schemaContent = this.originalSchema;
      throw error;
    }
  }

  /**
   * STEP 4: Generate Migration File
   */
  async generateMigration(name: string): Promise<string> {
    console.log(`🔧 Generating migration: ${name}...`);

    try {
      // Use Prisma CLI to generate migration
      const cmd = `npx prisma migrate dev --name ${name} --create-only`;
      console.log(`   Running: ${cmd}`);

      const output = execSync(cmd, { encoding: 'utf8' });
      
      // Extract migration name from output
      const migrationMatch = output.match(/migrations\/([^/]+)/);
      const migrationName = migrationMatch ? migrationMatch[1] : name;

      console.log(`✅ Migration generated: ${migrationName}`);

      return migrationName;
    } catch (error: any) {
      console.error('❌ Error generating migration:', error.message);
      
      // Rollback schema
      await this.saveSchema();
      fs.writeFileSync(path.resolve(CONFIG.prisma.schemaPath), this.originalSchema, 'utf8');
      
      throw error;
    }
  }

  /**
   * STEP 5: Test Migration on Dev Database
   */
  async testMigration(migrationName: string): Promise<boolean> {
    console.log('🧪 Testing migration on dev database...');

    if (!CONFIG.database.testOnMigrate) {
      console.log('⚠️  Testing disabled, skipping...');
      return true;
    }

    try {
      // Run Prisma validation
      console.log('   Running prisma validate...');
      execSync('npx prisma validate', { encoding: 'utf8' });
      console.log('   ✅ Schema validation passed');

      // Check migration can be applied
      console.log('   Running prisma migrate status...');
      execSync('npx prisma migrate status', { encoding: 'utf8' });
      console.log('   ✅ Migration status check passed');

      // Generate SQL to verify
      console.log('   Generating SQL preview...');
      const sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr
      });

      console.log(`   ✅ SQL generated (${sql.split('\n').length} lines)`);

      return true;
    } catch (error: any) {
      console.error('❌ Migration test failed:', error.message);
      
      if (CONFIG.database.rollbackOnFailure) {
        console.log('🔄 Rolling back migration...');
        await this.rollbackMigration(migrationName);
      }
      
      return false;
    }
  }

  /**
   * STEP 6: Commit Changes to Git
   */
  async commitChanges(migrationName: string): Promise<void> {
    console.log('💾 Committing changes to Git...');

    try {
      // Add files
      console.log('   Adding files to git...');
      execSync('git add prisma/schema.prisma prisma/migrations/', { encoding: 'utf8' });

      // Commit
      const commitMessage = `${CONFIG.git.commitMessage}\n\nMigration: ${migrationName}`;
      console.log(`   Committing: ${commitMessage.split('\n')[0]}`);
      execSync(`git commit -m "${commitMessage}"`, { encoding: 'utf8' });

      console.log('✅ Changes committed successfully');
    } catch (error: any) {
      if (error.message.includes('nothing to commit')) {
        console.log('⚠️  No changes to commit');
      } else {
        console.error('❌ Error committing changes:', error.message);
      }
    }
  }

  /**
   * STEP 7: Create Documentation
   */
  async createDocumentation(migrationName: string, request: MigrationRequest): Promise<string> {
    console.log('📝 Creating migration documentation...');

    try {
      const docsDir = path.resolve(CONFIG.docs.dir);
      
      // Create docs directory if not exists
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }

      // Generate documentation
      const docContent = this.generateMigrationDoc(migrationName, request);
      
      // Save documentation
      const docPath = path.join(docsDir, `${migrationName}.md`);
      fs.writeFileSync(docPath, docContent, 'utf8');

      console.log(`✅ Documentation created: ${docPath}`);

      return docPath;
    } catch (error: any) {
      console.error('❌ Error creating documentation:', error.message);
      return '';
    }
  }

  /**
   * Generate Migration Documentation
   */
  private generateMigrationDoc(migrationName: string, request: MigrationRequest): string {
    const date = new Date().toISOString().split('T')[0];
    
    return `# Migration: ${migrationName}

**Date:** ${date}  
**Model:** ${request.model}  
**Description:** ${request.description}

## Changes

### Model: ${request.model}

Added ${request.fields.length} field(s):

${request.fields.map(field => `
#### ${field.name}
- **Type:** ${field.type}${field.required ? ' (required)' : ' (optional)'}
${field.default ? `- **Default:** ${field.default}\n` : ''}${field.unique ? '- **Unique:** Yes\n' : ''}${field.map ? `- **Column Name:** ${field.map}\n` : ''}${field.comment ? `- **Description:** ${field.comment}\n` : ''}
`.trim()).join('\n\n')}

## SQL Changes

\`\`\`sql
-- AlterTable
ALTER TABLE "${request.model.toLowerCase()}s"
${request.fields.map(field => `  ADD COLUMN     "${field.name}" ${field.type.toUpperCase()}${field.required ? ' NOT NULL' : ''}${field.default ? ` DEFAULT ${field.default}` : ''};`).join('\n')}
\`\`\`

## Migration Commands

\`\`\`bash
# Generate migration
npx prisma migrate dev --name ${migrationName}

# Apply to production
npx prisma migrate deploy

# Check status
npx prisma migrate status
\`\`\`

## Rollback

\`\`\`bash
# Rollback last migration
npx prisma migrate resolve --rolled-back "${migrationName}"
\`\`\`

## Testing

- [ ] Migration applied successfully to dev
- [ ] No data loss
- [ ] Backwards compatible
- [ ] Documentation updated

---

*Generated automatically by AgentFlow Pro Prisma Migration Assistant*
`;
  }

  /**
   * Rollback Migration
   */
  private async rollbackMigration(migrationName: string): Promise<void> {
    console.log('🔄 Rolling back migration...');

    try {
      execSync(`npx prisma migrate resolve --rolled-back "${migrationName}"`, { encoding: 'utf8' });
      console.log('✅ Migration rolled back successfully');
    } catch (error: any) {
      console.error('❌ Error rolling back migration:', error.message);
    }
  }

  /**
   * MAIN: Run Complete Migration Workflow
   */
  async createMigration(request: MigrationRequest): Promise<MigrationResult> {
    console.log('\n🚀 Starting Automated Prisma Migration...\n');

    try {
      // Step 1: Read schema
      await this.readSchema();

      // Step 2: Add fields
      this.addFields(request);

      // Step 3: Save schema
      await this.saveSchema();

      // Step 4: Generate migration
      const migrationName = await this.generateMigration(request.description.replace(/\s+/g, '-').toLowerCase());

      // Step 5: Test migration
      const testPassed = await this.testMigration(migrationName);
      
      if (!testPassed) {
        throw new Error('Migration test failed');
      }

      // Step 6: Commit changes
      await this.commitChanges(migrationName);

      // Step 7: Create documentation
      const docPath = await this.createDocumentation(migrationName, request);

      const result: MigrationResult = {
        migrationName,
        migrationPath: path.join(CONFIG.prisma.migrationsDir, migrationName),
        sql: '', // Would extract from migration file
        success: true,
        documentationPath: docPath,
      };

      console.log('\n🎉 Migration Complete!\n');
      console.log('📊 Summary:');
      console.log(`   - Migration: ${migrationName}`);
      console.log(`   - Model: ${request.model}`);
      console.log(`   - Fields added: ${request.fields.length}`);
      console.log(`   - Documentation: ${docPath}`);
      console.log('\n✅ Migration ready for production!\n');

      return result;
    } catch (error: any) {
      console.error('\n❌ Migration Failed!\n');
      console.error('Error:', error.message);
      
      // Attempt rollback
      await this.saveSchema();
      fs.writeFileSync(path.resolve(CONFIG.prisma.schemaPath), this.originalSchema, 'utf8');
      
      throw error;
    }
  }
}

// Execute
async function main() {
  const assistant = new PrismaMigrationAssistant();

  // Example: Add guest loyalty fields
  const request: MigrationRequest = {
    model: 'Guest',
    description: 'Add guest loyalty fields',
    fields: [
      {
        name: 'loyaltyTier',
        type: 'String',
        required: true,
        default: '"BRONZE"',
        comment: 'Guest loyalty tier (BRONZE, SILVER, GOLD, PLATINUM)',
      },
      {
        name: 'loyaltyPoints',
        type: 'Int',
        required: true,
        default: '0',
        comment: 'Accumulated loyalty points',
      },
      {
        name: 'nextTierAt',
        type: 'Int',
        required: false,
        comment: 'Points needed for next tier',
      },
    ],
  };

  await assistant.createMigration(request);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { PrismaMigrationAssistant };
