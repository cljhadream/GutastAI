import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import prerender from '@prerenderer/rollup-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Build-time prerendering (SEO R1): snapshot the fully rendered React DOM
    // of `/` into dist/index.html so crawlers see real content without JS.
    prerender({
      routes: ['/'],
      renderer: '@prerenderer/renderer-puppeteer',
      rendererOptions: {
        // Dispatched from App after the first React commit (see src/App.tsx).
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
