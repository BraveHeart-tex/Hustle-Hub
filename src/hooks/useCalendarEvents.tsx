import { useApi } from '@/hooks/useApi';
import { QUERY_KEYS } from '@/lib/constants';
import { ENDPOINTS } from '@/lib/endpoints';
import { ApiResponse } from '@/types/api';
import { GoogleCalendarEvent } from '@/types/google';

export interface UseCalendarEventsState {
  isLoading: boolean;
  isUnauthorized: boolean;
  isError: boolean;
  errorMessage?: string;
  events: GoogleCalendarEvent[];
}

export const useCalendarEvents = () =>
  useApi(QUERY_KEYS.CALENDAR_EVENTS, async () => {
    const res = await fetch(ENDPOINTS.CALENDAR_EVENTS);
    return (await res.json()) as ApiResponse<{ items: GoogleCalendarEvent[] }>;
  });
