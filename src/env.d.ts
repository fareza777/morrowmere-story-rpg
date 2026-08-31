/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMOB_LIVE?: '0' | '1';
  readonly VITE_ADMOB_BANNER_ID?: string;
  readonly VITE_ADMOB_INTERSTITIAL_ID?: string;
  readonly VITE_ADMOB_REWARDED_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
