const fs = require('fs');
const path = require('path');

// Patterns to fix
const fixes = [
  // Replace bg-white with bg-card (unless it has dark: variant already)
  {
    pattern: /className="([^"]*)\bbg-white\b(?!\s+dark:)([^"]*)"/g,
    replace: (match, before, after) => {
      return `className="${before}bg-card${after}"`;
    }
  },
  // Replace bg-white dark:bg-gray-XXX with just bg-card
  {
    pattern: /className="([^"]*)\bbg-white\s+dark:bg-gray-\d+([^"]*)"/g,
    replace: (match, before, after) => {
      return `className="${before}bg-card${after}"`;
    }
  },
  // Replace text-gray-900 with text-foreground (unless it has dark: variant)
  {
    pattern: /className="([^"]*)\btext-gray-900\b(?!\s+dark:)([^"]*)"/g,
    replace: (match, before, after) => {
      return `className="${before}text-foreground${after}"`;
    }
  },
  // Replace text-black with text-foreground
  {
    pattern: /className="([^"]*)\btext-black\b([^"]*)"/g,
    replace: (match, before, after) => {
      return `className="${before}text-foreground${after}"`;
    }
  },
  // Replace border-gray-200 with border-border (unless it has dark: variant)
  {
    pattern: /className="([^"]*)\bborder-gray-200\b(?!\s+dark:)([^"]*)"/g,
    replace: (match, before, after) => {
      return `className="${before}border-border${after}"`;
    }
  }
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  fixes.forEach(fix => {
    const newContent = content.replace(fix.pattern, fix.replace);
    if (newContent !== content) {
      modified = true;
      content = newContent;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed:', filePath);
    return true;
  }
  
  return false;
}

function walkDir(dir, fileCallback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath, fileCallback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileCallback(filePath);
    }
  });
}

console.log('🔧 Fixing dark mode issues...\n');

let fixedCount = 0;
const srcDir = path.join(__dirname, 'src');

walkDir(srcDir, (filePath) => {
  if (processFile(filePath)) {
    fixedCount++;
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
