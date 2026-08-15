import { useState } from 'react'
import { ChevronRight, Target } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { SavingsGoal } from '@/types'

interface GoalSelectorProps {
  goals: SavingsGoal[]
  value: string | null
  onChange: (goalId: string | null) => void
}

/** Optional: a savings or expense transaction doesn't have to count toward a goal — "No goal" (null) is first-class. */
export function GoalSelector({ goals, value, onChange }: GoalSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = goals.find((g) => g.id === value)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{selected?.icon ?? <Target className="size-4 text-muted-foreground" />}</span>
            <span className="font-medium">{selected?.name ?? 'No goal'}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Goal</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1.5 pt-2 pb-6">
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className="flex items-center gap-3 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
            data-selected={value === null}
          >
            <Target className="size-5 text-muted-foreground" />
            <span className="font-medium">No goal</span>
          </button>
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              onClick={() => {
                onChange(goal.id)
                setOpen(false)
              }}
              className="flex items-center gap-3 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
              data-selected={goal.id === value}
            >
              <span className="text-lg leading-none">{goal.icon ?? '🎯'}</span>
              <span className="font-medium">{goal.name}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
