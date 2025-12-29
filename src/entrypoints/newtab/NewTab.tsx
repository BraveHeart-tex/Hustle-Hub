import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import GitlabSection from '@/components/newtab/gitlab/GitlabSection';
import GlobalStatusIndicator from '@/components/newtab/GlobalStatusIndicator.tsx';
import Header from '@/components/newtab/Header';
import JiraSection from '@/components/newtab/jira/JiraSection';
import AllCommentsWidget from '@/components/newtab/misc/AllCommentsWidget';
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
            <AllCommentsWidget />
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div>
                <JiraSection />
              </div>
              <div>
                <GitlabSection />
              </div>
              <div>
                <NotesSection />
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
