import { AnimatedCounter } from '@/components/ui/AnimatedCounter'

export function ProgressStat({ label, value, animated }: { label: string; value: string; animated?: number }) {
  return (
    <div className="glass-card !p-3 text-center">
      <dt className="text-xs text-pierre dark:text-slate-400">{label}</dt>
      <dd className="font-display text-xl text-bordeaux dark:text-or">
        {animated !== undefined ? (
          <AnimatedCounter value={animated} suffix="%" className="font-display text-xl text-bordeaux dark:text-or" />
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
