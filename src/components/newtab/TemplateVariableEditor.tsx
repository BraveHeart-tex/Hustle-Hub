import { InputRule, mergeAttributes, Node } from '@tiptap/core';
import {
  type Editor,
  EditorContent,
  type JSONContent,
  useEditor,
} from '@tiptap/react';
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';

import { createEditorExtensions } from '@/components/ui/extensions/create-editor-extensions';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TemplateVariableDefinition {
  key: string;
  label: string;
  description: string;
}

interface VariableNodeOptions {
  knownKeys: Set<string>;
}

const VariableNode = Node.create<VariableNodeOptions>({
  name: 'variable',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { knownKeys: new Set<string>() };
  },

  addAttributes() {
    return {
      key: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-key'),
        renderHTML: (attrs) => ({ 'data-key': attrs.key }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-variable]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const isKnown = this.options.knownKeys.has(node.attrs.key);
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-variable': '',
        'data-unknown-variable': isKnown ? undefined : '',
        'aria-label': isKnown
          ? `${node.attrs.key} variable`
          : `Unknown ${node.attrs.key} variable`,
        class: cn(
          'inline-flex items-center rounded-md px-1.5 py-0.5 mx-0.5 text-[0.85em] font-semibold font-mono align-baseline select-all',
          isKnown
            ? 'bg-info text-info-foreground'
            : 'bg-warning/15 text-warning underline decoration-wavy underline-offset-2',
        ),
      }),
      `{${node.attrs.key}}`,
    ];
  },

  renderText({ node }) {
    return `{${node.attrs.key}}`;
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\{(\w+)\}$/,
        handler: ({ state, range, match }) => {
          const key = match[1];
          if (!this.options.knownKeys.has(key)) return null;
          state.tr.replaceWith(range.from, range.to, this.type.create({ key }));
        },
      }),
    ];
  },
});

const parseLineToNodes = (line: string): JSONContent[] => {
  const nodes: JSONContent[] = [];
  const regex = /\{(\w+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) {
      nodes.push({ type: 'text', text: line.slice(last, match.index) });
    }
    nodes.push({ type: 'variable', attrs: { key: match[1] } });
    last = match.index + match[0].length;
  }
  if (last < line.length) {
    nodes.push({ type: 'text', text: line.slice(last) });
  }
  return nodes;
};

const templateStringToDoc = (text: string): JSONContent => ({
  type: 'doc',
  content: text.split('\n').map((line) => {
    const content = parseLineToNodes(line);
    const paragraph: JSONContent = { type: 'paragraph' };
    if (content.length > 0) paragraph.content = content;
    return paragraph;
  }),
});

const editorToTemplateString = (editor: Editor): string => {
  const lines: string[] = [];
  editor.state.doc.forEach((paragraph) => {
    let line = '';
    paragraph.forEach((node) => {
      if (node.type.name === 'variable') {
        line += `{${node.attrs.key}}`;
      } else if (node.isText && node.text) {
        line += node.text;
      }
    });
    lines.push(line);
  });
  return lines.join('\n');
};

interface SlashState {
  open: boolean;
  query: string;
  from: number;
  to: number;
  top: number;
  left: number;
  highlightedIndex: number;
}

const CLOSED_SLASH: SlashState = {
  open: false,
  query: '',
  from: 0,
  to: 0,
  top: 0,
  left: 0,
  highlightedIndex: 0,
};

export interface TemplateVariableEditorHandle {
  insertVariable: (key: string) => void;
  setTemplateString: (text: string) => void;
  focus: () => void;
}

interface TemplateVariableEditorProps {
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  handleRef?: React.Ref<TemplateVariableEditorHandle>;
  id?: string;
  onChange: (next: string) => void;
  value: string;
  variables: readonly TemplateVariableDefinition[];
}

