import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-md border border-pierre/30 bg-white px-3 py-2 text-sm text-bordeaux placeholder:text-pierre/60 focus-visible:border-or ${className}`}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={`mb-1.5 block text-sm font-medium text-bordeaux ${className}`} {...props} />
  )
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className="mt-1 text-xs text-red-700">{children}</p>
}
