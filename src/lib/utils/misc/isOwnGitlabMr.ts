export const isOwnGitlabMr = (
  authorId: number,
  currentUserId: string | undefined,
): boolean => {
  if (!currentUserId) return true;

  const parsedCurrentUserId = Number(currentUserId);
  if (Number.isNaN(parsedCurrentUserId)) return true;

  return authorId === parsedCurrentUserId;
};
