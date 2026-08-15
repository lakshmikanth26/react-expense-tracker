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
import { accountTypeLabels } from '@/lib/account-icons'
import type { Account, AccountType } from '@/types'

export interface AccountFormValues {
  name: string
  type: AccountType
  openingBalance: string
}

interface AccountFormDialogProps {
  trigger: React.ReactNode
  editing?: Account | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (values: AccountFormValues) => void | Promise<void>
}

function toFormValues(editing?: Account | null): AccountFormValues {
  if (!editing) return { name: '', type: 'bank', openingBalance: '0' }
  return { name: editing.name, type: editing.type, openingBalance: String(Number(editing.opening_balance)) }
}

export function AccountFormDialog({ trigger, editing, open, onOpenChange, onSave }: AccountFormDialogProps) {
  const [values, setValues] = useState<AccountFormValues>(() => toFormValues(editing))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValues(toFormValues(editing))
  }, [open, editing])

  function set<K extends keyof AccountFormValues>(key: K, val: AccountFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  const canSave = values.name.trim().length > 0

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
          <DialogTitle>{editing ? 'Edit account' : 'Add account'}</DialogTitle>
          <DialogDescription>Accounts hold the balances your transactions move between.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input id="account-name" placeholder="HDFC Savings" value={values.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={values.type} onValueChange={(v) => set('type', v as AccountType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(accountTypeLabels) as AccountType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {accountTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!editing && (
            <div className="space-y-1.5">
              <Label htmlFor="account-opening-balance">Opening balance</Label>
              <Input
                id="account-opening-balance"
                type="number"
                inputMode="decimal"
                value={values.openingBalance}
                onChange={(e) => set('openingBalance', e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            Save account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
