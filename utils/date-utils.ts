/**
 * Get date string in YYYY-MM-DD format for a given timezone
 */
export function getDateStringInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date string in YYYY-MM-DD format for a given timezone
 */
export function getTodayDateString(timezone: string): string {
  return getDateStringInTimezone(new Date(), timezone);
}




