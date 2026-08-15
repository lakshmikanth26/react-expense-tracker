import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CategorySelector } from '@/components/transactions/CategorySelector'
import { AccountSelector } from '@/components/transactions/AccountSelector'
import { MemberSelector } from '@/components/transactions/MemberSelector'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useMembers } from '@/hooks/useMembers'
import { todayKey } from '@/lib/dates'
import type { RecurringFrequency, RecurringTransaction, TransactionType } from '@/types'

export interface RecurringFormValues {
  type: TransactionType
  amount: string
  description: string
  categoryId: string | null
  accountId: string | null
  transferToAccountId: string | null
  memberId: string | null
  frequency: RecurringFrequency
  interval: string
  startDate: string
  endDate: string
}

interface RecurringFormDialogProps {
  trigger: React.ReactNode
  editing?: RecurringTransaction | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (values: RecurringFormValues) => void | Promise<void>
}

function toFormValues(r?: RecurringTransaction | null): RecurringFormValues {
  if (!r) {
    return {
      type: 'expense',
      amount: '',
      description: '',
      categoryId: null,
      accountId: null,
      transferToAccountId: null,
      memberId: null,
      frequency: 'monthly',
      interval: '1',
      startDate: todayKey(),
      endDate: '',
    }
  }
  return {
    type: r.type,
    amount: String(Number(r.amount)),
    description: r.description ?? '',
    categoryId: r.category_id,
    accountId: r.account_id,
    transferToAccountId: r.transfer_to_account_id,
    memberId: r.member_id,
    frequency: r.frequency,
    interval: String(r.interval),
    startDate: r.start_date,
    endDate: r.end_date ?? '',
  }
}

export function RecurringFormDialog({ trigger, editing, open, onOpenChange, onSave }: RecurringFormDialogProps) {
  const [values, setValues] = useState<RecurringFormValues>(() => toFormValues(editing))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValues(toFormValues(editing))
  }, [open, editing])

  const { categories } = useCategories(values.type === 'transfer' ? undefined : values.type)
  const { accounts } = useAccounts()
  const { members } = useMembers()

  function set<K extends keyof RecurringFormValues>(key: K, val: RecurringFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  const canSave =
    Number(values.amount) > 0 &&
    !!values.accountId &&
    (values.type === 'transfer' ? !!values.transferToAccountId && values.transferToAccountId !== values.accountId : !!values.categoryId)

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave(values)
      onOpenChange?.(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit recurring transaction' : 'Add recurring transaction'}</DialogTitle>
          <DialogDescription>Generates automatically on schedule when the app is opened.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={values.type} onValueChange={(v) => set('type', v as TransactionType)} disabled={!!editing}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurring-amount">Amount</Label>
              <Input id="recurring-amount" type="number" inputMode="decimal" value={values.amount} onChange={(e) => set('amount', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recurring-description">Description</Label>
            <Input id="recurring-description" placeholder="e.g. House Rent" value={values.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {values.type !== 'transfer' && (
            <div className="space-y-1.5">
              <Label>Category</Label>
              <CategorySelector categories={categories} value={values.categoryId} onChange={(v) => set('categoryId', v)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{values.type === 'transfer' ? 'From account' : 'Account'}</Label>
            <AccountSelector
              label="account"
              accounts={accounts}
              value={values.accountId}
              onChange={(v) => set('accountId', v)}
              excludeId={values.type === 'transfer' ? values.transferToAccountId : undefined}
            />
          </div>

          {values.type === 'transfer' && (
            <div className="space-y-1.5">
              <Label>To account</Label>
              <AccountSelector
                label="destination account"
                accounts={accounts}
                value={values.transferToAccountId}
                onChange={(v) => set('transferToAccountId', v)}
                excludeId={values.accountId}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Member</Label>
            <MemberSelector members={members} value={values.memberId} onChange={(v) => set('memberId', v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={values.frequency} onValueChange={(v) => set('frequency', v as RecurringFrequency)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurring-interval">Every</Label>
              <Input id="recurring-interval" type="number" min={1} value={values.interval} onChange={(e) => set('interval', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="recurring-start">Start date</Label>
              <Input id="recurring-start" type="date" value={values.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurring-end">End date (optional)</Label>
              <Input id="recurring-end" type="date" value={values.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
