export const extractFerelId = (description: string | null): string | null => {
  return description?.match(/FEREL-\d+/)?.[0] ?? null;
};
