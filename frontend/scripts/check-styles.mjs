import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const TARGET_DIRS = ['src/pages', 'src/features', 'src/components'];

const RULES = [
  {
    name: 'color hexadecimal suelto',
    pattern: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F_-])/g,
  },
  {
    name: 'función rgb()/hsl() suelta',
    pattern: /\b(?:rgb|rgba|hsl|hsla)\s*\(/gi,
  },
  {
    name: 'valor arbitrario de color en Tailwind',
    pattern: /\b(?:bg|text|border|ring|outline|from|via|to|fill|stroke)-\[(?:#|rgb|hsl)/gi,
  },
  {
    name: 'estilo inline de color',
    pattern: /\bstyle\s*=\s*\{\{[^}]*\b(?:color|background|backgroundColor|borderColor|fill|stroke)\b/gi,
  },
];

async function collectFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const root = process.cwd();
  const violations = [];

  for (const relDir of TARGET_DIRS) {
    const files = await collectFiles(path.join(root, relDir));

    for (const filePath of files) {
      const relPath = path.relative(root, filePath);

      if (filePath.endsWith('.css')) {
        violations.push(`${relPath}: archivo CSS prohibido fuera de src/styles/`);
        continue;
      }

      if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
        continue;
      }

      const content = await readFile(filePath, 'utf8');
      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        for (const rule of RULES) {
          rule.pattern.lastIndex = 0;
          const match = rule.pattern.exec(line);
          if (match) {
            violations.push(
              `${relPath}:${index + 1} [${rule.name}] → ${match[0]}`,
            );
          }
        }
      });
    }
  }

  if (violations.length > 0) {
    console.error('Se encontraron violaciones de estilos fuera de src/styles/theme.css:');
    for (const item of violations) {
      console.error(`  - ${item}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('check:styles OK — sin colores sueltos ni CSS por página.');
}

await main();
