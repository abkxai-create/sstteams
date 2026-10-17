/**
 * UAE Time (Asia/Dubai, UTC+4) utilities
 */

export function getTodayUAEDateString(): string {
  const d = new Date();
  const uaeDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }); // YYYY-MM-DD
  return uaeDateStr;
}

export function formatUAETime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Dubai',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function formatUAEDateLong(dateString: string): string {
  // dateString is YYYY-MM-DD
  const [year, month, day] = dateString.split('-').map(Number);
  // Create Date object representing this day at noon UTC to avoid edge shifts
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Dubai',
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatUAEDateShort(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getYesterdayDateString(currentDateStr: string): string {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day - 1, 12, 0, 0));
  return d.toISOString().slice(0, 10);
}

export function getTomorrowDateString(currentDateStr: string): string {
  const [year, month, day] = currentDateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));
  return d.toISOString().slice(0, 10);
}
