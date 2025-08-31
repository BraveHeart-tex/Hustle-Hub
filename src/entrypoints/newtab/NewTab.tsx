import CalendarSection from '@/components/CalendarSection';
import GitlabSection from '@/components/GitlabSection';
import Header from '@/components/Header';
import JiraSection from '@/components/JiraSection';
import NotesSection from '@/components/NotesSection';

const NewTab = () => {
  return (
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
  );
};

export default NewTab;
