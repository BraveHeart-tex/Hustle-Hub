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
}

export interface NoteTask {
  id: string;
  label: string;
  completed: boolean;
}
