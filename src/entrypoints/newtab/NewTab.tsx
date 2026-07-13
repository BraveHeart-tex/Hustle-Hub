import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { AttentionSection } from '@/components/newtab/attention/AttentionSection';
import { GitlabSection } from '@/components/newtab/gitlab/GitlabSection';
import { GlobalStatusIndicator } from '@/components/newtab/GlobalStatusIndicator.tsx';
import { Header } from '@/components/newtab/Header';
import { JiraSection } from '@/components/newtab/jira/JiraSection';
import { NotesPage } from '@/components/newtab/notes/NotesPage';
import { SearchDialog } from '@/components/newtab/SearchDialog';
import { useHashRoute } from '@/lib/router';
import { CommentsProvider } from '@/lib/storage/comments';

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="min-w-0 flex-1 px-4 py-6">{children}</main>
    </div>
  );
};

export const NewTab = () => {
  const { route } = useHashRoute();

  return (
    <QueryClientProvider client={queryClient}>
      <CommentsProvider>
        <AppLayout>
          {route === '/notes' ? <NotesPage /> : <DashboardPage />}
        </AppLayout>

        <GlobalStatusIndicator />
      </CommentsProvider>
    </QueryClientProvider>
  );
};

const DashboardPage = () => {
  return (
    <>
      <div className="dashboard-sections grid grid-cols-1 items-start gap-6 xl:flex">
        <div className="dashboard-section xl:sticky xl:top-6">
          <AttentionSection />
        </div>

        <div className="dashboard-section dashboard-section-gitlab xl:sticky xl:top-6">
          <GitlabSection />
        </div>

        <div className="dashboard-section xl:sticky xl:top-6">
          <JiraSection className="h-full" />
        </div>
      </div>
      <SearchDialog />
    </>
  );
};
