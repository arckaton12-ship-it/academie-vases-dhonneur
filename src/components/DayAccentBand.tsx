export function DayAccentBand() {
  const day = new Date().getDay()
  const isSunday = day === 0

  return (
    <div
      className={`h-1 w-full ${
        isSunday
          ? 'bg-gradient-to-r from-or/60 via-or to-or/60'
          : 'bg-gradient-to-r from-sable/30 via-sable/50 to-sable/30'
      }`}
      aria-hidden="true"
    />
  )
}
