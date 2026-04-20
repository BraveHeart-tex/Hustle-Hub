import { type NotePriority } from '@/lib/constants';

export interface Note {
  id: string;
  title: string;
  content: string;
  priority: NotePriority;
  createdAt?: string;
  updatedAt?: string;
  completed?: boolean;
  archived?: boolean;
  pinned?: boolean;
  tags?: string[];
  tasks?: NoteTask[];
  linkedItems?: NoteLinkedWorkItem[];
}

export interface NoteTask {
  id: string;
  label: string;
  completed: boolean;
}

export interface NoteLinkedWorkItem {
  id: string;
  type: 'jira' | 'gitlab';
  title: string;
  url: string;
  key?: string;
  status?: string;
  projectName?: string;
  draft?: boolean;
  approvedBy?: number;
  approvalsRequired?: number;
  conflicts?: boolean;
}
