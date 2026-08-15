import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { LoanCard } from '@/components/loans/LoanCard'
import { LoanFormDialog, type LoanFormValues } from '@/components/loans/LoanFormDialog'
import { useFamily } from '@/hooks/useFamily'
import { useLoans, useCreateLoan, useUpdateLoan, useDeleteLoan } from '@/hooks/useLoans'
import { toFriendlyMessage } from '@/lib/errors'
import type { Loan } from '@/types'

export default function LoansPage() {
  const { family } = useFamily()
  const { loans, isLoading } = useLoans()
  const createMutation = useCreateLoan()
  const updateMutation = useUpdateLoan()
  const deleteMutation = useDeleteLoan()

  const [addOpen, setAddOpen] = useState(false)
  const [dialogState, setDialogState] = useState<{ open: boolean; editing: Loan | null }>({ open: false, editing: null })
  const [pendingDelete, setPendingDelete] = useState<Loan | null>(null)

  async function handleSave(values: LoanFormValues) {
    if (!family) return
    try {
      if (dialogState.editing) {
        await updateMutation.mutateAsync({
          id: dialogState.editing.id,
          updates: {
            name: values.name,
            icon: values.icon.trim() || null,
            interest_rate: Number(values.interestRate),
            emi_amount: Number(values.emiAmount),
            current_balance: Number(values.currentBalance),
            is_closed: Number(values.currentBalance) <= 0.01,
          },
        })
        toast.success('Loan updated')
      } else {
        const principalAmount = Number(values.principalAmount)
        await createMutation.mutateAsync({
          family_id: family.id,
          name: values.name,
          icon: values.icon.trim() || null,
          principal_amount: principalAmount,
          interest_rate: Number(values.interestRate),
          emi_amount: Number(values.emiAmount),
          current_balance: principalAmount, // initialized equal to principal_amount; kept in sync by the DB trigger afterward
          start_date: values.startDate,
        })
        toast.success('Loan added')
      }
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save this loan.'))
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('Loan deleted')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not delete this loan.'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Loans</h1>
        <LoanFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Add loan
            </Button>
          }
          open={addOpen}
          onOpenChange={setAddOpen}
          onSave={handleSave}
        />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : loans.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No loans yet"
          description="Track a home, vehicle, or personal loan's real payoff timeline — months remaining, payoff date, and interest left — using proper amortization math, not a simple running total."
        />
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onEdit={() => setDialogState({ open: true, editing: loan })}
              onDelete={() => setPendingDelete(loan)}
            />
          ))}
        </div>
      )}

      <LoanFormDialog
        trigger={<span />}
        editing={dialogState.editing}
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ open, editing: open ? dialogState.editing : null })}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this loan?"
        description="Linked payments will be kept but unlinked from this loan. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
