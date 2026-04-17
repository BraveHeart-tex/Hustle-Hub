import { type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  ItalicIcon,
  ListIcon,
  QuoteIcon,
  StrikethroughIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface FloatingToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}

const ToolbarButton = ({ active, children, onClick }: ToolbarButtonProps) => (
  <button
    type="button"
    onMouseDown={(event) => {
      event.preventDefault();
      onClick();
    }}
    className={cn(
      'rounded p-1.5 transition-colors hover:bg-accent',
      active && 'bg-accent text-accent-foreground',
    )}
  >
    {children}
  </button>
);

const FloatingToolbar = ({ editor }: FloatingToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu editor={editor}>
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <BoldIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <ItalicIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
        >
          <StrikethroughIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
        >
          <CodeIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive('heading', { level: 1 })}
        >
          <Heading1Icon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <ListIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <QuoteIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>
    </BubbleMenu>
  );
};

export default FloatingToolbar;
