export const getCommitMessageWithoutScope = (commitMessage: string) => {
  const trimmedCommitMessage = commitMessage.trim();

  const releasePrefixWithMessageMatch = trimmedCommitMessage.match(
    /^Production Release For\s+\S*:\s*(.+)$/i,
  );
  if (releasePrefixWithMessageMatch) {
    return releasePrefixWithMessageMatch[1].trim();
  }

  const releasePrefixBareMatch = trimmedCommitMessage.match(
    /^Production Release For\s+\S*$/i,
  );
  if (releasePrefixBareMatch) return '';

  const alreadyFormattedTitleMatch =
    trimmedCommitMessage.match(/^[A-Z]+-\d+:\s*(.+)$/);

  if (alreadyFormattedTitleMatch) return alreadyFormattedTitleMatch[1].trim();

  const conventionalCommitMatch = trimmedCommitMessage.match(
    /^[a-z]+(?:\([^)]+\))?!?:\s*(.+)$/i,
  );

  if (!conventionalCommitMatch) return trimmedCommitMessage;

  return conventionalCommitMatch[1].trim();
};
