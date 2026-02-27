import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.svg',
  },
  action: {
    default_icon: {
      48: 'public/logo.svg',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: ['activeTab', 'tabs'],
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: ['https://*/*'],
    },
  ],
  background: {
    service_worker: 'src/background/main.ts',
    type: 'module',
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
})
