export const getTaskAge = (createdAt: string): string => {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months}mo old`;
  if (weeks > 0) return `${weeks}w old`;
  if (days > 0) return `${days}d old`;
  if (hours > 0) return `${hours}h old`;
  return `${minutes}m old`;
};
