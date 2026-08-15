import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { GoalCard } from '@/components/goals/GoalCard'
import { GoalFormDialog, type GoalFormValues } from '@/components/goals/GoalFormDialog'
import { useFamily } from '@/hooks/useFamily'
import { useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal, useDeleteSavingsGoal } from '@/hooks/useGoals'
import { toFriendlyMessage } from '@/lib/errors'
import type { SavingsGoal } from '@/types'

export default function Goals() {
  const { family } = useFamily()
  const { goals, isLoading } = useSavingsGoals()
  const createMutation = useCreateSavingsGoal()
  const updateMutation = useUpdateSavingsGoal()
  const deleteMutation = useDeleteSavingsGoal()

  const [addOpen, setAddOpen] = useState(false)
  const [dialogState, setDialogState] = useState<{ open: boolean; editing: SavingsGoal | null }>({ open: false, editing: null })
  const [pendingDelete, setPendingDelete] = useState<SavingsGoal | null>(null)

  async function handleSave(values: GoalFormValues) {
    if (!family) return
    const input = {
      family_id: family.id,
      name: values.name.trim(),
      icon: values.icon || null,
      target_amount: Number(values.targetAmount),
      current_amount: Number(values.currentAmount) || 0,
      target_date: values.targetDate || null,
    }
    try {
      if (dialogState.editing) {
        await updateMutation.mutateAsync({ id: dialogState.editing.id, updates: input })
        toast.success('Goal updated')
      } else {
        await createMutation.mutateAsync(input)
        toast.success('Goal created')
      }
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save this goal.'))
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('Goal deleted')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not delete this goal.'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Savings Goals</h1>
        <GoalFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> New goal
            </Button>
          }
          open={addOpen}
          onOpenChange={setAddOpen}
          onSave={handleSave}
        />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="No savings goals yet" description="Create one for an emergency fund, vacation, or anything else." />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setDialogState({ open: true, editing: goal })}
              onDelete={() => setPendingDelete(goal)}
            />
          ))}
        </div>
      )}

      <GoalFormDialog
        trigger={<span />}
        editing={dialogState.editing}
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ open, editing: open ? dialogState.editing : null })}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this goal?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
