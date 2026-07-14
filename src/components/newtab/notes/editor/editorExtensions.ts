import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';

import { SlashCommands } from '@/components/newtab/notes/editor/SlashCommands';
import { type SlashCommandOptions } from '@/components/newtab/notes/editor/SlashMenuItem';
import { createEditorExtensions } from '@/components/ui/extensions/create-editor-extensions';
import { MarkdownPaste } from '@/components/ui/extensions/markdown-paste';

export const createNoteEditorExtensions = (options: SlashCommandOptions = {}) =>
  createEditorExtensions({
    starterKit: {
      heading: {
        levels: [1, 2, 3, 4],
      },
    },
    placeholder: "Write something, or type '/' for commands…",
    extensions: [
      TaskList,
      TaskItem.configure({ nested: true }),
      MarkdownPaste,
      SlashCommands.configure(options),
    ],
  });
