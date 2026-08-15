import { useState } from 'react'
import { ChevronRight, Landmark } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Loan } from '@/types'

interface LoanSelectorProps {
  loans: Loan[]
  value: string | null
  onChange: (loanId: string | null) => void
}

/** Optional: an expense transaction doesn't have to count toward a loan payoff — "No loan" (null) is first-class. */
export function LoanSelector({ loans, value, onChange }: LoanSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = loans.find((l) => l.id === value)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex items-center gap-2">
            <span className="text-lg leading-none">{selected?.icon ?? <Landmark className="size-4 text-muted-foreground" />}</span>
            <span className="font-medium">{selected?.name ?? 'No loan'}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Loan</SheetTitle>
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
            <Landmark className="size-5 text-muted-foreground" />
            <span className="font-medium">No loan</span>
          </button>
          {loans.map((loan) => (
            <button
              key={loan.id}
              type="button"
              onClick={() => {
                onChange(loan.id)
                setOpen(false)
              }}
              className="flex items-center gap-3 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
              data-selected={loan.id === value}
            >
              <span className="text-lg leading-none">{loan.icon ?? '🏦'}</span>
              <span className="font-medium">{loan.name}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
