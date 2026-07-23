export const computeReadOnly = (
  userId: string,
  assigneeIds: readonly string[],
): boolean => {
  if (!userId) return false;
  if (assigneeIds.length === 0) return false;
  if (assigneeIds.includes(userId)) return false;
  return true;
};
