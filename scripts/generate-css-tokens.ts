import fs from 'fs';
import path from 'path';
import { tokens } from '../src/lib/design-tokens';

type CssVarGroups = typeof tokens.cssVars;

const header = `/* Auto-generated from src/lib/design-tokens.ts. Do not edit directly. */`;

const formatGroup = (label: string, vars: Record<string, string | number>) => {
  const lines = Object.entries(vars).map(([key, value]) => `  --${key}: ${value};`);
  return [`  /* ${label} */`, ...lines].join('\n');
};

const groups: Array<[string, Record<string, string | number>]> = Object.entries(tokens.cssVars) as Array<
  [keyof CssVarGroups, Record<string, string | number>]
>;

const body = groups.map(([label, vars]) => formatGroup(label, vars)).join('\n\n');

const css = `${header}
:root {
${body}
}
`;

const outputPath = path.resolve('src/styles/generated-tokens.css');
fs.writeFileSync(outputPath, css, 'utf8');
