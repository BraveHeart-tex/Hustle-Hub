import { BookmarkNode, FlatBookmark } from '@/types/bookmarks';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function flattenBookmarks(nodes: BookmarkNode[]): FlatBookmark[] {
  let result: any[] = [];
  for (const node of nodes) {
    if (node.url) result.push(node);
    if (node.children) result = result.concat(flattenBookmarks(node.children));
  }
  return result;
}

export function getJiraTaskUrl(issueKey: string): string {
  return `https://letgotr.atlassian.net/browse/${issueKey}`;
}
