/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL for the REST API. Defaults to the Vite dev proxy path. */
  readonly VITE_API_BASE_URL?: string;
  /** Target used by the Vite dev server proxy. */
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
