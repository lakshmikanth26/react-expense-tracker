import { AlertTriangle, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { computeBudgetUsage } from '@/lib/calculations'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface BudgetRowProps {
  label: string
  icon?: string | null
  spent: number
  budgeted: number
  onEdit: () => void
  onDelete: () => void
}

export function BudgetRow({ label, icon, spent, budgeted, onEdit, onDelete }: BudgetRowProps) {
  const usage = computeBudgetUsage(spent, budgeted)

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          {icon && <span className="text-lg leading-none">{icon}</span>}
          {label}
          {usage.status === 'over' && <AlertTriangle className="size-4 text-expense" />}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Budget actions">
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
      <Progress
        value={Math.min(usage.percentage, 100)}
        className={cn(
          usage.status === 'over' && '[&>div]:bg-expense',
          usage.status === 'warning' && '[&>div]:bg-warning'
        )}
      />
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {formatCurrency(spent)} / {formatCurrency(budgeted)}
        </span>
        <span className={cn(usage.status === 'over' && 'font-medium text-expense')}>{formatPercent(usage.percentage, 0)}</span>
      </div>
    </div>
  )
}
