import { Extension, generateJSON } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

const BLOCK_MARKDOWN_PATTERNS = [
  /^ {0,3}#{1,3}[\t ]+\S/m,
  /^ {0,3}>[\t ]+\S/m,
  /^ {0,3}(?:-{3,}|\*{3,}|_{3,})[\t ]*$/m,
  /^ {0,3}[-+*][\t ]+\[[ xX]\][\t ]+\S/m,
  /^ {0,3}(```+|~~~+)[^\n]*\n[\s\S]*\n {0,3}\1[\t ]*$/m,
];

const INLINE_MARKDOWN_PATTERNS = [
  /(?:^|[^*])\*\*[^*\n]+\*\*(?!\*)/,
  /(?:^|[^_])__[^_\n]+__(?!_)/,
  /(?:^|[\s(])\*[^*\n]+\*(?=$|[\s.,!?;:)])/,
  /(?:^|[\s(])_[^_\n]+_(?=$|[\s.,!?;:)])/,
  /~~[^~\n]+~~/,
  /`[^`\n]+`/,
  /\[[^\]\n]+\]\((?:https?:\/\/|mailto:|\/|#)[^)\s]+(?:\s+["'][^"']+["'])?\)/,
];

const BULLET_LIST_PATTERN = /^ {0,3}[-+*][\t ]+\S/gm;
const ORDERED_LIST_PATTERN = /^ {0,3}\d{1,9}[.)][\t ]+\S/gm;

export function isLikelyMarkdown(text: string): boolean {
  if (!text.trim()) {
    return false;
  }

  if (BLOCK_MARKDOWN_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  const bulletItems = text.match(BULLET_LIST_PATTERN)?.length ?? 0;
  const orderedItems = text.match(ORDERED_LIST_PATTERN)?.length ?? 0;

  if (bulletItems >= 2 || orderedItems >= 2) {
    return true;
  }

  return INLINE_MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));
}

export function normalizeTaskListMarkup(html: string): string {
  const template = document.createElement('template');
  template.innerHTML = html;

  const taskItems = new Set(
    template.content.querySelectorAll<HTMLLIElement>('li.task-list-item'),
  );
  const taskLists = new Set<HTMLUListElement>();

  for (const checkbox of template.content.querySelectorAll<HTMLInputElement>(
    'li > input[type="checkbox"]',
  )) {
    if (checkbox.parentElement instanceof HTMLLIElement) {
      taskItems.add(checkbox.parentElement);
    }
  }

  for (const taskItem of taskItems) {
    const checkbox = taskItem.querySelector<HTMLInputElement>(
      ':scope > input[type="checkbox"]',
    );
    const taskList = taskItem.parentElement;

    taskItem.dataset.type = 'taskItem';
    taskItem.dataset.checked = String(checkbox?.checked ?? false);
    checkbox?.remove();

    if (taskList instanceof HTMLUListElement) {
      taskLists.add(taskList);
    }
  }

  for (const taskList of taskLists) {
    taskList.dataset.type = 'taskList';

    for (const listItem of taskList.querySelectorAll<HTMLLIElement>(
      ':scope > li',
    )) {
      listItem.dataset.type = 'taskItem';
      listItem.dataset.checked ||= 'false';
    }
  }

  return template.innerHTML;
}

function markdownToSanitizedHtml(markdown: string): string {
  const html = marked.parse(markdown, {
    async: false,
    breaks: false,
    gfm: true,
  });
  const normalizedHtml = normalizeTaskListMarkup(html);

  return DOMPurify.sanitize(normalizedHtml, {
    ADD_ATTR: ['data-checked', 'data-type'],
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['style'],
    RETURN_TRUSTED_TYPE: false,
    USE_PROFILES: { html: true },
  });
}

export const MarkdownPaste = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste: (_view, event) => {
            const markdown = event.clipboardData?.getData('text/plain') ?? '';

            if (
              !isLikelyMarkdown(markdown) ||
              editor.isActive('code') ||
              editor.isActive('codeBlock')
            ) {
              return false;
            }

            try {
              const sanitizedHtml = markdownToSanitizedHtml(markdown);
              const content = generateJSON(
                sanitizedHtml,
                editor.extensionManager.extensions,
              );
              const inserted = editor.commands.insertContent(content);

              if (!inserted) {
                return false;
              }

              event.preventDefault();
              return true;
            } catch (error) {
              if (import.meta.env.DEV) {
                console.warn('Markdown paste parsing failed.', error);
              }

              return false;
            }
          },
        },
      }),
    ];
  },
});
