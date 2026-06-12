export function formatDeadline(isoDate?: string | null): string {
  if (!isoDate) return 'Не визначено';
  return new Date(isoDate).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Kiev',
  });
}
