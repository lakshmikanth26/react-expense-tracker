import { Receipt } from 'lucide-react'
import { TransactionRow } from './TransactionRow'
import { EmptyState } from '@/components/common/EmptyState'
import { groupByDateDescending } from '@/lib/calculations'
import { formatDayLabel } from '@/lib/dates'
import type { TransactionWithRelations } from '@/types'

interface TransactionListProps {
  transactions: TransactionWithRelations[]
  onEdit: (transaction: TransactionWithRelations) => void
  onDuplicate: (transaction: TransactionWithRelations) => void
  onDelete: (transaction: TransactionWithRelations) => void
  emptyTitle?: string
  emptyDescription?: string
}

export function TransactionList({
  transactions,
  onEdit,
  onDuplicate,
  onDelete,
  emptyTitle = 'No transactions yet',
  emptyDescription = "Start tracking your family's spending.",
}: TransactionListProps) {
  if (transactions.length === 0) {
    return <EmptyState icon={Receipt} title={emptyTitle} description={emptyDescription} />
  }

  const groups = groupByDateDescending(transactions)

  return (
    <div className="divide-y">
      {groups.map(([dateKey, dayTransactions]) => (
        <div key={dateKey} className="py-2">
          <p className="py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {formatDayLabel(dateKey)}
          </p>
          <div className="divide-y">
            {dayTransactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
