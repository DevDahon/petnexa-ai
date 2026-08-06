const fs = require('fs');
const path = require('path');

function replaceWhite(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Add useAppPalette if missing and palette is not imported
  // For files that need dynamic palette injection
  if (filePath.includes('ui.tsx')) {
    // In ui.tsx, we can just replace #fff with palette.card. But ui.tsx uses static palette.
    // Wait, ui.tsx doesn't have useAppPalette in every function.
    content = content.replace(/backgroundColor:\s*["']#(fff|ffffff)["']/gi, 'backgroundColor: palette.card');
  } else if (filePath.includes('owner-onboarding.tsx')) {
    content = content.replace(/backgroundColor:\s*["']#(fff|ffffff)["']/gi, 'backgroundColor: pal.card');
  } else if (filePath.includes('onboarding-tutorial.tsx')) {
    content = content.replace(/backgroundColor:\s*["']#(fff|ffffff)["']/gi, 'backgroundColor: palette.card');
  } else if (filePath.includes('map.tsx')) {
    content = content.replace(/backgroundColor:\s*["']#(fff|ffffff)["']/gi, 'backgroundColor: palette.card');
  } else if (filePath.includes('_layout.tsx')) {
    content = content.replace(/backgroundColor:\s*["']#(fff|ffffff)["']/gi, 'backgroundColor: palette.background');
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched ${filePath}`);
  }
}

const files = [
  'components/ui.tsx',
  'components/owner-onboarding.tsx',
  'components/onboarding-tutorial.tsx',
  'app/(tabs)/map.tsx',
  'app/(tabs)/_layout.tsx',
];

files.forEach(f => replaceWhite(path.join(__dirname, f)));
