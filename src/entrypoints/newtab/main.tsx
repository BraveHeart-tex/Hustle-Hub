import '@/assets/tailwind.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import NewTab from '@/entrypoints/newtab/NewTab.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NewTab />
  </React.StrictMode>,
);
