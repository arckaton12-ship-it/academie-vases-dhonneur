import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost'
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-card px-5 py-2.5 text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<string, string> = {
  primary: 'bg-bordeaux text-parchemin hover:bg-[#4a2234]',
  outline: 'border border-bordeaux text-bordeaux hover:bg-bordeaux/5',
  ghost: 'text-bordeaux hover:bg-bordeaux/5',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', ...props }, ref) => (
    <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...props} />
  )
)
Button.displayName = 'Button'
