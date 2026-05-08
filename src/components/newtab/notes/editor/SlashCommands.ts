import { Extension, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { Suggestion, type SuggestionKeyDownProps } from '@tiptap/suggestion';

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

const slashMenuItems: SlashMenuItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'Heading1Icon',
    aliases: ['h1', 'heading', 'title'],
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
    aliases: ['h2', 'heading', 'subtitle'],
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
    aliases: ['h3', 'heading'],
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
    aliases: ['h4', 'heading'],
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
    aliases: ['bullet', 'bullets', 'ul', 'list'],
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
    aliases: ['number', 'numbered', 'ol', 'ordered', 'list'],
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
    aliases: ['todo', 'task', 'tasks', 'checkbox', 'checklist'],
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
    aliases: ['quote', 'blockquote'],
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
    aliases: ['code', 'pre', 'monospace'],
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
    aliases: ['divider', 'hr', 'rule', 'horizontal'],
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
      aliases: ['work', 'item', 'jira', 'gitlab', 'mr', 'ticket', 'link'],
      command: (editor, range) => {
        editor.chain().focus().deleteRange(deleteRange(range)).run();
        options.onWorkItemLink?.();
      },
    },
  ];
};

const normalizeSearchText = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, ' ');

const isFuzzyMatch = (value: string, query: string) => {
  let queryIndex = 0;

  for (const char of value) {
    if (char === query[queryIndex]) {
      queryIndex += 1;
    }

    if (queryIndex === query.length) {
      return true;
    }
  }

  return false;
};

const itemSearchValues = (item: SlashMenuItem) =>
  [item.title, ...(item.aliases ?? [])].map(normalizeSearchText);

const itemSearchText = (item: SlashMenuItem) =>
  normalizeSearchText(
    [item.title, item.description, ...(item.aliases ?? [])].join(' '),
  );

const scoreSlashMenuItem = (item: SlashMenuItem, query: string) => {
  if (!query) {
    return 0;
  }

  const titleAndAliases = itemSearchValues(item);
  const searchText = itemSearchText(item);
  const words = searchText.split(' ');

  if (titleAndAliases.some((value) => value === query)) {
    return 1;
  }

  if (titleAndAliases.some((value) => value.startsWith(query))) {
    return 2;
  }

  if (words.some((word) => word.startsWith(query))) {
    return 3;
  }

  if (searchText.includes(query)) {
    return 4;
  }

  if (isFuzzyMatch(searchText, query)) {
    return 5;
  }

  return null;
};

const searchSlashMenuItems = (items: SlashMenuItem[], query: string) => {
  const normalizedQuery = normalizeSearchText(query);

  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreSlashMenuItem(item, normalizedQuery),
    }))
    .filter(
      (
        result,
      ): result is { item: SlashMenuItem; index: number; score: number } =>
        result.score !== null,
    )
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map(({ item }) => item);
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
          return searchSlashMenuItems(
            createSlashMenuItems(this.options),
            query,
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

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenuRenderer, {
                props,
                editor: props.editor,
              });

              document.body.appendChild(component.element);
            },
            onUpdate: (props) => {
              component.updateProps(props);
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              return component.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              component.element.remove();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
