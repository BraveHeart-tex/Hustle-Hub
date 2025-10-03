import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import GitlabSection from '@/components/newtab/gitlab/GitlabSection';
import GlobalStatusIndicator from '@/components/newtab/GlobalStatusIndicator.tsx';
import Header from '@/components/newtab/Header';
import JiraSection from '@/components/newtab/jira/JiraSection';
import NotesSection from '@/components/newtab/NotesSection';
import SearchDialog from '@/components/newtab/SearchDialog';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

const NewTab = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 min-w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <JiraSection />
            </div>
            <div className="md:col-span-1">
              <GitlabSection />
            </div>
            <div className="md:col-span-1">
              <NotesSection />
            </div>
          </div>
        </main>
      </div>
      <Toaster />
      <SearchDialog />
      <GlobalStatusIndicator />
    </QueryClientProvider>
  );
};

export default NewTab;
