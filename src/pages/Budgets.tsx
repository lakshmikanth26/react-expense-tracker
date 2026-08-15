import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { BudgetRow } from '@/components/budgets/BudgetRow'
import { BudgetFormDialog } from '@/components/budgets/BudgetFormDialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { useFamily } from '@/hooks/useFamily'
import { useMonthTransactions } from '@/hooks/useDashboard'
import { useCategories } from '@/hooks/useCategories'
import { useBudgets, useUpsertBudget, useDeleteBudget } from '@/hooks/useBudgets'
import { computeCategoryTotals, computeSummary } from '@/lib/calculations'
import { currentMonthKey } from '@/lib/dates'
import { toFriendlyMessage } from '@/lib/errors'
import type { Budget } from '@/types'

export default function Budgets() {
  const [params, setParams] = useSearchParams()
  const monthKey = params.get('month') ?? currentMonthKey()
  const { family } = useFamily()
  const { transactions } = useMonthTransactions(monthKey)
  const { categories } = useCategories('expense')
  const { budgets, isLoading } = useBudgets(monthKey)
  const upsertMutation = useUpsertBudget(monthKey)
  const deleteMutation = useDeleteBudget(monthKey)

  const [dialogState, setDialogState] = useState<{ open: boolean; budget: Budget | null }>({ open: false, budget: null })
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null)

  function setMonthKey(next: string) {
    setParams(next === currentMonthKey() ? {} : { month: next })
  }

  const summary = computeSummary(transactions)
  const categoryTotals = computeCategoryTotals(transactions.filter((t) => t.type === 'expense'))
  const spentByCategory = new Map(categoryTotals.map((t) => [t.categoryId, t.amount]))
  const categoryById = new Map(categories.map((c) => [c.id, c]))

  const overallBudget = budgets.find((b) => b.category_id === null)
  const categoryBudgets = budgets.filter((b) => b.category_id !== null)

  async function handleSave(input: { categoryId: string | null; amount: number }) {
    if (!family) return
    try {
      await upsertMutation.mutateAsync({ family_id: family.id, category_id: input.categoryId, month: monthKey, amount: input.amount })
      toast.success('Budget saved')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save this budget.'))
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('Budget removed')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not remove this budget.'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <BudgetFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Add
            </Button>
          }
          monthKey={monthKey}
          categories={categories}
          existingBudgets={budgets}
          onSave={handleSave}
        />
      </div>

      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No budgets set for this month"
          description="Set an overall budget or per-category limits to track your spending."
        />
      ) : (
        <div className="space-y-3">
          {overallBudget && (
            <BudgetRow
              label="Overall"
              spent={summary.expense}
              budgeted={Number(overallBudget.amount)}
              onEdit={() => setDialogState({ open: true, budget: overallBudget })}
              onDelete={() => setPendingDelete(overallBudget)}
            />
          )}
          {categoryBudgets.map((budget) => {
            const category = categoryById.get(budget.category_id!)
            return (
              <BudgetRow
                key={budget.id}
                label={category?.name ?? 'Category'}
                icon={category?.icon}
                spent={spentByCategory.get(budget.category_id) ?? 0}
                budgeted={Number(budget.amount)}
                onEdit={() => setDialogState({ open: true, budget })}
                onDelete={() => setPendingDelete(budget)}
              />
            )
          })}
        </div>
      )}

      <BudgetFormDialog
        trigger={<span />}
        monthKey={monthKey}
        categories={categories}
        existingBudgets={budgets}
        editingBudget={dialogState.budget}
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ open, budget: open ? dialogState.budget : null })}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remove this budget?"
        description="You can add it back at any time."
        confirmLabel="Remove"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
