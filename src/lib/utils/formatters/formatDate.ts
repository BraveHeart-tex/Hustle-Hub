const defaultDateFormatOptions: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  year: 'numeric',
};

export function formatDate(
  dateInput: string | number | Date,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = new Date(dateInput);

  return new Intl.DateTimeFormat('en-GB', {
    ...defaultDateFormatOptions,
    ...options,
  })
    .format(date)
    .replace(',', '');
}
