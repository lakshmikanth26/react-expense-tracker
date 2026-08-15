import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { accountTypeIcons } from '@/lib/account-icons'
import type { Account } from '@/types'

interface AccountSelectorProps {
  label: string
  accounts: Account[]
  value: string | null
  onChange: (accountId: string) => void
  excludeId?: string | null
}

export function AccountSelector({ label, accounts, value, onChange, excludeId }: AccountSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = accounts.find((a) => a.id === value)
  const options = excludeId ? accounts.filter((a) => a.id !== excludeId) : accounts

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex items-center gap-2">
            <span className="text-xl leading-none">{selected ? accountTypeIcons[selected.type] : '💳'}</span>
            <span className="font-medium">{selected?.name ?? `Choose ${label.toLowerCase()}`}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1.5 pt-2 pb-6">
          {options.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => {
                onChange(account.id)
                setOpen(false)
              }}
              className="flex items-center gap-3 rounded-lg border p-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
              data-selected={account.id === value}
            >
              <span className="text-xl leading-none">{accountTypeIcons[account.type]}</span>
              <span className="font-medium">{account.name}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
