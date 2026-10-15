import React from 'react';
import ReactDOM from 'react-dom/client';
import type { ComponentType } from 'react';

// Mount a landing page component into #root. Every page entry
// (src/pages/*/main.tsx) calls this with its own page component so all
// entries share the same React bootstrap.
export function mountPage(Page: ComponentType) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Page />
    </React.StrictMode>,
  );
}
