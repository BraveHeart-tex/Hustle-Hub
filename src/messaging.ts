import { BookmarkNode } from '@/types/bookmarks';
import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  getBookmarks(): BookmarkNode[];
  openBookmark(bookmarkUrl: string): void;
  authorizeGitlab(): void;
  goHome(): void;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
