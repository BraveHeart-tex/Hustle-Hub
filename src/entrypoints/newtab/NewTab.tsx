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
              {/* LEFT — Attention, sticky */}
              <div className="xl:sticky xl:top-6">
                <AttentionSection />
              </div>

              {/* MIDDLE — GitLab, sticky */}
              <div className="xl:sticky xl:top-6">
                <GitlabSection />
              </div>

              {/* RIGHT — fixed height column, Jira gets most space, Notes always visible at bottom */}
              <div
                className="xl:sticky xl:top-6 flex flex-col gap-6"
                style={{ height: 'calc(100vh - 110px)' }}
              >
                {/* Jira takes available space but never pushes Notes out */}
                <div className="min-h-0 flex-1">
                  <JiraSection className="h-full" />
                </div>

                {/* Notes has a fixed max so it's always present */}
                <div className="shrink-0 max-h-64">
                  <NotesSection className="max-h-64" />
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
