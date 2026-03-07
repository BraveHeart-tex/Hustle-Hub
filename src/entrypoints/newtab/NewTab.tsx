import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AttentionSection from '@/components/newtab/attention/AttentionSection';
import GitlabSection from '@/components/newtab/gitlab/GitlabSection';
import GlobalStatusIndicator from '@/components/newtab/GlobalStatusIndicator.tsx';
import Header from '@/components/newtab/Header';
import JiraSection from '@/components/newtab/jira/JiraSection';
import NotesSection from '@/components/newtab/NotesSection';
import SearchDialog from '@/components/newtab/SearchDialog';
import { Toaster } from '@/components/ui/sonner';
import { CommentsProvider } from '@/lib/storage/comments';

const queryClient = new QueryClient();

const NewTab = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CommentsProvider>
        <div className="min-h-screen bg-background">
          <Header />

          <main className="container mx-auto px-4 py-6 min-w-full">
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

              <div
                className="xl:sticky xl:top-6 flex flex-col gap-6"
                style={{ height: 'calc(100vh - 110px)' }}
              >
                <div className="min-h-0" style={{ flex: '6 1 0' }}>
                  <JiraSection className="h-full" />
                </div>
                <div className="min-h-0" style={{ flex: '4 1 0' }}>
                  <NotesSection className="h-full" />
                </div>
              </div>
            </div>
          </main>
        </div>

        <Toaster />
        <SearchDialog />
        <GlobalStatusIndicator />
      </CommentsProvider>
    </QueryClientProvider>
  );
};

export default NewTab;
