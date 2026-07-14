import { Extension } from '@tiptap/core';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { forwardRef, useImperativeHandle } from 'react';

import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onCmdEnter?: () => void;
  onReady?: () => void;
  placeholder?: string;
  className?: string;
}

export interface TiptapRef {
  editor: Editor | null;
}

export const RichTextEditor = forwardRef<TiptapRef, RichTextEditorProps>(
  (
    {
      content = '',
      onChange,
      placeholder = 'Start typing...',
      className,
      onReady,
      onCmdEnter,
    }: RichTextEditorProps,
    ref,
  ) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
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
        }),
        Extension.create({
          name: 'cmdEnterHandler',
          addKeyboardShortcuts() {
            return {
              'Mod-Enter': () => {
                onCmdEnter?.();
                return true;
              },
            };
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        TaskList.configure({
          itemTypeName: 'taskItem',
        }),
        TaskItem.configure({
          nested: true,
        }),
      ],
      content,
      editorProps: {
        attributes: {
          class: 'tiptap min-h-[200px] px-3 py-2.5',
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
      <>
        <div
          className={cn(
            'overflow-hidden border border-border border-l-0 bg-transparent transition-colors motion-reduce:transition-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30',
            className,
          )}
        >
          {/* Editor Content */}
          <EditorContent editor={editor} className="bg-background" />
        </div>
      </>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';
