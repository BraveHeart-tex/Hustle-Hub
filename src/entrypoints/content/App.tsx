import BookmarkDialog from '@/components/content/BookmarkDialog';

interface AppProps {
  portalContainer: HTMLElement;
}

export default function App({ portalContainer }: AppProps) {
  return <BookmarkDialog portalContainer={portalContainer} />;
}
