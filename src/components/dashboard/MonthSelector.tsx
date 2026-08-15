import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { addMonths, currentMonthKey, formatMonthLabel } from '@/lib/dates'

interface MonthSelectorProps {
  monthKey: string
  onChange: (monthKey: string) => void
}

export function MonthSelector({ monthKey, onChange }: MonthSelectorProps) {
  const isCurrentMonth = monthKey === currentMonthKey()

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={() => onChange(addMonths(monthKey, -1))} aria-label="Previous month">
        <ChevronLeft className="size-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-base font-semibold">
            {formatMonthLabel(monthKey)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => onChange(currentMonthKey())}>This month</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onChange(addMonths(currentMonthKey(), -1))}>Last month</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(addMonths(monthKey, 1))}
        disabled={isCurrentMonth}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
