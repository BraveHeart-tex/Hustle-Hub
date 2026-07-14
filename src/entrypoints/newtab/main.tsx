import '@/assets/tailwind.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from '@/components/newtab/ThemeProvider';
import { NewTab } from '@/entrypoints/newtab/NewTab.tsx';

function bootstrap() {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Missing #root element');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <NewTab />
      </ThemeProvider>
    </React.StrictMode>,
  );
}

bootstrap();
