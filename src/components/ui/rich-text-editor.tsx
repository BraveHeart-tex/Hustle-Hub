import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
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

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  showToolbar?: boolean;
}

const RichTextEditor = ({
  content = '',
  onChange,
  placeholder = 'Start typing...',
  className,
  showToolbar = true,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
          HTMLAttributes: {
            class: 'font-bold text-foreground tracking-tight',
          },
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc list-outside space-y-1 marker:text-primary/50',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class:
              'list-decimal list-outside space-y-1 marker:text-primary/50 marker:font-medium',
          },
        },
        link: {
          HTMLAttributes: {
            class:
              'text-primary underline decoration-primary/20 underline-offset-2 transition-colors hover:text-primary/80 hover:decoration-primary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm',
          },
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
        HTMLAttributes: {
          class:
            'list-none marker:text-primary/50 marker:font-medium flex items-center gap-2',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-3 py-2.5',
          // Headings with tighter spacing
          'prose-headings:font-semibold prose-headings:text-foreground prose-headings:tracking-tight',
          'prose-h1:text-2xl prose-h1:mb-3 prose-h1:mt-4',
          'prose-h2:text-xl prose-h2:mb-2.5 prose-h2:mt-3.5',
          'prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-3',
          // Paragraphs
          'prose-p:text-foreground prose-p:leading-normal prose-p:my-2',
          // Links
          'prose-a:text-primary prose-a:decoration-primary/20 prose-a:underline-offset-2 prose-a:transition-colors hover:prose-a:text-primary/80 hover:prose-a:decoration-primary/40',
          // Strong and emphasis
          'prose-strong:text-foreground prose-strong:font-semibold',
          'prose-em:text-foreground prose-em:italic',
          // Inline code
          'prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.875em] prose-code:font-mono prose-code:before:content-none prose-code:after:content-none',
          // Code blocks
          'prose-pre:bg-muted prose-pre:text-foreground prose-pre:rounded-md prose-pre:my-3 prose-pre:shadow-sm',
          // Blockquotes
          'prose-blockquote:border-l-2 prose-blockquote:border-primary/60 prose-blockquote:bg-muted/20 prose-blockquote:pl-3 prose-blockquote:py-0.5 prose-blockquote:my-2 prose-blockquote:not-italic prose-blockquote:text-muted-foreground',
          // Lists
          'prose-ul:my-2 prose-ul:text-foreground',
          'prose-ol:my-2 prose-ol:text-foreground',
          'prose-li:text-foreground prose-li:my-0.5',
          // Task lists - base container
          '[&_ul[data-type="taskList"]]:list-none [&_ul[data-type="taskList"]]:ml-0 [&_ul[data-type="taskList"]]:pl-0 [&_ul[data-type="taskList"]]:space-y-1.5',
          // Nested task lists
          '[&_li[data-type="taskItem"]_ul[data-type="taskList"]]:mt-1.5 [&_li[data-type="taskItem"]_ul[data-type="taskList"]]:ml-6',
          // Task items - flex container
          '[&_li[data-type="taskItem"]]:flex [&_li[data-type="taskItem"]]:gap-2 [&_li[data-type="taskItem"]]:items-start',
          // Task item label wrapper
          '[&_li[data-type="taskItem"]>label]:flex [&_li[data-type="taskItem"]>label]:items-start [&_li[data-type="taskItem"]>label]:gap-2 [&_li[data-type="taskItem"]>label]:cursor-pointer [&_li[data-type="taskItem"]>label]:flex-1',
          // Checkbox styling
          '[&_li[data-type="taskItem"]>label>input[type="checkbox"]]:mt-0.5 [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:w-4 [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:h-4 [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:shrink-0',
          '[&_li[data-type="taskItem"]>label>input[type="checkbox"]]:rounded [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:border [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:border-input [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:cursor-pointer',
          '[&_li[data-type="taskItem"]>label>input[type="checkbox"]]:transition-colors [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:focus-visible:outline-none [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:focus-visible:ring-2 [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:focus-visible:ring-ring [&_li[data-type="taskItem"]>label>input[type="checkbox"]]:focus-visible:ring-offset-2',
          '[&_li[data-type="taskItem"]>label>input[type="checkbox"]:checked]:bg-primary [&_li[data-type="taskItem"]>label>input[type="checkbox"]:checked]:border-primary',
          // Task content wrapper
          '[&_li[data-type="taskItem"]>label>div]:flex-1 [&_li[data-type="taskItem"]>label>div]:min-w-0',
          '[&_li[data-type="taskItem"]>label>div>p]:my-0 [&_li[data-type="taskItem"]>label>div>p]:leading-normal',
          // Completed task styling
          '[&_li[data-type="taskItem"][data-checked="true"]>label>div]:line-through [&_li[data-type="taskItem"][data-checked="true"]>label>div]:text-muted-foreground',
          // Horizontal rules
          'prose-hr:border-border prose-hr:my-4',
          // Images
          'prose-img:rounded-md prose-img:my-3',
        ),
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          'border border-border rounded-lg overflow-hidden bg-transparent dark:bg-input/30',
          className,
        )}
      >
        {/* Toolbar */}
        {showToolbar && (
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="Code"
            >
              <Code className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              isActive={editor.isActive('taskList')}
              title="Task List"
            >
              <ListTodoIcon className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <Minus className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>
          </div>
        )}

        {/* Editor Content */}
        <EditorContent editor={editor} className="bg-background" />
      </div>
    </>
  );
};

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
    variant={isActive ? 'outline' : 'ghost'}
    size="sm"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="h-8 w-8 p-0"
  >
    {children}
  </Button>
);

export default RichTextEditor;
