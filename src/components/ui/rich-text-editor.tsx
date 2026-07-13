import { Extension } from '@tiptap/core';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  ListTodoIcon,
  Minus,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from 'lucide-react';
import { forwardRef, useImperativeHandle } from 'react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onCmdEnter?: () => void;
  onReady?: () => void;
  placeholder?: string;
  className?: string;
  showToolbar?: boolean;
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
      showToolbar = true,
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
            'overflow-hidden border border-border border-l-0 bg-transparent transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30',
            className,
          )}
        >
          {/* Toolbar */}
          {showToolbar && (
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/20">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                title="Code"
              >
                <Code className="h-3.5 w-3.5" />
              </ToolbarButton>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                isActive={editor.isActive('heading', { level: 1 })}
                title="H1"
              >
                <Heading1 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                isActive={editor.isActive('heading', { level: 2 })}
                title="H2"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                isActive={editor.isActive('heading', { level: 3 })}
                title="H3"
              >
                <Heading3 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
              >
                <List className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Numbered List"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                isActive={editor.isActive('taskList')}
                title="Task List"
              >
                <ListTodoIcon className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                title="Quote"
              >
                <Quote className="h-3.5 w-3.5" />
              </ToolbarButton>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                title="Divider"
              >
                <Minus className="h-3.5 w-3.5" />
              </ToolbarButton>
              <Separator orientation="vertical" className="h-4 mx-1" />
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
              >
                <Undo className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
              >
                <Redo className="h-3.5 w-3.5" />
              </ToolbarButton>
            </div>
          )}

          {/* Editor Content */}
          <EditorContent editor={editor} className="bg-background" />
        </div>
      </>
    );
  },
);

RichTextEditor.displayName = 'RichTextEditor';

const ToolbarButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <Button
    type="button"
    variant={isActive ? 'secondary' : 'ghost'}
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="h-7 w-7 p-0"
  >
    {children}
  </Button>
);
