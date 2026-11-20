/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_GATEWAY_URL?: string;
  readonly VITE_AI_ASSISTANT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
