import { defineConfig } from 'astro/config';
import fs from 'node:fs';

// The site's address comes from config.json, so moving the site only needs one edit there.
const cfg = JSON.parse(fs.readFileSync(new URL('./config.json', import.meta.url), 'utf-8'));
const url = new URL(cfg.siteUrl || 'http://localhost:4321');

export default defineConfig({
  site: url.origin,
  base: url.pathname.replace(/\/$/, '') || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
