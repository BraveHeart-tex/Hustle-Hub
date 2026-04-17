import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Outlet, Route, Routes } from 'react-router-dom';

import AttentionSection from '@/components/newtab/attention/AttentionSection';
import GitlabSection from '@/components/newtab/gitlab/GitlabSection';
import GlobalStatusIndicator from '@/components/newtab/GlobalStatusIndicator.tsx';
import Header from '@/components/newtab/Header';
import JiraSection from '@/components/newtab/jira/JiraSection';
import NotesPage from '@/components/newtab/notes/NotesPage';
import SearchDialog from '@/components/newtab/SearchDialog';
import { Toaster } from '@/components/ui/sonner';
import { CommentsProvider } from '@/lib/storage/comments';

const queryClient = new QueryClient();

const AppLayout = () => {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="min-w-0 flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </>
  );
};

const NewTab = () => {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <CommentsProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="notes" element={<NotesPage />} />
            </Route>
          </Routes>

          <Toaster />
          <GlobalStatusIndicator />
        </CommentsProvider>
      </QueryClientProvider>
    </HashRouter>
  );
};

const DashboardPage = () => {
  return (
    <>
      <div
        className="
      grid grid-cols-1 gap-6
      xl:grid-cols-[minmax(280px,1fr)_minmax(0,1fr)_minmax(280px,1fr)]
      xl:items-start
    "
      >
        <div className="xl:sticky xl:top-6">
          <AttentionSection />
        </div>

        <div className="xl:sticky xl:top-6">
          <GitlabSection />
        </div>

        <div className="xl:sticky xl:top-6">
          <JiraSection className="h-full" />
        </div>
      </div>
      <SearchDialog />
    </>
  );
};

export default NewTab;
