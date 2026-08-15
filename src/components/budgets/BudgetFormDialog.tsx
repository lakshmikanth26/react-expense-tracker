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
import type { Budget, Category } from '@/types'

const OVERALL = '__overall__'

interface BudgetFormDialogProps {
  trigger: React.ReactNode
  monthKey: string
  categories: Category[]
  existingBudgets: Budget[]
  editingBudget?: Budget | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (input: { categoryId: string | null; amount: number }) => void | Promise<void>
}

export function BudgetFormDialog({
  trigger,
  categories,
  existingBudgets,
  editingBudget,
  open,
  onOpenChange,
  onSave,
}: BudgetFormDialogProps) {
  const [categoryId, setCategoryId] = useState(editingBudget?.category_id ?? OVERALL)
  const [amount, setAmount] = useState(editingBudget ? String(Number(editingBudget.amount)) : '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setCategoryId(editingBudget?.category_id ?? OVERALL)
      setAmount(editingBudget ? String(Number(editingBudget.amount)) : '')
    }
  }, [open, editingBudget])

  const budgetedCategoryIds = new Set(existingBudgets.filter((b) => b.category_id).map((b) => b.category_id))
  const hasOverallBudget = existingBudgets.some((b) => b.category_id === null)
  const availableCategories = categories.filter(
    (c) => !budgetedCategoryIds.has(c.id) || c.id === editingBudget?.category_id
  )

  async function handleSave() {
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) return
    setSaving(true)
    try {
      await onSave({ categoryId: categoryId === OVERALL ? null : categoryId, amount: numericAmount })
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
          <DialogTitle>{editingBudget ? 'Edit budget' : 'Add budget'}</DialogTitle>
          <DialogDescription>Set a spending limit for the month.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Budget for</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={!!editingBudget}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(!hasOverallBudget || editingBudget?.category_id === null) && (
                  <SelectItem value={OVERALL}>Overall (all spending)</SelectItem>
                )}
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget-amount">Monthly amount</Label>
            <Input id="budget-amount" type="number" inputMode="decimal" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving || !amount}>
            Save budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
