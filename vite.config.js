import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { STORAGE_KEY } from './src/lib/constants.js';

/**
 * Builds dist/sw.js from pwa/sw.template.js: a list of every file in the build (so the app works offline
 * after the first visit) and a version that changes whenever any of them does.
 */
function serviceWorker() {
  let outDir = 'dist';
  return {
    name: 'jimato-service-worker',
    apply: 'build',
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    closeBundle() {
      const files = [];
      const walk = (dir) => {
        for (const name of readdirSync(dir)) {
          const path = join(dir, name);
          if (statSync(path).isDirectory()) walk(path);
          else files.push(path);
        }
      };
      walk(outDir);
      const urls = files.map((f) => relative(outDir, f).split(sep).join('/'))// Old .woff font copies are only a fallback for ancient browsers: they are not worth downloading into the offline cache.
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map') && !f.endsWith('.woff')).sort();
      const hash = createHash('sha1');
      for (const url of urls) hash.update(`${url}:${readFileSync(join(outDir, url)).length}\n`);
      const template = readFileSync(new URL('./pwa/sw.template.js', import.meta.url), 'utf8');
      hash.update(template); // a change to the worker itself is a new version too
      const source = template
        .replace('__VERSION__', hash.digest('hex').slice(0, 10))
        .replace('__PRECACHE__', JSON.stringify(['./', ...urls]));
      writeFileSync(join(outDir, 'sw.js'), source);
    },
  };
}

/**
 * Starts downloading early what the first screen needs but the browser would only discover late: the two main Persian
 * fonts (found only after the CSS is parsed) and, for someone who has never opened the app, the starter data chunk
 * (otherwise it waits for the main script to run first).
 */
function preloadFonts() {
  return {
    name: 'jimato-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const names = Object.keys(ctx.bundle ?? {}).filter((f) => /vazirmatn-arabic-(400|700)-normal-.*\.woff2$/.test(f));
        const links = names.map((f) => `    <link rel="preload" as="font" type="font/woff2" href="./${f}" crossorigin />\n`).join('');
        const seed = Object.keys(ctx.bundle ?? {}).find((f) => /^assets\/seed-.*\.js$/.test(f));
        const firstRun = seed
          ? `    <script>try{if(!localStorage.getItem(${JSON.stringify(STORAGE_KEY)})){var l=document.createElement('link');l.rel='modulepreload';l.href='./${seed}';document.head.appendChild(l)}}catch(e){}</script>\n`
          : '';
        return html.replace('  </head>', `${links}${firstRun}  </head>`);
      },
    },
  };
}

// base './' keeps every URL relative, so the app works from a domain root or from a sub-folder (GitHub Pages).
// plugin-react enables the automatic JSX runtime, so components don't import React.
export default defineConfig({ base: './', plugins: [react(), preloadFonts(), serviceWorker()] });
