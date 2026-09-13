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
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(f => {
  let original = fs.readFileSync(f, 'utf8');
  let content = original;

  // These are the common corrupted characters from the original codebase
  // " ?" -> " —"
  // "?" -> "—"
  // "?" -> "•"
  // "A" -> "·"
  // "Ac " -> "© "

  content = content.replace(/\?"/g, '—');
  content = content.replace(/\?'/g, '’');
  content = content.replace(/\?/g, '—');
  content = content.replace(/\?/g, '•');
  content = content.replace(/A/g, '·');
  content = content.replace(/Ac /g, '© ');
  
  if (original !== content) {
    fs.writeFileSync(f, content);
    console.log('Fixed:', f);
    changedCount++;
  }
});

console.log(`Done. Fixed ${changedCount} files.`);
