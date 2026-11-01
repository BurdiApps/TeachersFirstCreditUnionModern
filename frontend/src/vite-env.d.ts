/// <reference types="vite/client" />

// Vite exposes environment variables through import.meta.env; only VITE_-prefixed
// values are included in browser code.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
