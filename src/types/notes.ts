interface NoteReference {
  type: 'calendar' | 'gitlab' | 'jira' | 'custom';
  id: string;
  url?: string;
  title?: string;
}

interface NoteItem {
  id: string;
  timestamp: number;
  content: string;
  references?: NoteReference[];
  completed?: boolean;
  tags?: string[];
  children?: NoteItem[];
}

interface DailyNotes {
  date: string;
  notes: NoteItem[];
}
