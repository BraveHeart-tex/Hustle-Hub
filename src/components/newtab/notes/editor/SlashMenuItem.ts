import { type Editor, type Range } from '@tiptap/core';

export interface SlashMenuItem {
  title: string;
  description: string;
  icon: string;
  command: (editor: Editor, range: Range) => void;
}

export interface SlashCommandOptions {
  onWorkItemLink?: () => void;
}
