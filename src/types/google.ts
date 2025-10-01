import { ApiResponse } from '@/types/api';

export interface GoogleCalendarEventsResponse {
  kind: 'calendar#events';
  etag: string;
  summary: string;
  description?: string;
  updated: string; // ISO date string
  timeZone: string;
  accessRole: 'owner' | 'writer' | 'reader' | 'freeBusyReader';
  defaultReminders: GoogleCalendarReminder[];
  items: GoogleCalendarEvent[];
}

export interface GoogleCalendarReminder {
  method: 'email' | 'popup';
  minutes: number;
}

export interface GoogleCalendarEvent {
  kind: 'calendar#event';
  etag: string;
  id: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  created: string; // ISO date string
  updated: string; // ISO date string
  summary?: string;
  description?: string;
  location?: string;
  creator?: GoogleCalendarUser;
  organizer?: GoogleCalendarOrganizer;
  start: GoogleCalendarDateTime;
  end: GoogleCalendarDateTime;
  recurringEventId?: string;
  originalStartTime?: GoogleCalendarDateTime;
  iCalUID: string;
  sequence: number;
  attendees?: GoogleCalendarAttendee[];
  currentUserResponse?: GoogleCalendarAttendee['responseStatus'];
  hangoutLink?: string;
  conferenceData?: GoogleCalendarConferenceData;
  reminders?: { useDefault: boolean; overrides?: GoogleCalendarReminder[] };
  eventType?: 'default' | 'outOfOffice' | 'focusTime';
}

export interface GoogleCalendarUser {
  email: string;
  displayName?: string;
  self?: boolean;
}

export interface GoogleCalendarOrganizer extends GoogleCalendarUser {
  organizer?: boolean;
}

export interface GoogleCalendarDateTime {
  dateTime?: string; // ISO date string
  date?: string; // all-day events
  timeZone?: string;
}

export interface GoogleCalendarAttendee extends GoogleCalendarUser {
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
}

export interface GoogleCalendarConferenceData {
  entryPoints?: GoogleCalendarEntryPoint[];
  conferenceSolution?: {
    key: { type: 'hangoutsMeet' | string };
    name: string;
    iconUri: string;
  };
  conferenceId?: string;
}

export interface GoogleCalendarEntryPoint {
  entryPointType: 'video' | 'phone' | 'sip' | 'more';
  uri: string;
  label?: string;
  pin?: string;
  regionCode?: string;
}

export type GoogleCalendarAPIResponse =
  ApiResponse<GoogleCalendarEventsResponse>;
