import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-card px-5 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none btn-press'

const variants: Record<string, string> = {
  primary: 'bg-bordeaux text-parchemin hover:bg-olive hover:shadow-lg hover:shadow-bordeaux/20 dark:bg-or dark:text-slate-900 dark:hover:bg-or-light dark:hover:shadow-or/20',
  outline: 'border border-bordeaux text-bordeaux hover:bg-bordeaux/5 hover:border-bordeaux/80 dark:border-or/40 dark:text-or dark:hover:bg-or/10 dark:hover:border-or',
  ghost: 'text-bordeaux hover:bg-bordeaux/5 dark:text-slate-300 dark:hover:bg-white/5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />
  )
)
Button.displayName = 'Button'
