import { Extension } from '@tiptap/core';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import { forwardRef, useImperativeHandle } from 'react';

import { createEditorExtensions } from '@/components/ui/extensions/create-editor-extensions';
import { cn } from '@/lib/utils';

interface ModEnterOptions {
  onModEnter?: () => void;
}

const ModEnter = Extension.create<ModEnterOptions>({
  name: 'modEnter',

  addOptions() {
    return { onModEnter: undefined };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        this.options.onModEnter?.();
        return true;
      },
    };
  },
});

interface RichTextEditorProps {
  ariaLabel?: string;
  className?: string;
  content?: string;
  editorClassName?: string;
  onChange?: (content: string) => void;
  onCmdEnter?: () => void;
  onReady?: () => void;
  placeholder?: string;
}

export interface TiptapRef {
  editor: Editor | null;
}

export const RichTextEditor = forwardRef<TiptapRef, RichTextEditorProps>(
  (
    {
      ariaLabel = 'Rich text editor',
      className,
      content = '',
      editorClassName,
      onChange,
      placeholder = 'Start typing...',
      onReady,
      onCmdEnter,
    }: RichTextEditorProps,
    ref,
  ) => {
    const editor = useEditor({
      extensions: createEditorExtensions({
        starterKit: {
          heading: {
            levels: [1, 2, 3],
          },
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        },
        placeholder,
        extensions: [ModEnter.configure({ onModEnter: onCmdEnter })],
      }),
      content,
      editorProps: {
        attributes: {
          'aria-label': ariaLabel,
          class: cn(
            'tiptap min-h-32 px-3 py-2.5 text-sm outline-none',
            editorClassName,
          ),
        },
      },
      onUpdate: ({ editor }) => {
        onChange?.(editor.getHTML());
      },
      onCreate: () => {
        onReady?.();
      },
    });

    useImperativeHandle(ref, () => ({
      editor,
    }));

    if (!editor) {
      return null;
    }

    return (
      <div
        className={cn(
          'overflow-hidden rounded-md border border-input bg-background transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/20',
          className,
        )}
      >
        <EditorContent editor={editor} />
      </div>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';
