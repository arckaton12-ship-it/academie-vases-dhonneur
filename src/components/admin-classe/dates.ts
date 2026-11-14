export function formatShortDate(value: string): string {
  const dateStr = value.includes('T') ? value : `${value}T00:00:00`
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}