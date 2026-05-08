/**
 * Prévisualisation des couleurs de pile (call stack) sous Dusk Office.
 *
 * Usage
 * -----
 * 1. Ouvre ce fichier, mets un point d’arrêt sur la ligne `debugger` dans pauseHere().
 * 2. Run → Start Debugging (Node) sur ce fichier, ou : `node --inspect-brk samples/stack-color-preview.mjs`
 *    puis attache le débogueur.
 * 3. Quand ça s’arrête : dans CALL STACK, clique une autre entrée que la plus haute.
 *    - Ligne courante / frame du haut : `editor.stackFrameHighlightBackground`
 *    - Frame sélectionnée dans la pile : `editor.focusedStackFrameHighlightBackground`
 */

function deepD() {
  const x = 40;
  return x + 2;
}

function deepC() {
  return deepD() * 3;
}

function deepB() {
  return deepC() + deepC();
}

function pauseHere() {
  debugger; // ← point d’arrêt ici, puis change de frame dans la pile
  return deepB();
}

function entry() {
  return pauseHere() + 1;
}

entry();
