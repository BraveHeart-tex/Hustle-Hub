import { useEffect, useState } from 'react';

import { type Note } from '@/types/notes';

import { type NotePriority } from '../constants';

const noteList = storage.defineItem<Note[]>('local:taskList', {
  fallback: [],
});

export const addNote = async (note: Note) => {
  const currentNotes = await noteList.getValue();
  await noteList.setValue([
    ...currentNotes,
    {
      ...note,
      createdAt: new Date().toISOString(),
      completed: false,
    },
  ]);
};

export const getNotes = async (): Promise<Note[]> => {
  return await noteList.getValue();
};

export const removeNote = async (id: string) => {
  const currentTasks = await noteList.getValue();
  await noteList.setValue(currentTasks.filter((task) => task.id !== id));
};

export const updateNote = async (noteId: string, changes: Partial<Note>) => {
  const currentNotes = await noteList.getValue();
  await noteList.setValue(
    currentNotes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            ...changes,
          }
        : note,
    ),
  );
};

const PRIORITY_ORDER: Record<NotePriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
const byPriority = (a: Note, b: Note) =>
  PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    async function getInitialTasks() {
      const initialNotes = await noteList.getValue();
      setNotes([...initialNotes].sort(byPriority));
    }
    getInitialTasks();

    const unwatch = noteList.watch((newNotes) => {
      setNotes([...newNotes].sort(byPriority));
    });

    return () => unwatch();
  }, []);

  return { notes };
};
