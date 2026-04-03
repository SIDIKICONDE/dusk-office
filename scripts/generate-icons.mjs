#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const csvPath = path.join(root, 'node_modules/@vscode/codicons/dist/codicon.csv');
const outputPath = path.join(root, 'producticons/dusk-office-product-icon-theme.json');

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.trim().split('\n');

const iconDefinitions = {};

for (const line of lines) {
  const parts = line.split(',');
  if (parts.length >= 3) {
    const name = parts[0].trim();
    const hexCode = parts[2].trim();
    if (name && /^[0-9A-Fa-f]{4}$/.test(hexCode)) {
      iconDefinitions[name] = {
        fontCharacter: '\\' + hexCode.toLowerCase(),
        fontId: 'dusk-office-codicon'
      };
    }
  }
}

const theme = {
  '$schema': 'vscode://schemas/product-icon-theme',
  fonts: [
    {
      id: 'dusk-office-codicon',
      src: [
        {
          path: './dusk-office-codicon.ttf',
          format: 'truetype'
        }
      ],
      weight: 'normal',
      style: 'normal'
    }
  ],
  iconDefinitions: iconDefinitions
};

fs.writeFileSync(outputPath, JSON.stringify(theme, null, 2));
console.log('Generated', Object.keys(iconDefinitions).length, 'icon definitions');
