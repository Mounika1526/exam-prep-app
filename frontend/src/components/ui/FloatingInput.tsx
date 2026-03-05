import { forwardRef, useState, useId } from 'react'
import { cn } from '@/lib/utils'

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  rightElement?: React.ReactNode
}

/**
 * Input with a floating label that rises to the top border on focus or when filled.
 * Accepts all standard input props plus `label`, `error`, and `rightElement`.
 * Works seamlessly with react-hook-form's `register()` spread.
 */
export const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  (
    { label, error, rightElement, className, id: propId, onChange, onFocus, onBlur, ...props },
    ref,
  ) => {
    const generatedId = useId()
    const id = propId ?? generatedId
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(false)
    const isFloating = isFocused || hasValue

    return (
      <div className="relative">
        <input
          id={id}
          ref={ref}
          className={cn(
            'block w-full h-14 rounded-md border border-input bg-background px-3 pt-5 pb-1.5 text-sm',
            'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            rightElement && 'pr-10',
            error && 'border-destructive focus:ring-destructive',
            className,
          )}
          onChange={(e) => {
            setHasValue(e.target.value.length > 0)
            onChange?.(e)
          }}
          onFocus={(e) => {
            setIsFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            onBlur?.(e)
          }}
          {...props}
        />

        <label
          htmlFor={id}
          className={cn(
            'absolute left-3 pointer-events-none select-none transition-all duration-150',
            isFloating
              ? cn(
                  'top-1.5 text-[10px] font-medium',
                  error ? 'text-destructive' : isFocused ? 'text-primary' : 'text-muted-foreground',
                )
              : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground',
          )}
        >
          {label}
        </label>

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}

        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    )
  },
)
FloatingInput.displayName = 'FloatingInput'
