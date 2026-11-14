import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`glass-input w-full px-3.5 py-2.5 text-sm text-bordeaux placeholder:text-pierre/60 focus-visible:border-or dark:text-slate-200 dark:placeholder:text-slate-500 ${className}`}
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
