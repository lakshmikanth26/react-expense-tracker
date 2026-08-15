import { MoreVertical, Pencil, Repeat, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrencyPrecise } from '@/lib/formatters'
import { formatDayLabel } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { RecurringTransaction } from '@/types'

const frequencyLabel: Record<RecurringTransaction['frequency'], string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

interface RecurringRowProps {
  recurring: RecurringTransaction
  onToggleActive: (active: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function RecurringRow({ recurring, onToggleActive, onEdit, onDelete }: RecurringRowProps) {
  const isIncome = recurring.type === 'income'
  const isSavings = recurring.type === 'savings'
  const isTransfer = recurring.type === 'transfer'

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border p-4', !recurring.is_active && 'opacity-60')}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Repeat className="size-4.5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{recurring.description || 'Recurring transaction'}</p>
        <p className="text-xs text-muted-foreground">
          {frequencyLabel[recurring.frequency]}
          {recurring.interval > 1 ? ` (every ${recurring.interval})` : ''} · Next {formatDayLabel(recurring.next_run_date)}
        </p>
      </div>
      <p
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          !isTransfer && (isIncome ? 'text-income' : isSavings ? 'text-savings' : 'text-expense')
        )}
      >
        {!isTransfer && (isIncome ? '+' : '−')}
        {formatCurrencyPrecise(Number(recurring.amount))}
      </p>
      <Switch checked={recurring.is_active} onCheckedChange={onToggleActive} aria-label="Active" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Recurring actions">
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
  )
}
