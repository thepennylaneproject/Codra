import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'src');
const buttonRegex = /<button\\b/;

function collectFiles(dir: string, results: string[] = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, results);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = collectFiles(ROOT);
const hits: { file: string; count: number }[] = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const match = content.match(new RegExp(buttonRegex, 'g'));
  if (match) {
    hits.push({ file, count: match.length });
  }
}

const total = hits.reduce((sum, hit) => sum + hit.count, 0);

const report = {
  totalButtons: total,
  files: hits,
};

const reportPath = path.resolve(process.cwd(), 'button-migration-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`Button migration report written to ${reportPath}`);
