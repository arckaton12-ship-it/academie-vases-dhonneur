export function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateLong(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}