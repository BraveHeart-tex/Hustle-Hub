import { GoogleCalendarAPIResponse, GoogleCalendarEvent } from '@/types/google';

export interface UseCalendarEventsState {
  isLoading: boolean;
  isUnauthorized: boolean;
  isError: boolean;
  errorMessage?: string;
  events: GoogleCalendarEvent[];
}

export const useCalendarEvents = () => {
  const [state, setState] = useState<UseCalendarEventsState>({
    isLoading: true,
    isUnauthorized: false,
    isError: false,
    events: [],
  });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const res = await fetch(
        'http://localhost:3001/api/data/google-calendar/events',
      );
      const data: GoogleCalendarAPIResponse = await res.json();

      if (data.success) {
        setState({
          isLoading: false,
          isUnauthorized: false,
          isError: false,
          events: data.data.items,
        });
      } else {
        setState({
          isLoading: false,
          isUnauthorized: data.error.type === 'UNAUTHORIZED',
          isError: data.error.type === 'INTERNAL',
          errorMessage: data.error.message,
          events: [],
        });
      }
    } catch (err) {
      console.error('Error fetching Google Calendar events:', err);
      setState({
        isLoading: false,
        isUnauthorized: false,
        isError: true,
        errorMessage: 'Unexpected error',
        events: [],
      });
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
};
