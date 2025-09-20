import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import CalendarSection from '@/components/newtab/calendar/CalendarSection';
import GitlabSection from '@/components/newtab/gitlab/GitlabSection';
import Header from '@/components/newtab/Header';
import JiraSection from '@/components/newtab/jira/JiraSection';
import NotesSection from '@/components/newtab/NotesSection';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

const NewTab = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 min-w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <CalendarSection />
            </div>
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
    </QueryClientProvider>
  );
};

export default NewTab;
