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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { insuranceTypeLabels } from '@/lib/insurance-icons'
import type { Insurance, InsuranceType } from '@/types'

export interface InsuranceFormValues {
  name: string
  type: InsuranceType
  provider: string
  policyNumber: string
  premiumAmount: string
  renewalDate: string
  notes: string
}

function toFormValues(editing?: Insurance | null): InsuranceFormValues {
  if (!editing) return { name: '', type: 'health', provider: '', policyNumber: '', premiumAmount: '', renewalDate: '', notes: '' }
  return {
    name: editing.name,
    type: editing.type,
    provider: editing.provider ?? '',
    policyNumber: editing.policy_number ?? '',
    premiumAmount: editing.premium_amount ? String(Number(editing.premium_amount)) : '',
    renewalDate: editing.renewal_date ?? '',
    notes: editing.notes ?? '',
  }
}

interface InsuranceFormDialogProps {
  trigger: React.ReactNode
  editing?: Insurance | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (values: InsuranceFormValues) => void | Promise<void>
}

export function InsuranceFormDialog({ trigger, editing, open, onOpenChange, onSave }: InsuranceFormDialogProps) {
  const [values, setValues] = useState<InsuranceFormValues>(() => toFormValues(editing))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValues(toFormValues(editing))
  }, [open, editing])

  function set<K extends keyof InsuranceFormValues>(key: K, val: InsuranceFormValues[K]) {
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
          <DialogTitle>{editing ? 'Edit insurance' : 'Add insurance'}</DialogTitle>
          <DialogDescription>Keep every policy — and its documents — in one place.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="insurance-name">Name</Label>
            <Input id="insurance-name" placeholder="Family Health Cover" value={values.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={values.type} onValueChange={(v) => set('type', v as InsuranceType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(insuranceTypeLabels) as InsuranceType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {insuranceTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insurance-provider">Provider</Label>
              <Input id="insurance-provider" placeholder="Acme Insurance" value={values.provider} onChange={(e) => set('provider', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="insurance-policy-number">Policy number</Label>
              <Input id="insurance-policy-number" value={values.policyNumber} onChange={(e) => set('policyNumber', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insurance-premium">Premium amount</Label>
              <Input
                id="insurance-premium"
                type="number"
                inputMode="decimal"
                value={values.premiumAmount}
                onChange={(e) => set('premiumAmount', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insurance-renewal-date">Renewal date</Label>
            <Input id="insurance-renewal-date" type="date" value={values.renewalDate} onChange={(e) => set('renewalDate', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="insurance-notes">Notes</Label>
            <Textarea id="insurance-notes" rows={2} value={values.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            Save insurance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
