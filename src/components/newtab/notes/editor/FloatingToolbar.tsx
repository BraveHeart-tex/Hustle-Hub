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

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  active: boolean;
  ariaKeyShortcuts: string;
  children: ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
  shortcut: string;
}

const ToolbarButton = ({
  active,
  ariaKeyShortcuts,
  children,
  disabled,
  label,
  onClick,
  shortcut,
}: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        type="button"
        variant={active ? 'secondary' : 'ghost'}
        size="icon"
        aria-keyshortcuts={ariaKeyShortcuts}
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onMouseDown={(event) => {
          event.preventDefault();
        }}
        onClick={onClick}
        className="size-7"
      >
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <span>{label}</span>
      <span className="ml-2 text-background/70">{shortcut}</span>
    </TooltipContent>
  </Tooltip>
);

export const FloatingToolbar = ({ editor }: FloatingToolbarProps) => {
  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu editor={editor}>
      <TooltipProvider>
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-floating">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            disabled={!editor.can().toggleBold()}
            label="Bold"
            ariaKeyShortcuts="Control+B Meta+B"
            shortcut="⌘/Ctrl+B"
          >
            <BoldIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            disabled={!editor.can().toggleItalic()}
            label="Italic"
            ariaKeyShortcuts="Control+I Meta+I"
            shortcut="⌘/Ctrl+I"
          >
            <ItalicIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            disabled={!editor.can().toggleStrike()}
            label="Strikethrough"
            ariaKeyShortcuts="Control+Shift+S Meta+Shift+S"
            shortcut="⌘/Ctrl+Shift+S"
          >
            <StrikethroughIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            disabled={!editor.can().toggleCode()}
            label="Inline code"
            ariaKeyShortcuts="Control+E Meta+E"
            shortcut="⌘/Ctrl+E"
          >
            <CodeIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive('heading', { level: 1 })}
            disabled={!editor.can().toggleHeading({ level: 1 })}
            label="Heading 1"
            ariaKeyShortcuts="Control+Alt+1 Meta+Alt+1"
            shortcut="⌘/Ctrl+Alt+1"
          >
            <Heading1Icon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            disabled={!editor.can().toggleBulletList()}
            label="Bullet list"
            ariaKeyShortcuts="Control+Shift+8 Meta+Shift+8"
            shortcut="⌘/Ctrl+Shift+8"
          >
            <ListIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            disabled={!editor.can().toggleBlockquote()}
            label="Blockquote"
            ariaKeyShortcuts="Control+Shift+B Meta+Shift+B"
            shortcut="⌘/Ctrl+Shift+B"
          >
            <QuoteIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      </TooltipProvider>
    </BubbleMenu>
  );
};
