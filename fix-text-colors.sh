#!/bin/bash

# Fix dark mode text contrast by replacing hardcoded gray colors with CSS variables

echo "Fixing text colors across all files..."

# Replace text-gray-900 (dark text) with text-foreground
find src/app -type f -name "*.tsx" -exec sed -i 's/text-gray-900/text-foreground/g' {} +

# Replace text-gray-800 with text-foreground
find src/app -type f -name "*.tsx" -exec sed -i 's/text-gray-800/text-foreground/g' {} +

# Replace text-gray-700 with text-foreground
find src/app -type f -name "*.tsx" -exec sed -i 's/text-gray-700/text-foreground/g' {} +

# Replace text-gray-600 (medium text) with text-muted-foreground
find src/app -type f -name "*.tsx" -exec sed -i 's/text-gray-600/text-muted-foreground/g' {} +

# Replace text-gray-500 with text-muted-foreground
find src/app -type f -name "*.tsx" -exec sed -i 's/text-gray-500/text-muted-foreground/g' {} +

# Replace text-gray-400 with text-muted-foreground
find src/app -type f -name "*.tsx" -exec sed -i 's/text-gray-400/text-muted-foreground/g' {} +

# Replace text-white with text-foreground (for light mode compatibility)
find src/app -type f -name "*.tsx" -exec sed -i 's/text-white\([^-]\)/text-foreground\1/g' {} +

# Replace text-black with text-foreground
find src/app -type f -name "*.tsx" -exec sed -i 's/text-black\([^-]\)/text-foreground\1/g' {} +

echo "✅ Text color fixes complete!"
echo "Files affected:"
grep -r "text-foreground\|text-muted-foreground" src/app --include="*.tsx" | wc -l

