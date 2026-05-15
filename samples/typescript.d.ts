/** Ambient declarations — keywords differ from .ts implementation files. */

declare global {
  interface Window {
    __APP_VERSION__: string;
  }
}

declare module "*.svg" {
  const src: string;
  export default src;
}

export {};
