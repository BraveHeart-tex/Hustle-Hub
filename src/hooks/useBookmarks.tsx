import { flattenBookmarks } from '@/lib/utils';
import { sendMessage } from '@/messaging';
import { FlatBookmark } from '@/types/bookmarks';

export const useBookmarks = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarks, setBookmarks] = useState<FlatBookmark[]>([]);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setIsLoading(true);
      try {
        const result = await sendMessage('geetBookmarks');

        setBookmarks(flattenBookmarks(result || []));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarks();
  }, []);

  return {
    isLoading,
    bookmarks,
  };
};
