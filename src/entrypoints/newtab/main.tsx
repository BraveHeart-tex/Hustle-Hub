import '@/assets/tailwind.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from '@/components/ThemeProvider';
import NewTab from '@/entrypoints/newtab/NewTab.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <NewTab />
    </ThemeProvider>
  </React.StrictMode>,
);
