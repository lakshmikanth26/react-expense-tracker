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
import type { Category, CategoryType } from '@/types'

const NONE = '__none__'

export interface CategoryFormValues {
  name: string
  icon: string
  type: CategoryType
  parentId: string | null
}

interface CategoryFormDialogProps {
  trigger: React.ReactNode
  editing?: Category | null
  defaultType: CategoryType
  /** All categories (both types) so parent options can be filtered by the selected type. */
  categories: Category[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (values: CategoryFormValues) => void | Promise<void>
}

function toFormValues(defaultType: CategoryType, editing?: Category | null): CategoryFormValues {
  if (!editing) return { name: '', icon: '🏷️', type: defaultType, parentId: null }
  return { name: editing.name, icon: editing.icon ?? '🏷️', type: editing.type, parentId: editing.parent_id }
}

export function CategoryFormDialog({ trigger, editing, defaultType, categories, open, onOpenChange, onSave }: CategoryFormDialogProps) {
  const [values, setValues] = useState<CategoryFormValues>(() => toFormValues(defaultType, editing))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setValues(toFormValues(defaultType, editing))
  }, [open, editing, defaultType])

  function set<K extends keyof CategoryFormValues>(key: K, val: CategoryFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  const canSave = values.name.trim().length > 0

  const parentOptions = categories.filter(
    (c) => c.type === values.type && c.parent_id === null && c.id !== editing?.id
  )

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
          <DialogTitle>{editing ? 'Edit category' : 'Add category'}</DialogTitle>
          <DialogDescription>Categories group transactions for budgets and reports.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[4rem_1fr] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="category-icon">Icon</Label>
              <Input
                id="category-icon"
                value={values.icon}
                onChange={(e) => set('icon', e.target.value)}
                className="text-center text-lg"
                maxLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input id="category-name" placeholder="Groceries" value={values.name} onChange={(e) => set('name', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={values.type}
              onValueChange={(v) => set('type', v as CategoryType)}
              disabled={!!editing}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Parent category (optional)</Label>
            <Select
              value={values.parentId ?? NONE}
              onValueChange={(v) => set('parentId', v === NONE ? null : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>None</SelectItem>
                {parentOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            Save category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
