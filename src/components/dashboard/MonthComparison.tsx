import { ArrowDown, ArrowUp } from 'lucide-react'
import { formatMonthLabel } from '@/lib/dates'
import { formatSignedCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface MonthComparisonProps {
  previousMonthKey: string
  income: number
  expense: number
  savings: number
}

function Row({ label, delta, higherIsBetter }: { label: string; delta: number; higherIsBetter: boolean }) {
  const isGood = higherIsBetter ? delta >= 0 : delta <= 0
  const Icon = delta === 0 ? null : delta > 0 ? ArrowUp : ArrowDown

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('flex items-center gap-1 font-medium tabular-nums', isGood ? 'text-income' : 'text-expense')}>
        {Icon && <Icon className="size-3.5" />}
        {formatSignedCurrency(delta)}
      </span>
    </div>
  )
}

export function MonthComparison({ previousMonthKey, income, expense, savings }: MonthComparisonProps) {
  return (
    <div className="rounded-xl border p-4">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Compared with {formatMonthLabel(previousMonthKey)}</p>
      <div className="space-y-2">
        <Row label="Income" delta={income} higherIsBetter />
        {/* A rise in expense is unfavorable, so "higher is better" is inverted here. */}
        <Row label="Expenses" delta={expense} higherIsBetter={false} />
        <Row label="Savings" delta={savings} higherIsBetter />
      </div>
    </div>
  )
}
