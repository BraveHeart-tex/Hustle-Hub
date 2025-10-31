export const formatGitLabLabel = (label: string): string => {
  return label
    .replace(/::/g, ': ')
    .split(/[:\s]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