export const TemplateVariableEditor = ({
  value,
  onChange,
  variables,
  className,
  handleRef,
  id,
  ariaDescribedBy,
  ariaInvalid = false,
  ariaLabel = 'Template editor',
  disabled = false,
}: TemplateVariableEditorProps) => {
  const generatedId = useId();
  const editorId = id ?? generatedId;
  const menuId = `${editorId}-variables`;
  const [slash, setSlash] = useState<SlashState>(CLOSED_SLASH);
  const knownKeys = useMemo(
    () => new Set(variables.map((v) => v.key)),
    [variables],
  );

  const editor = useEditor({
    extensions: createEditorExtensions({
      starterKit: {
        blockquote: false,
        bold: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        hardBreak: false,
        heading: false,
        horizontalRule: false,
        italic: false,
        link: false,
        listItem: false,
        listKeymap: false,
        orderedList: false,
        strike: false,
        underline: false,
        dropcursor: false,
        trailingNode: false,
      },
      placeholder: "Write review instructions. Type '/' to insert a variable…",
      extensions: [VariableNode.configure({ knownKeys })],
    }),
    content: templateStringToDoc(value),
    editorProps: {
      attributes: {
        'aria-autocomplete': 'list',
        'aria-haspopup': 'listbox',
        'aria-label': ariaLabel,
        class: cn(
          'template-editor h-52 overflow-y-auto whitespace-pre-wrap px-3 py-2.5 font-mono text-sm leading-relaxed outline-none',
          '[&_p]:my-0 [&_p+p]:mt-1',
          className,
        ),
        id: editorId,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editorToTemplateString(editor));
      detectSlash(editor);
    },
    onSelectionUpdate: ({ editor }) => {
      detectSlash(editor);
    },
    onBlur: () => {
      // Delay so menu clicks can register first.
      window.setTimeout(() => setSlash(CLOSED_SLASH), 100);
    },
  });

  const detectSlash = (editor: Editor) => {
    const { from, empty } = editor.state.selection;
    if (!empty) {
      setSlash(CLOSED_SLASH);
      return;
    }
    const $pos = editor.state.doc.resolve(from);
    const paragraphStart = $pos.start($pos.depth);
    const textBefore = editor.state.doc.textBetween(paragraphStart, from, '\n');
    const match = textBefore.match(/(^|\s)[/{]([\w-]*)$/);
    if (!match) {
      setSlash(CLOSED_SLASH);
      return;
    }
    const triggerLength = match[2].length + 1;
    const slashFrom = from - triggerLength;
    const coords = editor.view.coordsAtPos(slashFrom);
    setSlash({
      open: true,
      query: match[2],
      from: slashFrom,
      to: from,
      top: coords.bottom,
      left: coords.left,
      highlightedIndex: 0,
    });
  };

  const filteredVariables = useMemo(() => {
    const q = slash.query.toLowerCase();
    return variables.filter(
      (v) =>
        v.key.toLowerCase().includes(q) || v.label.toLowerCase().includes(q),
    );
  }, [slash.query, variables]);

  useEffect(() => {
    if (slash.open && slash.highlightedIndex >= filteredVariables.length) {
      setSlash((prev) => ({ ...prev, highlightedIndex: 0 }));
    }
  }, [filteredVariables.length, slash.open, slash.highlightedIndex]);

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!disabled);
    editor.view.dom.setAttribute('aria-disabled', String(disabled));
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;

    if (ariaDescribedBy) {
      editor.view.dom.setAttribute('aria-describedby', ariaDescribedBy);
    } else {
      editor.view.dom.removeAttribute('aria-describedby');
    }
    editor.view.dom.setAttribute('aria-invalid', String(ariaInvalid));
  }, [ariaDescribedBy, ariaInvalid, editor]);

  useEffect(() => {
    if (!editor) return;

    editor.view.dom.setAttribute('aria-expanded', String(slash.open));
    if (slash.open) {
      editor.view.dom.setAttribute('aria-controls', menuId);
      if (filteredVariables.length > 0) {
        editor.view.dom.setAttribute(
          'aria-activedescendant',
          `${menuId}-${slash.highlightedIndex}`,
        );
      } else {
        editor.view.dom.removeAttribute('aria-activedescendant');
      }
    } else {
      editor.view.dom.removeAttribute('aria-controls');
      editor.view.dom.removeAttribute('aria-activedescendant');
    }
  }, [editor, filteredVariables.length, menuId, slash]);

  // Sync external value changes (e.g. reset to default).
  useEffect(() => {
    if (!editor) return;
    const current = editorToTemplateString(editor);
    if (current !== value) {
      editor.commands.setContent(templateStringToDoc(value));
    }
  }, [value, editor]);

  const insertVariable = useCallback(
    (key: string) => {
      if (!editor) return;
      if (slash.open) {
        editor
          .chain()
          .focus()
          .insertContentAt(
            { from: slash.from, to: slash.to },
            { type: 'variable', attrs: { key } },
          )
          .run();
        setSlash(CLOSED_SLASH);
        return;
      }
      editor
        .chain()
        .focus()
        .insertContent({ type: 'variable', attrs: { key } })
        .run();
    },
    [editor, slash],
  );

  useImperativeHandle(
    handleRef,
    () => ({
      insertVariable,
      setTemplateString: (text: string) => {
        editor?.commands.setContent(templateStringToDoc(text));
      },
      focus: () => editor?.commands.focus(),
    }),
    [editor, insertVariable],
  );

  if (!editor) return null;

  const virtualRef = {
    current: {
      getBoundingClientRect: () => new DOMRect(slash.left, slash.top),
    },
  };

  return (
    <div className={cn(disabled && 'opacity-50')}>
      <div
        className={cn(
          'rounded-md border border-input bg-background transition-[border-color,box-shadow] duration-150 ease-out motion-reduce:transition-none focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/20',
          ariaInvalid &&
            'border-destructive ring-[3px] ring-destructive/20 dark:ring-destructive/40',
        )}
        onKeyDownCapture={(event) => {
          if (!slash.open) return;

          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setSlash(CLOSED_SLASH);
            return;
          }

          if (filteredVariables.length === 0) return;

          if (event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation();
            setSlash((prev) => ({
              ...prev,
              highlightedIndex:
                (prev.highlightedIndex + 1) % filteredVariables.length,
            }));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            event.stopPropagation();
            setSlash((prev) => ({
              ...prev,
              highlightedIndex:
                (prev.highlightedIndex - 1 + filteredVariables.length) %
                filteredVariables.length,
            }));
          } else if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            event.stopPropagation();
            insertVariable(filteredVariables[slash.highlightedIndex].key);
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {slash.open && (
        <Popover open>
          <PopoverAnchor virtualRef={virtualRef} />
          <PopoverContent
            align="start"
            side="bottom"
            sideOffset={6}
            collisionPadding={12}
            onOpenAutoFocus={(event) => event.preventDefault()}
            onCloseAutoFocus={(event) => event.preventDefault()}
            className="w-64 p-1"
          >
            <div
              id={menuId}
              role="listbox"
              aria-label="Template variables"
              className="max-h-64 overflow-y-auto"
            >
              {filteredVariables.length === 0 && (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  No matching variables
                </p>
              )}
              {filteredVariables.map((variable, index) => (
                <button
                  id={`${menuId}-${index}`}
                  key={variable.key}
                  type="button"
                  role="option"
                  aria-selected={index === slash.highlightedIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertVariable(variable.key)}
                  onMouseEnter={() =>
                    setSlash((prev) => ({ ...prev, highlightedIndex: index }))
                  }
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-2 text-left outline-none transition-colors duration-150 ease-out motion-reduce:transition-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    index === slash.highlightedIndex &&
                      'bg-accent text-accent-foreground',
                  )}
                >
                  <span className="font-mono text-sm font-medium">{`{${variable.key}}`}</span>
                  <span className="text-xs text-muted-foreground">
                    {variable.description}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
