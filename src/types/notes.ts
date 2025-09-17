import { NotePriority } from '@/lib/constants';

export interface Note {
  id: string;
  title: string;
  content: string;
  priority: NotePriority;
  createdAt?: string;
  completed?: boolean;
}
