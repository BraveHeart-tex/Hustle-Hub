import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const sourceDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

const mrRenderingDirectory = join(
  sourceDirectory,
  'components',
  'mr-thread-panel',
);
const hooksDirectory = join(sourceDirectory, 'hooks');
const mrThreadEntrypoint = join(
  sourceDirectory,
  'entrypoints',
  'mr-thread-panel.content.tsx',
);

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return getSourceFiles(path);
    if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
      return [];
    }
    return ['.ts', '.tsx'].includes(extname(entry.name)) ? [path] : [];
  });
}

describe('GitLab MR DOM knowledge locality', () => {
  it('keeps MR callers outside the page module free of direct DOM selectors and observers', () => {
    const files = [
      ...getSourceFiles(mrRenderingDirectory),
      ...getSourceFiles(hooksDirectory),
      mrThreadEntrypoint,
    ];
    const directDomAccess =
      /\.(?:closest|getElementById|getElementsBy(?:ClassName|Name|TagName)|matches|querySelector(?:All)?)\b|\bMutationObserver\b/;

    const filesWithDirectDomAccess = files.filter((file) =>
      directDomAccess.test(readFileSync(file, 'utf8')),
    );

    expect(filesWithDirectDomAccess).toEqual([]);
  });
});
