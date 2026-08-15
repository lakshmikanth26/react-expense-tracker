import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { accountTypeIcons } from '@/lib/account-icons'
import { addMonths, currentMonthKey, formatMonthLabel } from '@/lib/dates'
import type { Account, Category, FamilyMember, TransactionType } from '@/types'

export interface TransactionFilterState {
  month: string | null // a monthKey (YYYY-MM-01), or null for "all time"
  categoryId: string | null
  /** null = no filter, '' = "Family" (transactions with no member), otherwise a member id. */
  memberId: string | null
  accountId: string | null
  type: TransactionType | null
  minAmount: string
  maxAmount: string
}

export const emptyFilterState: TransactionFilterState = {
  month: null,
  categoryId: null,
  memberId: null,
  accountId: null,
  type: null,
  minAmount: '',
  maxAmount: '',
}

export function isFilterActive(filters: TransactionFilterState): boolean {
  return Object.entries(filters).some(([key, value]) => {
    if (key === 'minAmount' || key === 'maxAmount') return value !== ''
    return value !== null
  })
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => addMonths(currentMonthKey(), -i))

interface FilterSheetProps {
  categories: Category[]
  accounts: Account[]
  members: FamilyMember[]
  value: TransactionFilterState
  onChange: (next: TransactionFilterState) => void
}

const ALL = '__all__'
const FAMILY = '__family__'

export function FilterSheet({ categories, accounts, members, value, onChange }: FilterSheetProps) {
  const activeCount = isFilterActive(value) ? Object.values(value).filter((v) => v !== null && v !== '').length : 0

  function set<K extends keyof TransactionFilterState>(key: K, val: TransactionFilterState[K]) {
    onChange({ ...value, [key]: val })
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-2 pb-6">
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Select value={value.month ?? ALL} onValueChange={(v) => set('month', v === ALL ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All time</SelectItem>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {formatMonthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={value.type ?? ALL} onValueChange={(v) => set('type', v === ALL ? null : (v as TransactionType))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All types</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={value.categoryId ?? ALL} onValueChange={(v) => set('categoryId', v === ALL ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Member</Label>
            <Select
              value={value.memberId === null ? ALL : value.memberId === '' ? FAMILY : value.memberId}
              onValueChange={(v) => set('memberId', v === ALL ? null : v === FAMILY ? '' : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Everyone</SelectItem>
                <SelectItem value={FAMILY}>Family (no member)</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Account</Label>
            <Select value={value.accountId ?? ALL} onValueChange={(v) => set('accountId', v === ALL ? null : v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All accounts</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {accountTypeIcons[a.type]} {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Amount range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Min"
                value={value.minAmount}
                onChange={(e) => set('minAmount', e.target.value)}
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Max"
                value={value.maxAmount}
                onChange={(e) => set('maxAmount', e.target.value)}
              />
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => onChange(emptyFilterState)}>
            Clear all filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
