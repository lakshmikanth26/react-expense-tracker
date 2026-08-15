import { useMemo } from 'react'
import { MoreVertical, Pencil, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrency } from '@/lib/formatters'
import { computeAmortizationSummary } from '@/lib/loan-calculations'
import type { Loan } from '@/types'

interface LoanCardProps {
  loan: Loan
  onEdit: () => void
  onDelete: () => void
}

export function LoanCard({ loan, onEdit, onDelete }: LoanCardProps) {
  const summary = useMemo(
    () => computeAmortizationSummary(Number(loan.current_balance), Number(loan.interest_rate), Number(loan.emi_amount)),
    [loan.current_balance, loan.interest_rate, loan.emi_amount]
  )

  const payoffDateLabel = summary.payoffDate
    ? new Date(summary.payoffDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <span className="text-xl leading-none">{loan.icon ?? '🏦'}</span>
          {loan.name}
          {loan.is_closed && (
            <span className="rounded-full bg-[var(--color-income)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-income)]">
              Paid off
            </span>
          )}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Loan actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-muted-foreground">
        EMI {formatCurrency(Number(loan.emi_amount))} · {Number(loan.interest_rate).toFixed(2)}% p.a.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Current balance</p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(Number(loan.current_balance))}</p>
        </div>

        {loan.is_closed ? (
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-lg font-semibold tabular-nums">Fully paid</p>
          </div>
        ) : summary.monthsRemaining === null ? (
          <div className="col-span-1">
            <p className="flex items-center gap-1 text-xs font-medium text-destructive">
              <TriangleAlert className="size-3.5" /> Won't pay off
            </p>
            <p className="text-xs text-muted-foreground">EMI doesn't cover the monthly interest</p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">Months remaining</p>
            <p className="text-lg font-semibold tabular-nums">{summary.monthsRemaining}</p>
          </div>
        )}
      </div>

      {!loan.is_closed && summary.monthsRemaining !== null && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Payoff date</p>
            <p className="text-sm font-medium tabular-nums">{payoffDateLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Interest remaining</p>
            <p className="text-sm font-medium tabular-nums">{formatCurrency(summary.totalInterestRemaining ?? 0)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
