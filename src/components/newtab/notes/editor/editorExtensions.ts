import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';

import { SlashCommands } from './SlashCommands';
import { type SlashCommandOptions } from './SlashMenuItem';

export const createEditorExtensions = (options: SlashCommandOptions = {}) => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({
    placeholder: "Write something, or type '/' for commands…",
  }),
  SlashCommands.configure(options),
];
