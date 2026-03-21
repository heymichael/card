import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['src'];
const TARGET_FILES = [];
const SCAN_EXTENSIONS = new Set(['.css', '.ts', '.tsx', '.html']);
const IGNORE_FILES = new Set([
  path.normalize('src/theme/colors.ts'),
  path.normalize('src/index.css'),
]);

const COLOR_LITERAL_PATTERN = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*[^)]+\)/g;

async function walk(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;
    if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineForIndex(text, index) {
  return text.slice(0, index).split('\n').length;
}

async function collectTargets() {
  const collected = [];
  for (const dir of TARGET_DIRS) {
    const fullDir = path.join(ROOT, dir);
    collected.push(...(await walk(fullDir)));
  }
  for (const relFile of TARGET_FILES) {
    collected.push(path.join(ROOT, relFile));
  }
  return collected;
}

async function main() {
  const files = await collectTargets();
  const violations = [];

  for (const filePath of files) {
    const relPath = path.normalize(path.relative(ROOT, filePath));
    if (IGNORE_FILES.has(relPath)) continue;
    const content = await readFile(filePath, 'utf8');
    const matches = content.matchAll(COLOR_LITERAL_PATTERN);
    for (const match of matches) {
      const literal = match[0];
      const index = match.index ?? 0;
      violations.push({
        file: relPath,
        line: lineForIndex(content, index),
        literal,
      });
    }
  }

  if (violations.length === 0) {
    console.log('Color token check passed. No raw color literals found.');
    return;
  }

  console.error('Color token check failed. Use tokens instead of raw color literals:\n');
  for (const violation of violations) {
    console.error(`${violation.file}:${violation.line} -> ${violation.literal}`);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error('Color token check crashed:', error);
  process.exit(1);
});
