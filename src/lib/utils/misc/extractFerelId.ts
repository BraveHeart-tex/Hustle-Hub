export const extractFerelId = (doc: Document): string | null => {
  const renderedDescription =
    doc.querySelector('[data-testid="description-content"]')?.textContent ?? '';

  const fromRendered = renderedDescription.match(/FEREL-\d+/)?.[0];
  if (fromRendered) return fromRendered;

  const rawDescription =
    doc.querySelector<HTMLTextAreaElement>(
      '[data-testid="description-content"] .js-task-list-field',
    )?.dataset.value ?? '';

  return rawDescription.match(/FEREL-\d+/)?.[0] ?? null;
};
