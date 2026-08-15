import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CurrencyInputProps {
  value: string
  onChange: (value: string) => void
  currencySymbol?: string
  autoFocus?: boolean
  className?: string
  id?: string
}

/** Large, one-handed-friendly numeric input — the first thing focused on the Add Transaction screen. */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(function CurrencyInput(
  { value, onChange, currencySymbol = '₹', autoFocus, className, id },
  ref
) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9.]/g, '')
    // Collapse any extra decimal points and cap at 2 decimal places.
    const [whole, ...rest] = raw.split('.')
    const decimals = rest.join('').slice(0, 2)
    const next = rest.length > 0 ? `${whole}.${decimals}` : whole
    onChange(next)
  }

  return (
    <div className={cn('flex items-center justify-center gap-1 py-4', className)}>
      <span className="text-3xl font-semibold text-muted-foreground">{currencySymbol}</span>
      <input
        ref={ref}
        id={id}
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        placeholder="0"
        value={value}
        onChange={handleChange}
        className="w-full max-w-[10ch] border-none bg-transparent text-center text-5xl font-semibold tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/40"
        aria-label="Amount"
      />
    </div>
  )
})
