/**
 * Script to find and replace console.log statements with proper logger
 * 
 * Usage: node scripts/remove-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');
const EXCLUDE_DIRS = ['node_modules', '.next', 'dist', 'build'];

// Logger import to add
const LOGGER_IMPORT = "import { logger } from '@/infrastructure/observability/logger';";

// Patterns to find
const CONSOLE_PATTERNS = [
  /console\.log\(/g,
  /console\.error\(/g,
  /console\.warn\(/g,
  /console\.debug\(/g,
  /console\.info\(/g,
];

// Replacement patterns
const REPLACEMENTS = {
  'console.log(': 'logger.info(',
  'console.error(': 'logger.error(',
  'console.warn(': 'logger.warn(',
  'console.debug(': 'logger.debug(',
  'console.info(': 'logger.info(',
};

let filesScanned = 0;
let filesModified = 0;
let totalReplacements = 0;

function shouldExclude(dirPath) {
  return EXCLUDE_DIRS.some(exclude => dirPath.includes(exclude));
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fileReplacements = 0;
    
    // Check for console statements
    CONSOLE_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        const consoleType = Object.keys(REPLACEMENTS)[index];
        const replacement = REPLACEMENTS[consoleType];
        
        // Count replacements
        fileReplacements += matches.length;
        
        // Replace
        content = content.replace(new RegExp(consoleType.replace(/[()]/g, '\\$&'), 'g'), replacement);
        modified = true;
      }
    });
    
    // Add logger import if needed
    if (modified && !content.includes("from '@/infrastructure/observability/logger'")) {
      // Find import section and add logger import
      const importMatch = content.match(/import\s+.*?from\s+['"].*?['"];?\n/);
      if (importMatch) {
        const insertPos = importMatch.index + importMatch[0].length;
        content = content.slice(0, insertPos) + LOGGER_IMPORT + '\n' + content.slice(insertPos);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      filesModified++;
      totalReplacements += fileReplacements;
      console.log(`✓ Modified: ${filePath} (${fileReplacements} replacements)`);
    }
    
    filesScanned++;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

function walkDir(dir) {
  if (shouldExclude(dir)) return;
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        processFile(filePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

console.log('🔍 Scanning for console.log statements...\n');

walkDir(SRC_DIR);

console.log('\n' + '='.repeat(60));
console.log('✅ Summary:');
console.log(`   Files scanned: ${filesScanned}`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log('='.repeat(60));

if (filesModified > 0) {
  console.log('\n💡 Next steps:');
  console.log('   1. Run: npm run lint');
  console.log('   2. Run: npm run test');
  console.log('   3. Review changes with: git diff');
}
