import { BookmarkNode } from '@/types/bookmarks';
import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  geetBookmarks(): BookmarkNode[];
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<ProtocolMap>();
