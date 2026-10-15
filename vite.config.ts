import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import prerender from '@prerenderer/rollup-plugin';

// Resolve a project-root-relative path (package.json sets "type": "module",
// so __dirname is unavailable in this config file).
const rootPath = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Dev-only middleware: map extensionless landing URLs (/chatgpt-plus) to
// their directory index (chatgpt-plus/index.html). This mirrors production,
// where Cloudflare Pages serves dist/<route>/index.html for extensionless
// URLs. Without it, MPA mode 404s these URLs; with Vite's default SPA
// fallback they would wrongly render the root brand hub instead.
function landingPageIndexes(routes: string[]): Plugin {
  return {
    name: 'dev-landing-page-index',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const pathname = decodeURIComponent((req.url ?? '').split('?')[0]).replace(/\/+$/, '');
        if (routes.includes(pathname.slice(1))) {
          req.url = `${pathname}/index.html`;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // Multi-page app: one HTML template per landing page. Each template owns its
  // own <title>, canonical URL and JSON-LD so every topic ranks on a distinct
  // URL instead of a home-page anchor.
  //
  // MPA mode: disables Vite's SPA fallback, which would rewrite every
  // extensionless dev URL (/chatgpt-plus, /claude-code, /faq) to the ROOT
  // index.html — i.e. local dev would show the brand hub instead of the
  // landing page. The landingPageIndexes plugin below takes over routing.
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        home: rootPath('./index.html'),
        chatgptPlus: rootPath('./chatgpt-plus/index.html'),
        claudeCode: rootPath('./claude-code/index.html'),
        faq: rootPath('./faq/index.html'),
      },
    },
  },
  plugins: [
    react(),
    landingPageIndexes(['chatgpt-plus', 'claude-code', 'faq']),
    // Build-time prerendering (SEO): snapshot the fully rendered React DOM of
    // every landing page so crawlers see real content without JS. The plugin's
    // catch-all serves `<route>/index.html` for extensionless routes, and each
    // snapshot is written to dist/<route>/index.html — which matches how
    // Cloudflare Pages maps extensionless URLs to directory index files.
    prerender({
      routes: ['/', '/chatgpt-plus', '/claude-code', '/faq'],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        // Dispatched from AppShell after the first React commit
        // (see src/shared/AppShell.tsx).
        renderAfterDocumentEvent: 'render-event',
      },
      postProcess: (renderedRoute) => {
        // Normalize any dev-server absolute URLs to the production domain.
        renderedRoute.html = renderedRoute.html
          .replace(/http:/g, 'https:')
          .replace(/(https:\/\/)?localhost:\d+/g, 'https://www.gutast.com');
      },
    }),
  ],
});
