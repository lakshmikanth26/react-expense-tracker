import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, Minus, PiggyBank, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const actions = [
  { type: 'expense', label: 'Expense', icon: Minus, className: 'text-expense' },
  { type: 'income', label: 'Income', icon: Plus, className: 'text-income' },
  { type: 'savings', label: 'Savings', icon: PiggyBank, className: 'text-savings' },
  { type: 'transfer', label: 'Transfer', icon: ArrowLeftRight, className: 'text-foreground' },
] as const

export function AddActionMenu({ trigger }: { trigger: ReactNode }) {
  const navigate = useNavigate()

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="center" className="w-48 p-1.5">
        <div className="flex flex-col">
          {actions.map(({ type, label, icon: Icon, className }) => (
            <Button
              key={type}
              variant="ghost"
              className="justify-start gap-2"
              onClick={() => navigate(`/add?type=${type}`)}
            >
              <Icon className={cn('size-4', className)} />
              {label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
