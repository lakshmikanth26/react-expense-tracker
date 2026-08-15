import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { formatMonthLabel } from '@/lib/dates'
import type { SavingsGoal } from '@/types'

interface GoalCardProps {
  goal: SavingsGoal
  onEdit: () => void
  onDelete: () => void
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const target = Number(goal.target_amount)
  const current = Number(goal.current_amount)
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const remaining = Math.max(target - current, 0)

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <span className="text-xl leading-none">{goal.icon ?? '🎯'}</span>
          {goal.name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Goal actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" /> Edit / add funds
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-muted-foreground">
        Target: {formatCurrency(target)} · Current: {formatCurrency(current)}
      </p>
      <Progress value={percentage} className="mt-2" />
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatPercent(percentage, 0)}</span>
        <span>
          {remaining > 0 ? `${formatCurrency(remaining)} remaining` : 'Goal reached'}
          {goal.target_date && ` · by ${formatMonthLabel(goal.target_date)}`}
        </span>
      </div>
    </div>
  )
}
