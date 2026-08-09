interface ProgressBarProps {
  value: number
  max: number
  color?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProgressBar({ value, max, color, showLabel = true, size = 'md', className = '' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0
  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2.5' }

  return (
    <div className={className}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-medium text-pierre dark:text-slate-400">{value}/{max}</span>
          <span className="text-[11px] font-bold text-or">{pct}%</span>
        </div>
      )}
      <div className={`overflow-hidden rounded-full bg-pierre/10 dark:bg-white/5 ${heights[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color || 'bg-gradient-to-r from-or to-olive'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
