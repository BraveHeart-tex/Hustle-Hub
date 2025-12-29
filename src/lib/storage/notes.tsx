import { useEffect, useState } from 'react';

import { Note } from '@/types/notes';

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

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    async function getInitialTasks() {
      const initialNotes = await noteList.getValue();
      setNotes(initialNotes);
    }

    getInitialTasks();

    const unwatch = noteList.watch((newNotes) => {
      setNotes(newNotes);
    });

    return () => {
      unwatch();
    };
  }, []);

  return {
    notes,
  };
};
