export const extractJiraId = (str: string): string | null => {
  const match = str.match(/[A-Z]+-\d+/);
  return match ? match[0] : null;
};
