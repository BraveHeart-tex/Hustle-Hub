import {
  type Thread,
  type ThreadCodeLine,
  type ThreadPromptData,
} from '@/components/mr-thread-panel/mr-thread-panel.types';

function cleanText(el: Element | null): string {
  return el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function parseLineNumber(cell: Element | null): number | null {
  const value = cleanText(cell);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getLineData(row: HTMLTableRowElement): ThreadCodeLine {
  const oldLineCell = row.querySelector('.old_line');
  const newLineCell = row.querySelector('.new_line');
  const codeCell = row.querySelector('.line_content');

  const isOld = row.querySelector('.line_content.old') !== null;
  const isNew = row.querySelector('.line_content.new') !== null;

  return {
    oldLine: parseLineNumber(oldLineCell),
    newLine: parseLineNumber(newLineCell),
    code: codeCell?.textContent?.replace(/\n$/, '') ?? '',
    type: isOld ? 'old' : isNew ? 'new' : 'context',
  };
}

function getNotesHolder(discussion: HTMLElement): HTMLTableRowElement | null {
  return discussion.querySelector<HTMLTableRowElement>('tr.notes_holder');
}

function getCommentedLine(
  discussion: HTMLElement,
): ThreadPromptData['commentedLine'] {
  const notesHolder = getNotesHolder(discussion);
  const previousRow = notesHolder?.previousElementSibling;

  if (!(previousRow instanceof HTMLTableRowElement)) {
    return null;
  }

  const line = getLineData(previousRow);

  return {
    oldLine: line.oldLine,
    newLine: line.newLine,
    code: line.code,
  };
}

function getCodeContext(discussion: HTMLElement, radius = 6): ThreadCodeLine[] {
  const notesHolder = getNotesHolder(discussion);

  if (!notesHolder) return [];

  const rows = Array.from(
    discussion.querySelectorAll<HTMLTableRowElement>('tr.line_holder'),
  );

  const anchorIndex = rows.findIndex(
    (row) => row.nextElementSibling === notesHolder,
  );

  if (anchorIndex === -1) {
    return rows.slice(0, 20).map(getLineData);
  }

  return rows
    .slice(Math.max(0, anchorIndex - radius), anchorIndex + radius + 1)
    .map(getLineData);
}

function getFilePath(discussion: HTMLElement): string | null {
  const fileTitle = discussion.querySelector<HTMLElement>(
    '[data-testid="file-title-container"]',
  );

  const fromDataAttr = fileTitle?.dataset.qaFileName;
  if (fromDataAttr) return fromDataAttr;

  const fromTitle = discussion
    .querySelector<HTMLElement>('[data-testid="file-name-content"]')
    ?.getAttribute('title');

  if (fromTitle) return fromTitle;

  const fromText = cleanText(
    discussion.querySelector('[data-testid="file-name-content"]'),
  );

  return fromText || null;
}

function getPermalink(discussion: HTMLElement): string | null {
  const link = discussion.querySelector<HTMLElement>('.js-btn-copy-note-link');
  return link?.dataset.clipboardText ?? null;
}

export function extractPromptData(discussion: HTMLElement): ThreadPromptData {
  const discussionId = discussion.dataset.discussionId ?? '';

  return {
    discussionId,
    filePath: getFilePath(discussion),
    permalink: getPermalink(discussion),
    commentedLine: getCommentedLine(discussion),
    codeContext: getCodeContext(discussion),
  };
}

export function buildCodexPromptForThread(thread: Thread): string {
  const comments = thread.replies
    .map((reply) => {
      const author = reply.isCurrentUser ? 'You' : reply.authorName;
      return `- ${author}: ${reply.text}`;
    })
    .join('\n');

  const context = thread.promptData.codeContext
    .map((line) => {
      const marker =
        line.type === 'old' ? '-' : line.type === 'new' ? '+' : ' ';

      const lineNumber = line.newLine ?? line.oldLine ?? '';

      return `${marker} ${String(lineNumber).padStart(4, ' ')} | ${line.code}`;
    })
    .join('\n');

  const commentedLine = thread.promptData.commentedLine;
  const commentedLineNumber = commentedLine?.newLine ?? commentedLine?.oldLine;

  return `Fix the GitLab merge request discussion below.

File:
${thread.promptData.filePath ?? 'Unknown file'}

Discussion URL:
${thread.promptData.permalink ?? window.location.href}

Reviewer comments:
${comments}

Commented line:
${commentedLineNumber ?? 'Unknown'} | ${commentedLine?.code ?? 'Unknown'}

Code context:
\`\`\`
${context}
\`\`\`

Please update the code to address the reviewer feedback only if needed. Keep the change minimal and preserve existing style.`;
}
