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
import { todayKey } from '@/lib/dates'
import type { Loan } from '@/types'

export interface LoanFormValues {
  name: string
  icon: string
  principalAmount: string
  interestRate: string
  emiAmount: string
  startDate: string
  /** Only present/editable when editing an existing loan — a manual override for current_balance. */
  currentBalance: string
}

function toFormValues(editing?: Loan | null): LoanFormValues {
  if (!editing) {
    return { name: '', icon: '', principalAmount: '', interestRate: '', emiAmount: '', startDate: todayKey(), currentBalance: '' }
  }
  return {
    name: editing.name,
    icon: editing.icon ?? '',
    principalAmount: String(Number(editing.principal_amount)),
    interestRate: String(Number(editing.interest_rate)),
    emiAmount: String(Number(editing.emi_amount)),
    startDate: editing.start_date,
    currentBalance: String(Number(editing.current_balance)),
  }
}

interface LoanFormDialogProps {
  trigger: React.ReactNode
  editing?: Loan | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (values: LoanFormValues) => void | Promise<void>
}

export function LoanFormDialog({ trigger, editing, open, onOpenChange, onSave }: LoanFormDialogProps) {
  const [values, setValues] = useState<LoanFormValues>(() => toFormValues(editing))
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(toFormValues(editing))
      setShowAdvanced(false)
    }
  }, [open, editing])

  function set<K extends keyof LoanFormValues>(key: K, val: LoanFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  const canSave =
    values.name.trim().length > 0 &&
    Number(values.principalAmount) > 0 &&
    Number(values.interestRate) >= 0 &&
    Number(values.emiAmount) > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ ...values, name: values.name.trim() })
      onOpenChange?.(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit loan' : 'Add loan'}</DialogTitle>
          <DialogDescription>Track a loan's payoff with real amortization math, not a simple running total.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[64px_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-icon">Icon</Label>
              <Input id="loan-icon" placeholder="🏠" maxLength={4} value={values.icon} onChange={(e) => set('icon', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-name">Name</Label>
              <Input id="loan-name" placeholder="Home Loan" value={values.name} onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-principal">{editing ? 'Original pending amount' : 'Pending balance amount'}</Label>
            <Input
              id="loan-principal"
              type="number"
              inputMode="decimal"
              placeholder="7276760"
              value={values.principalAmount}
              onChange={(e) => set('principalAmount', e.target.value)}
              disabled={!!editing}
            />
            {editing && (
              <p className="text-xs text-muted-foreground">
                Fixed once created — it's the anchor start_date's balance was accurate as of. Use "Current balance" below to correct drift.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="loan-rate">Interest rate (% p.a.)</Label>
              <Input
                id="loan-rate"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="7.30"
                value={values.interestRate}
                onChange={(e) => set('interestRate', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-emi">EMI amount</Label>
              <Input
                id="loan-emi"
                type="number"
                inputMode="decimal"
                placeholder="59824"
                value={values.emiAmount}
                onChange={(e) => set('emiAmount', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loan-start-date">{editing ? 'Start date' : 'Balance as of'}</Label>
            <Input
              id="loan-start-date"
              type="date"
              value={values.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              disabled={!!editing}
            />
          </div>

          {editing && (
            <div className="space-y-2 border-t pt-3">
              {!showAdvanced ? (
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setShowAdvanced(true)}
                >
                  Advanced: manually correct current balance
                </button>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="loan-current-balance">Current balance (manual correction)</Label>
                  <Input
                    id="loan-current-balance"
                    type="number"
                    inputMode="decimal"
                    value={values.currentBalance}
                    onChange={(e) => set('currentBalance', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Normally kept in sync automatically from linked payments — only change this to correct a one-off discrepancy
                    (e.g. a bank statement mismatch). It will be overwritten the next time a linked payment is added, edited, or removed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            Save loan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
