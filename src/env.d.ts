/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the RSVP Cloudflare Worker, e.g. https://birthday-rsvp.<account>.workers.dev */
  readonly VITE_RSVP_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
