const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.html') || file.endsWith('.md')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');

let changedCount = 0;

files.forEach(f => {
  if (f.includes('node_modules') || f.includes('.git') || f.includes('dist')) return;

  let original = fs.readFileSync(f, 'utf8');
  let content = original;

  content = content.replace(/Meridian/g, 'Promptcraft');
  content = content.replace(/meridian/g, 'promptcraft');

  if (original !== content) {
    fs.writeFileSync(f, content);
    console.log('Renamed in:', f);
    changedCount++;
  }
});

console.log(`Done. Updated ${changedCount} files.`);
