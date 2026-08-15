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
import type { SavingsGoal } from '@/types'

export interface GoalFormValues {
  name: string
  icon: string
  targetAmount: string
  currentAmount: string
  targetDate: string
}

function toFormValues(goal?: SavingsGoal | null): GoalFormValues {
  if (!goal) return { name: '', icon: '🎯', targetAmount: '', currentAmount: '0', targetDate: '' }
  return {
    name: goal.name,
    icon: goal.icon ?? '🎯',
    targetAmount: String(Number(goal.target_amount)),
    currentAmount: String(Number(goal.current_amount)),
    targetDate: goal.target_date ?? '',
  }
}

interface GoalFormDialogProps {
  trigger: React.ReactNode
  editing?: SavingsGoal | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (values: GoalFormValues) => void | Promise<void>
}

export function GoalFormDialog({ trigger, editing, open, onOpenChange, onSave }: GoalFormDialogProps) {
  const [values, setValues] = useState<GoalFormValues>(() => toFormValues(editing))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValues(toFormValues(editing))
  }, [open, editing])

  function set<K extends keyof GoalFormValues>(key: K, val: GoalFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  const canSave = values.name.trim().length > 0 && Number(values.targetAmount) > 0

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit goal' : 'New savings goal'}</DialogTitle>
          <DialogDescription>Track progress toward something you're saving for.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[4rem_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-icon">Icon</Label>
              <Input id="goal-icon" value={values.icon} onChange={(e) => set('icon', e.target.value)} className="text-center text-lg" maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-name">Name</Label>
              <Input id="goal-name" placeholder="Emergency Fund" value={values.name} onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Target amount</Label>
              <Input id="goal-target" type="number" inputMode="decimal" value={values.targetAmount} onChange={(e) => set('targetAmount', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-current">Current amount</Label>
              <Input id="goal-current" type="number" inputMode="decimal" value={values.currentAmount} onChange={(e) => set('currentAmount', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input id="goal-date" type="date" value={values.targetDate} onChange={(e) => set('targetDate', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            Save goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
