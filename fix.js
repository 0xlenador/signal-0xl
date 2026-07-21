const fs = require('fs');

const legacyCss = fs.readFileSync('_legacy/css/style.css', 'utf-8');
const globalsTop = fs.readFileSync('src/app/globals.css', 'utf-8').split('/* ════════════════════════════════════════════════════════════════════════════')[0];

const modifiedLegacyCss = legacyCss.replace(
  `  --font:              'Outfit', system-ui, -apple-system, sans-serif;
  --font-mono:         'Space Grotesk', ui-monospace, monospace;`,
  `  --font:              var(--font-outfit), system-ui, -apple-system, sans-serif;
  --font-mono:         var(--font-space-grotesk), ui-monospace, monospace;`
);

fs.writeFileSync('src/app/globals.css', globalsTop + modifiedLegacyCss);
console.log('globals.css fixed successfully!');
