import { BookmarkNode } from '@/types/bookmarks';
import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  getBookmarks(): BookmarkNode[];
  openBookmark(bookmarkUrl: string): void;
  authorizeGitlab(): void;
  authorizeJira(): void;
  authorizeGoogleCalendar(): void;
  goHome(): void;
  gitlabOAuthCallback(params: { status: 'success' | 'error' }): void;
  googleCalendarOAuthCallback(params: { status: 'success' | 'error' }): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
