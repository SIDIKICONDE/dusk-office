#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, '..', 'icons-src');

// Dusk Office style - rounded, modern icons
const createSvg = (paths, size = 16) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${paths}
</svg>`;

// Icon definitions with Dusk Office style (thicker strokes, rounded caps)
const icons = {
  // Navigation & Activity Bar
  files: createSvg(`<path d="M2 2.5C2 2.22386 2.22386 2 2.5 2H5.79289C5.9255 2 6.05268 2.05268 6.14645 2.14645L7.85355 3.85355C7.94732 3.94732 8.0745 4 8.20711 4H13.5C13.7761 4 14 4.22386 14 4.5V13.5C14 13.7761 13.7761 14 13.5 14H2.5C2.22386 14 2 13.7761 2 13.5V2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  search: createSvg(`<circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'source-control': createSvg(`<circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 6V10M4 10H8M8 10L12 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  debug: createSvg(`<path d="M4.5 2L11.5 8L4.5 14V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/><path d="M8 8H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  extensions: createSvg(`<rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>`),
  account: createSvg(`<circle cx="8" cy="4" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 14C2 10.6863 4.68629 8 8 8C11.3137 8 14 10.6863 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  settings: createSvg(`<circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 1V3M8 13V15M1 8H3M13 8H15M3.05 3.05L4.46 4.46M11.54 11.54L12.95 12.95M3.05 12.95L4.46 11.54M11.54 4.46L12.95 3.05" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'settings-gear': createSvg(`<circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M13.5 8L15 8M1 8L2.5 8M8 1V2.5M8 13.5V15M12 4L13 3M3 13L4 12M12 12L13 13M3 3L4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Common actions
  add: createSvg(`<path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  remove: createSvg(`<path d="M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  close: createSvg(`<path d="M3 3L13 13M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  check: createSvg(`<path d="M3 8L6 11L13 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  edit: createSvg(`<path d="M2 14H14M10.5 2.5L13.5 5.5L5.5 13.5H2.5V10.5L10.5 2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  trash: createSvg(`<path d="M4 5V13C4 13.5523 4.44772 14 5 14H11C11.5523 14 12 13.5523 12 13V5M2 5H14M6 5V3C6 2.44772 6.44772 2 7 2H9C9.55228 2 10 2.44772 10 3V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  save: createSvg(`<path d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z" stroke="currentColor" stroke-width="1.5"/><path d="M5 2V6H11V2M5 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Navigation
  'go-to-file': createSvg(`<path d="M4 2H9L12 5V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V3C3 2.44772 3.44772 2 4 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M9 2V5H12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="7" cy="10" r="2" stroke="currentColor" stroke-width="1.5"/>`),
  home: createSvg(`<path d="M2 7L8 2L14 7V14H10V10H6V14H2V7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'chevron-left': createSvg(`<path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'chevron-right': createSvg(`<path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'chevron-up': createSvg(`<path d="M3 10L8 5L13 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'chevron-down': createSvg(`<path d="M3 5L8 10L13 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Files & Folders
  folder: createSvg(`<path d="M2 3C2 2.44772 2.44772 2 3 2H6L8 4H13C13.5523 4 14 4.44772 14 5V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'folder-opened': createSvg(`<path d="M2 3C2 2.44772 2.44772 2 3 2H6L8 4H13C13.5523 4 14 4.44772 14 5V6H4L2 14V3Z" stroke="currentColor" stroke-width="1.5"/><path d="M4 6H14L12 14H2L4 6Z" stroke="currentColor" stroke-width="1.5"/>`),
  file: createSvg(`<path d="M4 2H9L12 5V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V3C3 2.44772 3.44772 2 4 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M9 2V5H12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  'file-code': createSvg(`<path d="M4 2H9L12 5V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V3C3 2.44772 3.44772 2 4 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M9 2V5H12M6 8L4 10L6 12M10 8L12 10L10 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Git
  'git-branch': createSvg(`<circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 6V10M4 4H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'git-commit': createSvg(`<circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 1V5M8 11V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'git-merge': createSvg(`<circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 6V10M4 4C8 4 12 8 12 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'git-pull-request': createSvg(`<circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 6V10M12 10V4C12 2 10 2 8 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Terminal & Console
  terminal: createSvg(`<path d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3Z" stroke="currentColor" stroke-width="1.5"/><path d="M5 6L7 8L5 10M8 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Debug
  'debug-alt': createSvg(`<path d="M4.5 2L11.5 8L4.5 14V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>`),
  'debug-start': createSvg(`<path d="M4.5 2L11.5 8L4.5 14V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>`),
  'debug-stop': createSvg(`<rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>`),
  'debug-restart': createSvg(`<path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10 2 11.5 3 12.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 1V4H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'debug-step-over': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H10M10 8L7 5M10 8L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'debug-step-into': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5V11M5 8L8 11L11 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'debug-step-out': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 11V5M5 8L8 5L11 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Symbols
  'symbol-method': createSvg(`<path d="M3 8H13M8 3V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'symbol-class': createSvg(`<rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>`),
  'symbol-interface': createSvg(`<path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'symbol-variable': createSvg(`<path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'symbol-constant': createSvg(`<circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'symbol-property': createSvg(`<circle cx="6" cy="8" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M10 5L13 8L10 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'symbol-keyword': createSvg(`<path d="M3 4H13M3 8H10M3 12H7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'symbol-snippet': createSvg(`<path d="M4 2H9L12 5V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V3C3 2.44772 3.44772 2 4 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M9 2V5H12M6 8H9M6 11H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Misc
  bell: createSvg(`<path d="M8 2C5.23858 2 3 4.23858 3 7V10L2 12H14L13 10V7C13 4.23858 10.7614 2 8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 12C6 13.1046 6.89543 14 8 14C9.10457 14 10 13.1046 10 12" stroke="currentColor" stroke-width="1.5"/>`),
  book: createSvg(`<path d="M2 3C2 2.44772 2.44772 2 3 2H8C9.10457 2 10 2.89543 10 4V14C10 14.5523 9.55228 15 9 15H3C2.44772 15 2 14.5523 2 14V3Z" stroke="currentColor" stroke-width="1.5"/><path d="M10 4C10 2.89543 10.8954 2 12 2H13C13.5523 2 14 2.44772 14 3V14C14 14.5523 13.5523 15 13 15H9" stroke="currentColor" stroke-width="1.5"/>`),
  history: createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 4V8L11 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  refresh: createSvg(`<path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C10 2 11.5 3 12.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M12 1V4H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  sync: createSvg(`<path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 2V5H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  remote: createSvg(`<circle cx="8" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 6V8M6 10L4 10M10 10L12 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  tools: createSvg(`<path d="M2 14L6.5 9.5M14 2L9.5 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 2L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'workspace-trusted': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  notebook: createSvg(`<path d="M4 2H12C12.5523 2 13 2.44772 13 3V13C13 13.5523 12.5523 14 12 14H4C3.44772 14 3 13.5523 3 13V3C3 2.44772 3.44772 2 4 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M6 2V14M10 2V14" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Media
  play: createSvg(`<path d="M4 2L14 8L4 14V2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>`),
  stop: createSvg(`<rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>`),
  pause: createSvg(`<path d="M5 3V13M11 3V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Eye
  eye: createSvg(`<path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/>`),
  'eye-closed': createSvg(`<path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M2 14L14 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Lock
  lock: createSvg(`<rect x="4" y="7" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M6 7V5C6 3.89543 6.89543 3 8 3C9.10457 3 10 3.89543 10 5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  unlock: createSvg(`<rect x="4" y="7" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M6 7V5C6 3.89543 6.89543 3 8 3C9.10457 3 10 3.89543 10 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Star
  'star-full': createSvg(`<path d="M8 1L10 6L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 6L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="currentColor"/>`),
  'star-empty': createSvg(`<path d="M8 1L10 6L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 6L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Heart
  heart: createSvg(`<path d="M8 14C8 14 1 10 1 5.5C1 3 3 1 5.5 1C7 1 8 2 8 2C8 2 9 1 10.5 1C13 1 15 3 15 5.5C15 10 8 14 8 14Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Warning & Error
  warning: createSvg(`<path d="M8 2L15 14H1L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6V9M8 11V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  error: createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 5L11 11M11 5L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  info: createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5V8M8 11V11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Layout
  'layout-sidebar-left': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 2V14" stroke="currentColor" stroke-width="1.5"/>`),
  'layout-sidebar-right': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M11 2V14" stroke="currentColor" stroke-width="1.5"/>`),
  'layout-panel': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M2 6H14M2 10H14" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Filter & List
  filter: createSvg(`<path d="M2 3H14L9 9V14L7 12V9L2 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  'list-unordered': createSvg(`<path d="M6 4H14M6 8H14M6 12H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="3" cy="4" r="1" fill="currentColor"/><circle cx="3" cy="8" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/>`),
  'list-ordered': createSvg(`<path d="M6 4H14M6 8H14M6 12H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><text x="2" y="5" font-size="4" fill="currentColor">1</text><text x="2" y="9" font-size="4" fill="currentColor">2</text><text x="2" y="13" font-size="4" fill="currentColor">3</text>`),
  
  // Key
  key: createSvg(`<circle cx="10" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M7 8L2 13M4 11L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Link
  link: createSvg(`<path d="M7 9C7 9 8 8 10 8C12 8 13 9 13 10C13 11 12 12 10 12C8 12 7 11 7 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M9 7C9 7 8 8 6 8C4 8 3 7 3 6C3 5 4 4 6 4C8 4 9 5 9 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'link-external': createSvg(`<path d="M12 8V12C12 12.5523 11.5523 13 11 13H4C3.44772 13 3 12.5523 3 12V5C3 4.44772 3.44772 4 4 4H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 2H14V6M14 2L8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Pin
  pin: createSvg(`<path d="M8 1V4M8 12V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>`),
  pinned: createSvg(`<path d="M8 1V4M8 12V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1.5" fill="currentColor"/>`),
  
  // Tag
  tag: createSvg(`<path d="M2 3C2 2.44772 2.44772 2 3 2H8L14 8L10 12L4 6V3C4 2.44772 3.55228 2 3 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="6" cy="6" r="1" fill="currentColor"/>`),
  
  // Globe
  globe: createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M2 8H14M8 2C5.5 4.5 5.5 11.5 8 14M8 2C10.5 4.5 10.5 11.5 8 14" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Rocket
  rocket: createSvg(`<path d="M8 1C8 1 12 3 12 8C12 10 11 12 11 12L8 14L5 12C5 12 4 10 4 8C4 3 8 1 8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="8" cy="7" r="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 13L3 15M11 13L13 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Package
  package: createSvg(`<path d="M8 1L14 4V12L8 15L2 12V4L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 1V15M2 4L8 7L14 4" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Inbox
  inbox: createSvg(`<rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M2 8H6L7 10H9L10 8H14" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Device
  'device-camera': createSvg(`<rect x="2" y="5" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="9" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M6 5V4C6 3.44772 6.44772 3 7 3H9C9.55228 3 10 3.44772 10 4V5" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Sign
  'sign-in': createSvg(`<path d="M8 4V12M8 4L5 7M8 4L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 2 14.5523 2 14V2" stroke="currentColor" stroke-width="1.5"/>`),
  'sign-out': createSvg(`<path d="M8 4V12M8 4L5 7M8 4L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 2V14C2 14.5523 2.44772 15 3 15H13" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Dashboard
  dashboard: createSvg(`<rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Layers
  layers: createSvg(`<path d="M8 1L14 4L8 7L2 4L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M2 7L8 10L14 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 10L8 13L14 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Pulse
  pulse: createSvg(`<path d="M1 8H4L6 4L8 12L10 6L12 8H15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Lightbulb
  lightbulb: createSvg(`<path d="M8 1C5.23858 1 3 3.23858 3 6C3 8 4 9 5 10V11C5 11.5523 5.44772 12 6 12H10C10.5523 12 11 11.5523 11 11V10C12 9 13 8 13 6C13 3.23858 10.7614 1 8 1Z" stroke="currentColor" stroke-width="1.5"/><path d="M6 14H10M7 12V15M9 12V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Quote
  quote: createSvg(`<path d="M3 5C3 5 4 4 6 4C8 4 9 5 9 7C9 9 7 10 5 10M5 10V12M5 12C5 12 6 13 8 13C10 13 11 12 11 10C11 8 9 7 7 7M7 7V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Thumbs
  thumbsup: createSvg(`<path d="M8 2L6 6H3V14H12L14 8V6H9L10 2L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  thumbsdown: createSvg(`<path d="M8 14L10 10H14V2H5L3 8V10H7L6 14L8 14Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Smiley
  smiley: createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="6" r="1" fill="currentColor"/><circle cx="11" cy="6" r="1" fill="currentColor"/><path d="M5 10C5 10 6 12 8 12C10 12 11 10 11 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Zap (lightning)
  zap: createSvg(`<path d="M8 1L4 8H8L6 15L12 7H8L10 1H8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>`),
  
  // Shield
  shield: createSvg(`<path d="M8 1L13 3V7C13 11 8 14 8 14C8 14 3 11 3 7V3L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Gift
  gift: createSvg(`<rect x="2" y="6" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M2 6H14M8 6V14" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="2" width="8" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Mortar board (graduation)
  'mortar-board': createSvg(`<path d="M8 3L14 6L8 9L2 6L8 3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 8V12L8 14L12 12V8" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Law
  law: createSvg(`<path d="M8 1V3M2 3H14M4 3L2 10M12 3L14 10M2 10H14M8 10V15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // RSS
  rss: createSvg(`<path d="M2 14H2.01M2 10C4 10 6 12 6 14M2 6C6 6 10 10 10 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Radio tower
  'radio-tower': createSvg(`<path d="M8 6V15M5 15H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 1C4 1 2 2 2 4M12 1C12 1 14 2 14 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Telescope
  telescope: createSvg(`<path d="M2 8L6 6L8 10L4 12L2 8Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 10L14 14M6 6L14 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Verified
  verified: createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Unverified
  unverified: createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 5L11 11M11 5L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Sparkle
  sparkle: createSvg(`<path d="M8 1L9 6L14 7L9 8L8 13L7 8L2 7L7 6L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Wand
  wand: createSvg(`<path d="M2 14L14 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 2L12 4M12 2L14 4M14 2L12 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Robot
  robot: createSvg(`<rect x="3" y="5" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="8" r="1" fill="currentColor"/><circle cx="10" cy="8" r="1" fill="currentColor"/><path d="M6 11H10M8 2V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Hubot
  hubot: createSvg(`<rect x="2" y="4" width="12" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11M5 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 2V4M4 2L8 4L12 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Beaker (flask)
  beaker: createSvg(`<path d="M5 2H11M6 2V5L3 10V14H13V10L10 5V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Test
  test: createSvg(`<path d="M8 2L14 6V10L8 14L2 10V6L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6L8 10M6 8L10 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // VM
  vm: createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M2 7H14M7 2V14" stroke="currentColor" stroke-width="1.5"/>`),
  'vm-active': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M2 7H14M7 2V14" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="currentColor"/>`),
  
  // Server
  server: createSvg(`<rect x="2" y="2" width="12" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2" y="10" width="12" height="4" rx="1" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="4" r="0.5" fill="currentColor"/><circle cx="5" cy="12" r="0.5" fill="currentColor"/>`),
  
  // Database
  database: createSvg(`<ellipse cx="8" cy="4" rx="6" ry="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 4V12C2 13.1046 4.68629 14 8 14C11.3137 14 14 13.1046 14 12V4" stroke="currentColor" stroke-width="1.5"/><path d="M2 8C2 9.10457 4.68629 10 8 10C11.3137 10 14 9.10457 14 8" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Cloud
  cloud: createSvg(`<path d="M4 13C2.34315 13 1 11.6569 1 10C1 8.34315 2.34315 7 4 7C4 4.79086 5.79086 3 8 3C10.2091 3 12 4.79086 12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13H4Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Circuit board
  'circuit-board': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><circle cx="5" cy="5" r="1" stroke="currentColor" stroke-width="1"/><circle cx="11" cy="5" r="1" stroke="currentColor" stroke-width="1"/><circle cx="5" cy="11" r="1" stroke="currentColor" stroke-width="1"/><circle cx="11" cy="11" r="1" stroke="currentColor" stroke-width="1"/><path d="M5 6V8H8V11M11 6V8H8" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>`),
  
  // Symbol color
  'symbol-color': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="3" fill="currentColor"/>`),
  
  // Symbol misc
  'symbol-misc': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11M8 5V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Symbol numeric
  'symbol-numeric': createSvg(`<path d="M4 4H12M4 8H12M4 12H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><text x="6" y="6" font-size="3" fill="currentColor">123</text>`),
  
  // Symbol enum
  'symbol-enum': createSvg(`<rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M6 6H10M6 8H10M6 10H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Symbol enum-member
  'symbol-enum-member': createSvg(`<circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="currentColor"/>`),
  
  // Symbol structure
  'symbol-structure': createSvg(`<path d="M8 2L14 5V11L8 14L2 11V5L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Symbol event
  'symbol-event': createSvg(`<path d="M8 2L10 6L14 7L11 10L12 14L8 12L4 14L5 10L2 7L6 6L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Symbol operator
  'symbol-operator': createSvg(`<path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Symbol array
  'symbol-array': createSvg(`<rect x="3" y="3" width="4" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="3" width="4" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Symbol boolean
  'symbol-boolean': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Symbol key
  'symbol-key': createSvg(`<circle cx="10" cy="6" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M7 8L2 13M4 11L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Symbol text
  'symbol-text': createSvg(`<path d="M3 4H13M5 4V12M11 4V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Symbol reference
  references: createSvg(`<path d="M4 2H9L12 5V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V3C3 2.44772 3.44772 2 4 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M9 2V5H12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8L4 10L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Symbol field
  'symbol-field': createSvg(`<rect x="2" y="5" width="12" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Symbol parameter
  'symbol-parameter': createSvg(`<path d="M2 8C2 8 4 6 8 6C12 6 14 8 14 8C14 8 12 10 8 10C4 10 2 8 2 8Z" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/>`),
  
  // Symbol ruler
  'symbol-ruler': createSvg(`<path d="M2 4H14V12H2V4Z" stroke="currentColor" stroke-width="1.5"/><path d="M5 4V8M8 4V12M11 4V8" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Symbol object
  'symbol-object': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 2V14M2 8H14" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Symbol namespace
  'symbol-namespace': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M8 2V14" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Symbol package
  'symbol-package': createSvg(`<path d="M8 1L14 4V12L8 15L2 12V4L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Symbol string
  'symbol-string': createSvg(`<path d="M4 4C4 4 6 2 8 2C10 2 12 4 12 4M4 12C4 12 6 14 8 14C10 14 12 12 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Symbol file
  'symbol-file': createSvg(`<path d="M4 2H9L12 5V14C12 14.5523 11.5523 15 11 15H4C3.44772 15 3 14.5523 3 14V3C3 2.44772 3.44772 2 4 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M9 2V5H12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>`),
  
  // Symbol custom
  'symbol-custom': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5 5L11 11M11 5L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Graph
  graph: createSvg(`<circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="8" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 6V10L8 12M12 6V10L8 12M6 4H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Graph line
  'graph-line': createSvg(`<path d="M2 12L6 8L9 11L14 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Graph scatter
  'graph-scatter': createSvg(`<circle cx="4" cy="4" r="1.5" fill="currentColor"/><circle cx="8" cy="6" r="1.5" fill="currentColor"/><circle cx="12" cy="3" r="1.5" fill="currentColor"/><circle cx="5" cy="10" r="1.5" fill="currentColor"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/><circle cx="13" cy="8" r="1.5" fill="currentColor"/>`),
  
  // Pie chart
  'pie-chart': createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 2V8L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Diff
  'diff-added': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M8 5V11M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'diff-removed': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'diff-modified': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 8C5 6 6 5 8 5C10 5 11 6 11 8C11 10 10 11 8 11C6 11 5 10 5 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'diff-renamed': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M6 8H10M10 8L7 5M10 8L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  'diff-ignored': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5" opacity="0.5"/><path d="M4 4L12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Merge
  merge: createSvg(`<circle cx="4" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M4 6V10M4 4C8 4 12 8 12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Output
  output: createSvg(`<rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 7L7 9L5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Screen
  'screen-full': createSvg(`<rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M6 2H2V6M14 6V2H10M10 14H14V10M2 10V14H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'screen-normal': createSvg(`<rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Split
  'split-horizontal': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M8 2V14" stroke="currentColor" stroke-width="1.5"/>`),
  'split-vertical': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M2 8H14" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Whitespace
  whitespace: createSvg(`<path d="M4 8H12M6 5V11M10 5V11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Word wrap
  'word-wrap': createSvg(`<path d="M2 4H14M2 8H10M2 12H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 10L8 12L10 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Zoom
  'zoom-in': createSvg(`<circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M6.5 4.5V8.5M4.5 6.5H8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'zoom-out': createSvg(`<circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M4.5 6.5H8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Clear
  clear: createSvg(`<path d="M2 8H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Clear all
  'clear-all': createSvg(`<path d="M2 4H14M2 8H14M2 12H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Collapse all
  'collapse-all': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Expand all
  'expand-all': createSvg(`<rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M8 5V11M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Search stop
  'search-stop': createSvg(`<circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="3" y="3" width="7" height="7" fill="currentColor"/>`),
  
  // Search fuzzy
  'search-fuzzy': createSvg(`<circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="5" cy="6" r="0.5" fill="currentColor"/><circle cx="7" cy="6" r="0.5" fill="currentColor"/><circle cx="6" cy="7.5" r="0.5" fill="currentColor"/>`),
  
  // Replace
  replace: createSvg(`<path d="M8 2C5.23858 2 3 4.23858 3 7V9C3 11.7614 5.23858 14 8 14C10.7614 14 13 11.7614 13 9V7C13 4.23858 10.7614 2 8 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M6 7H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  'replace-all': createSvg(`<path d="M8 2C5.23858 2 3 4.23858 3 7V9C3 11.7614 5.23858 14 8 14C10.7614 14 13 11.7614 13 9V7C13 4.23858 10.7614 2 8 2Z" stroke="currentColor" stroke-width="1.5"/><path d="M6 6H10M6 8H10M6 10H8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Preserve case
  'preserve-case': createSvg(`<path d="M4 12L8 4L12 12M5.5 9H10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Regex
  regex: createSvg(`<path d="M2 8C2 8 4 6 6 6C8 6 10 10 12 10C14 10 14 8 14 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`),
  
  // Whole word
  'whole-word': createSvg(`<path d="M2 4H6L8 12L10 4H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Case sensitive
  'case-sensitive': createSvg(`<path d="M4 12L8 4L12 12M5.5 9H10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
  
  // Ellipsis
  ellipsis: createSvg(`<circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/>`),
  
  // Symbol
  symbol: createSvg(`<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>`),
  
  // Symbol arrow
  'symbol-method-arrow': createSvg(`<path d="M8 2V14M8 2L4 6M8 2L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`),
};

// Ensure directory exists
if (!fs.existsSync(srcDir)) {
  fs.mkdirSync(srcDir, { recursive: true });
}

// Generate all SVG files
let count = 0;
for (const [name, svg] of Object.entries(icons)) {
  const filePath = path.join(srcDir, `${name}.svg`);
  fs.writeFileSync(filePath, svg);
  count++;
}

console.log(`Generated ${count} icon SVGs in ${srcDir}`);
