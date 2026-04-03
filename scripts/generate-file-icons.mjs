#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'fileicons', 'icons');

// Dusk Office color palette
const colors = {
  primary: '#c586c0',      // Mauve/rosé
  secondary: '#569cd6',    // Bleu
  tertiary: '#dcdcaa',     // Jaune
  quaternary: '#4ec9b0',   // Cyan
  quinary: '#ce9178',      // Orange
  senary: '#d16969',       // Rouge
  septenary: '#6a9955',    // Vert
  octonary: '#808080',     // Gris
  folder: '#dcb67a',       // Doré pour dossiers
  file: '#cccccc',         // Gris clair pour fichiers
};

// Base SVG template
const svgTemplate = (content, size = 24) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${content}
</svg>`;

// Icon generators
const icons = {
  // Folders
  folder: (color) => svgTemplate(`<path d="M2 4C2 3.44772 2.44772 3 3 3H9.58579C9.851 3 10.1054 3.10536 10.2929 3.29289L12 5H21C21.5523 5 22 5.44772 22 6V18C22 18.5523 21.5523 19 21 19H3C2.44772 19 2 18.5523 2 18V4Z" fill="${color}"/>`),
  'folder-open': (color) => svgTemplate(`<path d="M2 4C2 3.44772 2.44772 3 3 3H9.58579C9.851 3 10.1054 3.10536 10.2929 3.29289L12 5H21C21.5523 5 22 5.44772 22 6V7H13.4142C13.149 7 12.8946 7.10536 12.7071 7.29289L11 9H2V4Z" fill="${color}"/><path d="M2.70711 9.29289C2.89464 9.10536 3.149 9 3.41421 9H13.5858C13.851 9 14.1054 9.10536 14.2929 9.29289L22 17V18C22 18.5523 21.5523 19 21 19H3C2.44772 19 2 18.5523 2 18V10C2 9.73478 2.10536 9.48043 2.29289 9.29289H2.70711Z" fill="${color}"/>`),
  'folder-root': (color) => svgTemplate(`<path d="M2 4C2 3.44772 2.44772 3 3 3H9.58579C9.851 3 10.1054 3.10536 10.2929 3.29289L12 5H21C21.5523 5 22 5.44772 22 6V18C22 18.5523 21.5523 19 21 19H3C2.44772 19 2 18.5523 2 18V4Z" fill="${color}"/><circle cx="12" cy="12" r="3" fill="${colors.octonary}"/>`),

  // Files
  file: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/>`),
  'file-code': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><path d="M9 12L7 14L9 16M15 12L17 14L15 16" stroke="${colors.tertiary}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'file-json': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><text x="9" y="15" font-size="5" font-family="monospace" fill="${colors.quaternary}">{}</text>`),
  'file-md': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><path d="M8 12V17M8 17L10 15M8 17L10 19M13 12L15.5 17L18 12" stroke="${colors.septenary}" stroke-width="1.5" stroke-linecap="round"/>`),
  'file-image': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><circle cx="10" cy="11" r="2" fill="${colors.quinary}"/><path d="M8 17L11 14L13 16L16 13" stroke="${colors.septenary}" stroke-width="1.5"/>`),
  'file-styles': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><path d="M9 12H15M9 15H13M9 18H11" stroke="${colors.secondary}" stroke-width="1.5" stroke-linecap="round"/>`),
  'file-config': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><circle cx="12" cy="14" r="3" stroke="${colors.tertiary}" stroke-width="1.5"/><circle cx="12" cy="14" r="1" fill="${colors.tertiary}"/>`),
  'file-git': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><circle cx="12" cy="12" r="2" stroke="${colors.senary}" stroke-width="1.5"/><path d="M12 14V18" stroke="${colors.senary}" stroke-width="1.5"/>`),
  'file-test': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><circle cx="12" cy="14" r="3" stroke="${colors.septenary}" stroke-width="1.5"/><path d="M10 14L11.5 15.5L14 13" stroke="${colors.septenary}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'file-lock': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M14 3V8H19" fill="${colors.octonary}"/><rect x="9" y="13" width="6" height="5" rx="1" fill="${colors.quinary}"/><path d="M10 13V11C10 9.89543 10.8954 9 12 9C13.1046 9 14 9.89543 14 11V13" stroke="${colors.quinary}" stroke-width="1.5"/>`),
  'file-ignored': (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}" opacity="0.5"/><path d="M14 3V8H19" fill="${colors.octonary}" opacity="0.5"/><line x1="7" y1="7" x2="17" y2="17" stroke="${colors.senary}" stroke-width="2"/>`),

  // Languages
  javascript: (color) => svgTemplate(`<rect x="3" y="3" width="18" height="18" rx="2" fill="${color}"/><text x="12" y="16" font-size="9" font-family="monospace" font-weight="bold" fill="#1e1e1e" text-anchor="middle">JS</text>`),
  typescript: (color) => svgTemplate(`<rect x="3" y="3" width="18" height="18" rx="2" fill="${color}"/><text x="12" y="16" font-size="8" font-family="monospace" font-weight="bold" fill="#1e1e1e" text-anchor="middle">TS</text>`),
  javascriptreact: (color) => svgTemplate(`<circle cx="8" cy="12" r="4" fill="${color}"/><circle cx="16" cy="12" r="4" fill="${colors.secondary}"/>`),
  typescriptreact: (color) => svgTemplate(`<circle cx="8" cy="12" r="4" fill="${color}"/><circle cx="16" cy="12" r="4" fill="${colors.primary}"/>`),
  python: (color) => svgTemplate(`<path d="M12 3C8 3 6 5 6 8V10C6 11 5 12 5 12H19C19 12 18 11 18 10V8C18 5 16 3 12 3Z" fill="${color}"/><path d="M12 21C16 21 18 19 18 16V14C18 13 19 12 19 12H5C5 12 6 13 6 14V16C6 19 8 21 12 21Z" fill="${colors.quinary}"/>`),
  java: (color) => svgTemplate(`<path d="M6 8C6 8 8 10 12 10C16 10 18 8 18 8" stroke="${color}" stroke-width="2"/><path d="M6 12C6 12 8 14 12 14C16 14 18 12 18 12" stroke="${color}" stroke-width="2"/><path d="M6 16C6 16 8 18 12 18C16 18 18 16 18 16" stroke="${color}" stroke-width="2"/><ellipse cx="12" cy="6" rx="6" ry="2" fill="${color}"/>`),
  c: (color) => svgTemplate(`<circle cx="12" cy="12" r="8" stroke="${color}" stroke-width="2" fill="none"/><path d="M15 8C14 7 13 7 12 7C9 7 7 9.5 7 12C7 14.5 9 17 12 17C13 17 14 17 15 16" stroke="${color}" stroke-width="2" fill="none"/>`),
  cpp: (color) => svgTemplate(`<circle cx="12" cy="12" r="8" stroke="${color}" stroke-width="2" fill="none"/><path d="M15 8C14 7 13 7 12 7C9 7 7 9.5 7 12C7 14.5 9 17 12 17C13 17 14 17 15 16" stroke="${color}" stroke-width="2" fill="none"/><text x="17" y="10" font-size="6" font-family="sans-serif" fill="${color}">++</text>`),
  csharp: (color) => svgTemplate(`<circle cx="12" cy="12" r="8" stroke="${color}" stroke-width="2" fill="none"/><path d="M15 8C14 7 13 7 12 7C9 7 7 9.5 7 12C7 14.5 9 17 12 17C13 17 14 17 15 16" stroke="${color}" stroke-width="2" fill="none"/><text x="17" y="10" font-size="6" font-family="sans-serif" fill="${color}">#</text>`),
  go: (color) => svgTemplate(`<text x="12" y="16" font-size="10" font-family="sans-serif" font-weight="bold" fill="${color}" text-anchor="middle">Go</text>`),
  rust: (color) => svgTemplate(`<circle cx="12" cy="12" r="7" stroke="${color}" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="${color}"/>`),
  ruby: (color) => svgTemplate(`<path d="M12 4L4 12L12 20L20 12L12 4Z" fill="${color}"/>`),
  php: (color) => svgTemplate(`<text x="12" y="16" font-size="10" font-family="sans-serif" font-weight="bold" fill="${color}" text-anchor="middle">php</text>`),
  swift: (color) => svgTemplate(`<path d="M12 4C8 4 6 8 6 12C6 16 8 20 12 20C14 20 16 18 18 16" stroke="${color}" stroke-width="2" fill="none"/><path d="M10 8L16 16" stroke="${colors.senary}" stroke-width="1.5"/>`),
  kotlin: (color) => svgTemplate(`<path d="M4 4H20L12 20V4" fill="${color}"/>`),
  dart: (color) => svgTemplate(`<path d="M12 4L6 10L12 20L18 10L12 4Z" fill="${color}"/>`),
  vue: (color) => svgTemplate(`<path d="M12 4L4 4L12 20L20 4L12 4Z" fill="${color}"/><path d="M12 4L8 4L12 14L16 4L12 4Z" fill="${colors.septenary}"/>`),
  svelte: (color) => svgTemplate(`<circle cx="12" cy="12" r="6" stroke="${color}" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="${color}" stroke-width="2" fill="none"/>`),
  html: (color) => svgTemplate(`<path d="M5 3L7 18L12 21L17 18L19 3H5Z" fill="${color}"/><text x="12" y="13" font-size="7" font-family="monospace" font-weight="bold" fill="#1e1e1e" text-anchor="middle">HTML</text>`),
  css: (color) => svgTemplate(`<path d="M5 3L7 18L12 21L17 18L19 3H5Z" fill="${color}"/><text x="12" y="13" font-size="7" font-family="monospace" font-weight="bold" fill="#1e1e1e" text-anchor="middle">CSS</text>`),
  scss: (color) => svgTemplate(`<path d="M5 3L7 18L12 21L17 18L19 3H5Z" fill="${color}"/><text x="12" y="13" font-size="6" font-family="monospace" font-weight="bold" fill="#1e1e1e" text-anchor="middle">SCSS</text>`),
  less: (color) => svgTemplate(`<path d="M5 3L7 18L12 21L17 18L19 3H5Z" fill="${color}"/><text x="12" y="13" font-size="7" font-family="monospace" font-weight="bold" fill="#1e1e1e" text-anchor="middle">Less</text>`),
  tailwind: (color) => svgTemplate(`<path d="M12 4C8 4 6 6 6 9C6 12 8 13 12 13C16 13 18 14 18 17C18 20 16 20 12 20" stroke="${color}" stroke-width="2" fill="none"/>`),
  json: (color) => svgTemplate(`<text x="12" y="15" font-size="8" font-family="monospace" fill="${color}" text-anchor="middle">{}</text>`),
  yaml: (color) => svgTemplate(`<text x="12" y="15" font-size="7" font-family="monospace" fill="${color}" text-anchor="middle">YML</text>`),
  xml: (color) => svgTemplate(`<text x="12" y="15" font-size="7" font-family="monospace" fill="${color}" text-anchor="middle">&lt;/&gt;</text>`),
  toml: (color) => svgTemplate(`<text x="12" y="15" font-size="7" font-family="monospace" fill="${color}" text-anchor="middle">TOML</text>`),
  markdown: (color) => svgTemplate(`<text x="12" y="15" font-size="8" font-family="monospace" font-weight="bold" fill="${color}" text-anchor="middle">MD</text>`),
  image: (color) => svgTemplate(`<rect x="4" y="6" width="16" height="12" rx="1" stroke="${color}" stroke-width="1.5" fill="none"/><circle cx="8" cy="10" r="1.5" fill="${color}"/><path d="M6 16L10 12L13 15L16 11L18 14" stroke="${color}" stroke-width="1"/>`),
  svg: (color) => svgTemplate(`<rect x="4" y="6" width="16" height="12" rx="1" stroke="${color}" stroke-width="1.5" fill="none"/><text x="12" y="14" font-size="6" font-family="sans-serif" fill="${color}" text-anchor="middle">SVG</text>`),
  font: (color) => svgTemplate(`<text x="12" y="16" font-size="12" font-family="serif" font-weight="bold" fill="${color}" text-anchor="middle">A</text>`),
  docker: (color) => svgTemplate(`<rect x="4" y="10" width="3" height="3" fill="${color}"/><rect x="8" y="10" width="3" height="3" fill="${color}"/><rect x="12" y="10" width="3" height="3" fill="${color}"/><rect x="16" y="10" width="3" height="3" fill="${color}"/><rect x="8" y="6" width="3" height="3" fill="${color}"/><rect x="12" y="6" width="3" height="3" fill="${color}"/><path d="M4 15C4 15 6 17 12 17C18 17 20 15 20 15" stroke="${color}" stroke-width="1.5" fill="none"/>`),
  dockercompose: (color) => svgTemplate(`<rect x="4" y="8" width="4" height="4" fill="${color}"/><rect x="9" y="8" width="4" height="4" fill="${color}"/><rect x="14" y="8" width="4" height="4" fill="${color}"/><rect x="9" y="14" width="4" height="4" fill="${color}"/>`),
  kubernetes: (color) => svgTemplate(`<circle cx="12" cy="12" r="8" stroke="${color}" stroke-width="2" fill="none"/><path d="M12 6V12L16 14" stroke="${color}" stroke-width="1.5"/>`),
  terraform: (color) => svgTemplate(`<path d="M8 4L16 8V16L8 20V4Z" fill="${color}"/><path d="M4 6L8 8V16L4 18V6Z" fill="${color}" opacity="0.7"/>`),
  ansible: (color) => svgTemplate(`<circle cx="12" cy="12" r="8" stroke="${color}" stroke-width="2" fill="none"/><text x="12" y="16" font-size="8" font-family="sans-serif" font-weight="bold" fill="${color}" text-anchor="middle">A</text>`),
  git: (color) => svgTemplate(`<circle cx="12" cy="6" r="2" fill="${color}"/><circle cx="12" cy="12" r="2" fill="${color}"/><circle cx="12" cy="18" r="2" fill="${color}"/><line x1="12" y1="8" x2="12" y2="10" stroke="${color}" stroke-width="2"/>`),
  github: (color) => svgTemplate(`<path d="M12 4C7.58 4 4 7.58 4 12C4 15.54 6.29 18.53 9.47 19.59C9.87 19.67 10.02 19.42 10.02 19.21C10.02 19.02 10.01 18.39 10.01 17.72C8 18.09 7.48 17.23 7.32 16.78C7.23 16.55 6.84 15.84 6.5 15.65C6.22 15.5 5.82 15.13 6.49 15.12C7.12 15.11 7.57 15.7 7.72 15.94C8.44 17.15 9.59 16.81 10.05 16.6C10.12 16.08 10.33 15.73 10.56 15.53C8.76 15.33 6.88 14.64 6.88 11.78C6.88 10.97 7.17 10.3 7.74 9.79C7.66 9.59 7.4 8.82 7.82 7.78C7.82 7.78 8.45 7.58 10.02 8.55C10.61 8.38 11.24 8.3 11.87 8.3C12.5 8.3 13.13 8.38 13.72 8.55C15.29 7.57 15.92 7.78 15.92 7.78C16.34 8.82 16.08 9.59 16 9.79C16.57 10.3 16.86 10.97 16.86 11.78C16.86 14.66 14.97 15.33 13.17 15.53C13.46 15.78 13.71 16.26 13.71 17.01C13.71 18.08 13.7 18.94 13.7 19.21C13.7 19.42 13.85 19.68 14.25 19.59C17.43 18.53 19.72 15.53 19.72 12C19.72 7.58 16.14 4 12 4Z" fill="${color}"/>`),
  gitlab: (color) => svgTemplate(`<path d="M12 20L4 8L7 4L12 7L17 4L20 8L12 20Z" fill="${color}"/>`),
  npm: (color) => svgTemplate(`<rect x="3" y="3" width="18" height="18" rx="2" fill="${color}"/><text x="8" y="16" font-size="8" font-family="sans-serif" font-weight="bold" fill="#1e1e1e">npm</text>`),
  yarn: (color) => svgTemplate(`<circle cx="12" cy="12" r="8" stroke="${color}" stroke-width="2" fill="none"/><path d="M8 10C8 10 10 8 12 8C14 8 16 10 16 10" stroke="${color}" stroke-width="1.5"/>`),
  pnpm: (color) => svgTemplate(`<rect x="4" y="4" width="6" height="6" fill="${color}"/><rect x="11" y="4" width="6" height="6" fill="${color}"/><rect x="4" y="11" width="6" height="6" fill="${color}"/>`),
  package: (color) => svgTemplate(`<path d="M12 3L4 7V17L12 21L20 17V7L12 3Z" fill="${color}"/><path d="M12 3V21M4 7L12 11L20 7" stroke="#1e1e1e" stroke-width="1"/>`),
  lock: (color) => svgTemplate(`<rect x="6" y="10" width="12" height="10" rx="1" fill="${color}"/><path d="M8 10V8C8 5.79 9.79 4 12 4C14.21 4 16 5.79 16 8V10" stroke="${color}" stroke-width="2"/>`),
  env: (color) => svgTemplate(`<rect x="4" y="4" width="16" height="16" rx="2" fill="${color}"/><text x="12" y="14" font-size="6" font-family="monospace" fill="#1e1e1e" text-anchor="middle">ENV</text>`),
  config: (color) => svgTemplate(`<circle cx="12" cy="12" r="3" fill="${color}"/><path d="M12 2V5M12 19V22M2 12H5M19 12H22M4.93 4.93L7.05 7.05M16.95 16.95L19.07 19.07M4.93 19.07L7.05 16.95M16.95 7.05L19.07 4.93" stroke="${color}" stroke-width="1.5"/>`),
  vscode: (color) => svgTemplate(`<path d="M4 4L10 12L4 20V4Z" fill="${color}"/><path d="M4 4L20 8V16L4 20" fill="${color}" opacity="0.7"/>`),
  idea: (color) => svgTemplate(`<rect x="4" y="4" width="16" height="16" rx="2" fill="${color}"/><text x="12" y="14" font-size="6" font-family="sans-serif" fill="#1e1e1e" text-anchor="middle">IDEA</text>`),
  sublime: (color) => svgTemplate(`<path d="M4 8L20 4V20L4 16V8Z" fill="${color}"/>`),
  test: (color) => svgTemplate(`<circle cx="12" cy="12" r="8" stroke="${color}" stroke-width="2" fill="none"/><path d="M8 12L11 15L16 9" stroke="${color}" stroke-width="2"/>`),
  jest: (color) => svgTemplate(`<path d="M12 4L8 8L12 20L16 8L12 4Z" fill="${color}"/>`),
  vitest: (color) => svgTemplate(`<path d="M12 4L6 12L12 20L18 12L12 4Z" fill="${color}"/>`),
  storybook: (color) => svgTemplate(`<rect x="5" y="3" width="14" height="18" rx="1" fill="${color}"/><text x="12" y="15" font-size="8" font-family="sans-serif" font-weight="bold" fill="#1e1e1e" text-anchor="middle">S</text>`),
  database: (color) => svgTemplate(`<ellipse cx="12" cy="6" rx="8" ry="3" fill="${color}"/><path d="M4 6V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V6" stroke="${color}" stroke-width="2" fill="none"/>`),
  sql: (color) => svgTemplate(`<ellipse cx="12" cy="6" rx="8" ry="3" fill="${color}"/><path d="M4 6V18C4 19.66 7.58 21 12 21C16.42 21 20 19.66 20 18V6" stroke="${color}" stroke-width="2" fill="none"/><text x="12" y="14" font-size="6" font-family="monospace" fill="#1e1e1e" text-anchor="middle">SQL</text>`),
  graphql: (color) => svgTemplate(`<circle cx="12" cy="5" r="2" fill="${color}"/><circle cx="6" cy="10" r="2" fill="${color}"/><circle cx="18" cy="10" r="2" fill="${color}"/><circle cx="6" cy="16" r="2" fill="${color}"/><circle cx="18" cy="16" r="2" fill="${color}"/><line x1="12" y1="7" x2="6" y2="10" stroke="${color}"/><line x1="12" y1="7" x2="18" y2="10" stroke="${color}"/><line x1="6" y1="10" x2="6" y2="16" stroke="${color}"/><line x1="18" y1="10" x2="18" y2="16" stroke="${color}"/>`),
  prisma: (color) => svgTemplate(`<path d="M12 4L6 18H18L12 4Z" fill="${color}"/>`),
  shell: (color) => svgTemplate(`<rect x="3" y="5" width="18" height="14" rx="2" stroke="${color}" stroke-width="1.5" fill="none"/><path d="M7 10L10 12L7 14" stroke="${color}" stroke-width="1.5"/><line x1="11" y1="14" x2="17" y2="14" stroke="${color}" stroke-width="1.5"/>`),
  terminal: (color) => svgTemplate(`<rect x="3" y="5" width="18" height="14" rx="2" fill="${color}"/><path d="M7 10L10 12L7 14" stroke="#1e1e1e" stroke-width="1.5"/>`),
  makefile: (color) => svgTemplate(`<rect x="4" y="4" width="16" height="16" rx="2" fill="${color}"/><text x="12" y="14" font-size="7" font-family="monospace" fill="#1e1e1e" text-anchor="middle">MK</text>`),
  cmake: (color) => svgTemplate(`<path d="M4 4L10 12L4 20H10L12 17L14 20H20L14 12L20 4H14L12 7L10 4H4Z" fill="${color}"/>`),
  gradle: (color) => svgTemplate(`<path d="M12 4C8 4 6 6 6 8C6 10 8 12 12 12C16 12 18 14 18 16C18 18 16 20 12 20" stroke="${color}" stroke-width="3" fill="none"/>`),
  maven: (color) => svgTemplate(`<path d="M12 4L6 20H9L12 14L15 20H18L12 4Z" fill="${color}"/>`),
  sln: (color) => svgTemplate(`<path d="M4 8L12 4L20 8V16L12 20L4 16V8Z" fill="${color}"/>`),
  binary: (color) => svgTemplate(`<rect x="4" y="6" width="16" height="12" rx="1" fill="${color}"/><text x="12" y="14" font-size="5" font-family="monospace" fill="#1e1e1e" text-anchor="middle">0110</text>`),
  archive: (color) => svgTemplate(`<path d="M4 6H20V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V6Z" fill="${color}"/><path d="M20 6H4V4H20V6Z" fill="${color}"/><line x1="10" y1="10" x2="14" y2="10" stroke="#1e1e1e" stroke-width="1.5"/>`),
  audio: (color) => svgTemplate(`<path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12Z" fill="${color}"/>`),
  video: (color) => svgTemplate(`<rect x="4" y="6" width="12" height="12" rx="1" fill="${color}"/><path d="M16 10L20 8V16L16 14V10Z" fill="${color}"/>`),
  pdf: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><text x="12" y="15" font-size="6" font-family="sans-serif" font-weight="bold" fill="#1e1e1e" text-anchor="middle">PDF</text>`),
  doc: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><text x="12" y="15" font-size="6" font-family="sans-serif" font-weight="bold" fill="#1e1e1e" text-anchor="middle">DOC</text>`),
  excel: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><text x="12" y="15" font-size="6" font-family="sans-serif" font-weight="bold" fill="#1e1e1e" text-anchor="middle">XLS</text>`),
  powerpoint: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><text x="12" y="15" font-size="6" font-family="sans-serif" font-weight="bold" fill="#1e1e1e" text-anchor="middle">PPT</text>`),
  text: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><line x1="8" y1="12" x2="16" y2="12" stroke="#1e1e1e" stroke-width="1"/><line x1="8" y1="15" x2="14" y2="15" stroke="#1e1e1e" stroke-width="1"/>`),
  license: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><path d="M12 11L10 13L12 15L14 13L12 11Z" fill="#1e1e1e"/>`),
  changelog: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><line x1="8" y1="11" x2="16" y2="11" stroke="#1e1e1e" stroke-width="1"/><line x1="8" y1="14" x2="14" y2="14" stroke="#1e1e1e" stroke-width="1"/><line x1="8" y1="17" x2="12" y2="17" stroke="#1e1e1e" stroke-width="1"/>`),
  readme: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><text x="12" y="15" font-size="5" font-family="sans-serif" fill="#1e1e1e" text-anchor="middle">README</text>`),
  todo: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}"/><rect x="8" y="11" width="3" height="3" stroke="#1e1e1e" stroke-width="1" fill="none"/><line x1="13" y1="12" x2="16" y2="12" stroke="#1e1e1e" stroke-width="1"/><rect x="8" y="15" width="3" height="3" stroke="#1e1e1e" stroke-width="1" fill="none"/><line x1="13" y1="16" x2="16" y2="16" stroke="#1e1e1e" stroke-width="1"/>`),
  ignore: (color) => svgTemplate(`<path d="M6 3C5.44772 3 5 3.44772 5 4V20C5 20.5523 5.44772 21 6 21H18C18.5523 21 19 20.5523 19 20V8L14 3H6Z" fill="${color}" opacity="0.5"/><line x1="7" y1="7" x2="17" y2="17" stroke="${colors.senary}" stroke-width="2"/>`),
};

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate all icons
let count = 0;
for (const [name, generator] of Object.entries(icons)) {
  const color = colors.primary;
  const svg = generator(color);
  const filePath = path.join(iconsDir, `${name}.svg`);
  fs.writeFileSync(filePath, svg);
  count++;
}

console.log(`Generated ${count} file icons in ${iconsDir}`);
