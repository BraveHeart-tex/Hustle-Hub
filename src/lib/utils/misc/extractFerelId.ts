export const extractFerelId = (doc: Document): string | null => {
  const description =
    doc.querySelector<HTMLTextAreaElement>(
      '[data-testid="description-content"] .js-task-list-field',
    )?.dataset.value ?? '';

  return description.match(/FEREL-\d+/)?.[0] ?? null;
};
