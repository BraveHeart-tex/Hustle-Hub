import '@/assets/tailwind.css';

import React from 'react';
import ReactDOM from 'react-dom/client';

import { ThemeProvider } from '@/components/newtab/ThemeProvider';
import { NewTab } from '@/entrypoints/newtab/NewTab.tsx';
import {
  gitlabCategoryStorage,
  jiraFilterStorage,
} from '@/lib/storage/filters';

async function bootstrap() {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('Missing #root element');
  }

  const [initialJiraFilter, initialGitlabFilter] = await Promise.all([
    jiraFilterStorage.getValue(),
    gitlabCategoryStorage.getValue(),
  ]);

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <NewTab
          initialGitlabFilter={initialGitlabFilter}
          initialJiraFilter={initialJiraFilter}
        />
      </ThemeProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
