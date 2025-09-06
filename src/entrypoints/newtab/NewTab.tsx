import BookmarkDialog from '@/components/content/BookmarkDialog';
import JiraShortcutDialog from '@/components/content/JiraShortcutDialog';
import CalendarSection from '@/components/newtab/CalendarSection';
import GitlabSection from '@/components/newtab/gitlab/GitlabSection';
import Header from '@/components/newtab/Header';
import JiraSection from '@/components/newtab/JiraSection';
import NotesSection from '@/components/newtab/NotesSection';
import { Toaster } from '@/components/ui/sonner';

const NewTab = () => {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
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
      <BookmarkDialog portalContainer={document.body} />
      <JiraShortcutDialog portalContainer={document.body} />
      <Toaster />
    </>
  );
};

export default NewTab;
