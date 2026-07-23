export const extractJiraId = (str: string): string | null => {
  const match = str.match(/[A-Z][A-Z0-9]+-\d+/);
  return match ? match[0] : null;
};
