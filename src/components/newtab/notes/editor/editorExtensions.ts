import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';

import { SlashCommands } from '@/components/newtab/notes/editor/SlashCommands';
import { type SlashCommandOptions } from '@/components/newtab/notes/editor/SlashMenuItem';
import { MarkdownPaste } from '@/components/ui/extensions/markdown-paste';

export const createEditorExtensions = (options: SlashCommandOptions = {}) => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4],
    },
  }),
  TaskList,
  TaskItem.configure({ nested: true }),
  MarkdownPaste,
  Placeholder.configure({
    placeholder: "Write something, or type '/' for commands…",
  }),
  SlashCommands.configure(options),
];
