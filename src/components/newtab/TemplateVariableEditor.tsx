import { InputRule, mergeAttributes, Node } from '@tiptap/core';
import {
  type Editor,
  EditorContent,
  type JSONContent,
  useEditor,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

export interface TemplateVariableDefinition {
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
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-variable': '',
        class:
          'inline-flex items-center rounded-md bg-info text-info-foreground px-1.5 py-0.5 mx-0.5 text-[0.85em] font-semibold font-mono align-baseline select-all',
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

export const TemplateVariableEditor = ({
  value,
  onChange,
  variables,
  className,
  handleRef,
}: {
  value: string;
  onChange: (next: string) => void;
  variables: readonly TemplateVariableDefinition[];
  className?: string;
  handleRef?: React.Ref<TemplateVariableEditorHandle>;
}) => {
  const [slash, setSlash] = useState<SlashState>(CLOSED_SLASH);
  const containerRef = useRef<HTMLDivElement>(null);
  const knownKeys = useMemo(
    () => new Set(variables.map((v) => v.key)),
    [variables],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
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
      }),
      VariableNode.configure({ knownKeys }),
    ],
    content: templateStringToDoc(value),
    editorProps: {
      attributes: {
        class: cn(
          'min-h-40 max-h-64 overflow-auto px-3 py-2 font-mono text-xs leading-snug outline-none whitespace-pre-wrap',
          '[&_p]:my-0 [&_p+p]:mt-1',
          className,
        ),
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
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    setSlash({
      open: true,
      query: match[2],
      from: slashFrom,
      to: from,
      top: coords.bottom - containerRect.top + 2,
      left: coords.left - containerRect.left,
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

  return (
    <div className="relative" ref={containerRef}>
      <div
        className="rounded-md border bg-background transition-[color,box-shadow] motion-reduce:transition-none focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]"
        onKeyDownCapture={(event) => {
          if (!slash.open || filteredVariables.length === 0) return;
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
          } else if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setSlash(CLOSED_SLASH);
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {slash.open && filteredVariables.length > 0 && (
        <div
          className="absolute z-50 rounded-md border bg-popover shadow-md py-1 min-w-52"
          style={{ top: slash.top, left: slash.left }}
        >
          {filteredVariables.map((variable, index) => (
            <button
              key={variable.key}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => insertVariable(variable.key)}
              onMouseEnter={() =>
                setSlash((prev) => ({ ...prev, highlightedIndex: index }))
              }
              className={cn(
                'flex w-full flex-col items-start gap-0.5 px-3 py-1.5 text-left text-xs',
                index === slash.highlightedIndex
                  ? 'bg-accent text-accent-foreground'
                  : '',
              )}
            >
              <span className="font-mono">{`{${variable.key}}`}</span>
              <span className="text-[10px] text-muted-foreground">
                {variable.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
