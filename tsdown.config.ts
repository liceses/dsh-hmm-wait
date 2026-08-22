/**
 * Standalone build config for dsh-hmm-wait (self-contained copy of the
 * dsh-web-ui shared client-bundle preset, adapted for this repo):
 * the node-half lib/ (host plugin: settings + llm/stream tap + SSE route)
 * plus the browser bundle lib/client.js (closure-factory artifact for the
 * GUI's __ModuleLoader__, platform modules stay external, everything else
 * inlines).
 */

import type { UserConfig } from 'tsdown'

const ID = 'dsh-hmm-wait'

/** The module specifiers the shell shares into the frozen module table. */
const PLATFORM_MODULES = [
  'react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-web-react',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-schema-form',
] as const

/** Externals resolved from the loader module table (platform seeds + runtime exemption). */
const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES, '@deepseek-ai/dsh-client-runtime/client']

/** Node-half library: the host plugin (settings + tap + SSE routes). */
const nodeConfig: UserConfig = {
  name: ID,
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  // Resolved at runtime from the dsh profile tree, never from this repo's install.
  deps: {
    neverBundle: [
      '@deepseek-ai/cordis',
      '@deepseek-ai/dsh-host-webserver',
      '@deepseek-ai/dsh-settings',
      '@deepseek-ai/schemastery',
    ],
  },
}

/** Browser bundle: the client half, served at /plugins/<id>/client.js. */
const clientConfig: UserConfig = {
  name: `${ID}/client`,
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  dts: false,
  sourcemap: true,
  clean: false,
  // Platform modules stay external (the loader table answers them); every
  // other dependency inlines into the bundle.
  deps: {
    neverBundle: CLIENT_EXTERNALS,
    alwaysBundle: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  // Platform modules stay external (the loader table answers them); every
  // other dependency inlines into the bundle.
  deps: {
    neverBundle: CLIENT_EXTERNALS,
    alwaysBundle: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
}

export default [nodeConfig, clientConfig]
