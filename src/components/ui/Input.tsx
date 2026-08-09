import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux placeholder:text-pierre/60 focus-visible:border-or focus-visible:ring-1 focus-visible:ring-or/30 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus-visible:border-or/60 ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`mb-1.5 block text-sm font-medium text-bordeaux dark:text-slate-300 ${className}`} {...props} />
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className="mt-1 text-xs text-rouge">{children}</p>
}
