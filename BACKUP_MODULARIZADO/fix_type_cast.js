const fs = require('fs');
const content = fs.readFileSync('src/main/main.ts', 'utf8');

// Add type casting to the result.push line
const fixed = content.replace(
    'results.push(result);',
    'results.push(result as { file: string; success: boolean; outputPath: string | null; error?: string });'
);

fs.writeFileSync('src/main/main.ts', fixed, 'utf8');
console.log('Fixed type casting');
