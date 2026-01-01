/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MCP_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
