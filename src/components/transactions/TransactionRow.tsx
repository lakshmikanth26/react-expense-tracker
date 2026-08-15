import { ArrowLeftRight, MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { accountTypeIcons } from '@/lib/account-icons'
import { formatCurrencyPrecise } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { TransactionWithRelations } from '@/types'

interface TransactionRowProps {
  transaction: TransactionWithRelations
  onEdit: (transaction: TransactionWithRelations) => void
  onDuplicate: (transaction: TransactionWithRelations) => void
  onDelete: (transaction: TransactionWithRelations) => void
}

export function TransactionRow({ transaction: t, onEdit, onDuplicate, onDelete }: TransactionRowProps) {
  const isTransfer = t.type === 'transfer'
  const isIncome = t.type === 'income'

  const title = isTransfer
    ? `${t.account?.name ?? 'Account'} → ${t.transfer_to_account?.name ?? 'Account'}`
    : (t.description || t.category?.name || 'Transaction')

  const subtitleParts = [
    !isTransfer && t.description && t.category?.name,
    t.member?.name,
    !isTransfer ? t.account?.name : null,
  ].filter(Boolean)

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-lg">
        {isTransfer ? <ArrowLeftRight className="size-4.5 text-muted-foreground" /> : (t.category?.icon ?? '📋')}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitleParts.length > 0 && (
          <p className="truncate text-xs text-muted-foreground">{subtitleParts.join(' · ')}</p>
        )}
      </div>

      <div className="flex items-center gap-1 text-right">
        <div>
          <p
            className={cn(
              'text-sm font-semibold tabular-nums',
              isTransfer ? 'text-foreground' : isIncome ? 'text-income' : 'text-expense'
            )}
          >
            {isTransfer ? '' : isIncome ? '+' : '−'}
            {formatCurrencyPrecise(Number(t.amount))}
          </p>
          {!isTransfer && t.account && (
            <p className="text-xs text-muted-foreground">
              {accountTypeIcons[t.account.type]} {t.account.name}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-1" aria-label="Transaction actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(t)}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(t)}>
              <Copy className="size-4" /> Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(t)}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
