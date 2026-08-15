import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { RecurringRow } from '@/components/recurring/RecurringRow'
import { RecurringFormDialog, type RecurringFormValues } from '@/components/recurring/RecurringFormDialog'
import { useFamily } from '@/hooks/useFamily'
import {
  useRecurringTransactions,
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
  useDeleteRecurringTransaction,
} from '@/hooks/useRecurring'
import { toFriendlyMessage } from '@/lib/errors'
import type { RecurringTransaction } from '@/types'

export default function Recurring() {
  const { family } = useFamily()
  const { recurring, isLoading } = useRecurringTransactions()
  const createMutation = useCreateRecurringTransaction()
  const updateMutation = useUpdateRecurringTransaction()
  const deleteMutation = useDeleteRecurringTransaction()

  const [addOpen, setAddOpen] = useState(false)
  const [dialogState, setDialogState] = useState<{ open: boolean; editing: RecurringTransaction | null }>({ open: false, editing: null })
  const [pendingDelete, setPendingDelete] = useState<RecurringTransaction | null>(null)

  async function handleSave(values: RecurringFormValues) {
    if (!family) return
    const input = {
      family_id: family.id,
      member_id: values.memberId,
      category_id: values.type === 'transfer' ? null : values.categoryId,
      account_id: values.accountId,
      transfer_to_account_id: values.type === 'transfer' ? values.transferToAccountId : null,
      goal_id: values.type === 'savings' || values.type === 'expense' ? values.goalId : null,
      type: values.type,
      amount: Number(values.amount),
      description: values.description.trim() || null,
      frequency: values.frequency,
      interval: Number(values.interval) || 1,
      start_date: values.startDate,
      end_date: values.endDate || null,
      day_of_month: new Date(values.startDate).getDate(),
      next_run_date: dialogState.editing?.next_run_date ?? values.startDate,
    }
    try {
      if (dialogState.editing) {
        await updateMutation.mutateAsync({ id: dialogState.editing.id, updates: input })
        toast.success('Recurring transaction updated')
      } else {
        await createMutation.mutateAsync(input)
        toast.success('Recurring transaction added')
      }
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save this recurring transaction.'))
    }
  }

  async function handleToggle(r: RecurringTransaction, active: boolean) {
    try {
      await updateMutation.mutateAsync({ id: r.id, updates: { is_active: active } })
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not update this recurring transaction.'))
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('Recurring transaction removed')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not remove this recurring transaction.'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Recurring Transactions</h1>
        <RecurringFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Add
            </Button>
          }
          open={addOpen}
          onOpenChange={setAddOpen}
          onSave={handleSave}
        />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : recurring.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions"
          description="Add rent, salary, or subscriptions and they'll be logged automatically on schedule."
        />
      ) : (
        <div className="space-y-2">
          {recurring.map((r) => (
            <RecurringRow
              key={r.id}
              recurring={r}
              onToggleActive={(active) => handleToggle(r, active)}
              onEdit={() => setDialogState({ open: true, editing: r })}
              onDelete={() => setPendingDelete(r)}
            />
          ))}
        </div>
      )}

      <RecurringFormDialog
        trigger={<span />}
        editing={dialogState.editing}
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ open, editing: open ? dialogState.editing : null })}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this recurring transaction?"
        description="Past transactions it already generated will not be affected."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
