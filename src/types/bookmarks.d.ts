export interface FlatBookmark {
  id: string;
  title: string;
  url: string;
  parentId?: string;
  path?: string[];
}
export interface BookmarkNode {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: BookmarkNode[];
}
