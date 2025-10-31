const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
});

export const formatEventStartAndEnd = (
  start?: string,
  end?: string,
): string => {
  return start && end
    ? `${timeFormatter.format(new Date(start))} – ${timeFormatter.format(
        new Date(end),
      )}`
    : 'All day';
};
