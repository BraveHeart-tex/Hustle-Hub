import BookmarkDialog from '@/components/content/BookmarkDialog';
import JiraShortcutDialog from '@/components/content/JiraShortcutDialog';

interface AppProps {
  portalContainer: HTMLElement;
}

export default function ContentScriptUI({ portalContainer }: AppProps) {
  return (
    <>
      <BookmarkDialog portalContainer={portalContainer} />
      <JiraShortcutDialog portalContainer={portalContainer} />
    </>
  );
}
