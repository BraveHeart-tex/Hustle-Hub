import { Extension, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { Suggestion, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import tippy, { type Instance, type Props } from 'tippy.js';

import { type SlashCommandOptions, type SlashMenuItem } from './SlashMenuItem';
import SlashMenuRenderer, {
  type SlashMenuRendererProps,
  type SlashMenuRendererRef,
} from './SlashMenuRenderer';

const deleteRange = (range: Range) => {
  return {
    from: range.from,
    to: range.to,
  };
};

const getClientRect =
  (clientRect: (() => DOMRect | null) | null | undefined) => () =>
    clientRect?.() ?? new DOMRect();

const slashMenuItems: SlashMenuItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'Heading1Icon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleHeading({
          level: 1,
        })
        .run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'Heading2Icon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleHeading({
          level: 2,
        })
        .run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'Heading3Icon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleHeading({
          level: 3,
        })
        .run();
    },
  },
  {
    title: 'Heading 4',
    description: 'Smallest heading',
    icon: 'Heading4Icon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleHeading({
          level: 4,
        })
        .run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: 'ListIcon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleBulletList()
        .run();
    },
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    icon: 'ListOrderedIcon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleOrderedList()
        .run();
    },
  },
  {
    title: 'Todo List',
    description: 'Checkable task list',
    icon: 'ListTodoIcon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleTaskList()
        .run();
    },
  },
  {
    title: 'Blockquote',
    description: 'Indented quote',
    icon: 'QuoteIcon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleBlockquote()
        .run();
    },
  },
  {
    title: 'Code Block',
    description: 'Monospace code',
    icon: 'Code2Icon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .toggleCodeBlock()
        .run();
    },
  },
  {
    title: 'Divider',
    description: 'Horizontal rule',
    icon: 'MinusIcon',
    command: (editor, range) => {
      editor
        .chain()
        .focus()
        .deleteRange(deleteRange(range))
        .setHorizontalRule()
        .run();
    },
  },
];

const createSlashMenuItems = (
  options: SlashCommandOptions,
): SlashMenuItem[] => {
  if (!options.onWorkItemLink) {
    return slashMenuItems;
  }

  return [
    ...slashMenuItems,
    {
      title: 'Work Item',
      description: 'Link a Jira ticket or GitLab MR',
      icon: 'LinkIcon',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(deleteRange(range)).run();
        options.onWorkItemLink?.();
      },
    },
  ];
};

export const SlashCommands = Extension.create<SlashCommandOptions>({
  name: 'slashCommands',

  addOptions() {
    return {};
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashMenuItem, SlashMenuItem>({
        editor: this.editor,
        char: '/',
        items: ({ query }) => {
          const normalizedQuery = query.toLowerCase();

          return createSlashMenuItems(this.options).filter((item) =>
            item.title.toLowerCase().includes(normalizedQuery),
          );
        },
        command: ({ editor, range, props }) => {
          props.command(editor, range);
        },
        render: () => {
          let component: ReactRenderer<
            SlashMenuRendererRef,
            SlashMenuRendererProps
          >;
          let popup: Instance<Props> | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenuRenderer, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy(document.body, {
                getReferenceClientRect: getClientRect(props.clientRect),
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate: (props) => {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup?.setProps({
                getReferenceClientRect: getClientRect(props.clientRect),
              });
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              return component.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              popup?.destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
