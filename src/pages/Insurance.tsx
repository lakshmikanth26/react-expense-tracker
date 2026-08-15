import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { InsuranceCard } from '@/components/insurance/InsuranceCard'
import { InsuranceFormDialog, type InsuranceFormValues } from '@/components/insurance/InsuranceFormDialog'
import { useFamily } from '@/hooks/useFamily'
import { useInsurances, useCreateInsurance, useUpdateInsurance, useDeleteInsurance } from '@/hooks/useInsurance'
import { toFriendlyMessage } from '@/lib/errors'
import type { Insurance } from '@/types'

export default function InsurancePage() {
  const { family } = useFamily()
  const { insurances, isLoading } = useInsurances()
  const createMutation = useCreateInsurance()
  const updateMutation = useUpdateInsurance()
  const deleteMutation = useDeleteInsurance()

  const [addOpen, setAddOpen] = useState(false)
  const [dialogState, setDialogState] = useState<{ open: boolean; editing: Insurance | null }>({ open: false, editing: null })
  const [pendingDelete, setPendingDelete] = useState<Insurance | null>(null)

  async function handleSave(values: InsuranceFormValues) {
    if (!family) return
    const input = {
      family_id: family.id,
      name: values.name.trim(),
      type: values.type,
      provider: values.provider.trim() || null,
      policy_number: values.policyNumber.trim() || null,
      premium_amount: values.premiumAmount ? Number(values.premiumAmount) : null,
      renewal_date: values.renewalDate || null,
      notes: values.notes.trim() || null,
    }
    try {
      if (dialogState.editing) {
        await updateMutation.mutateAsync({ id: dialogState.editing.id, updates: input })
        toast.success('Insurance updated')
      } else {
        await createMutation.mutateAsync(input)
        toast.success('Insurance added')
      }
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save this insurance.'))
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('Insurance deleted')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not delete this insurance.'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Insurance</h1>
        <InsuranceFormDialog
          trigger={
            <Button size="sm">
              <Plus className="size-4" /> Add insurance
            </Button>
          }
          open={addOpen}
          onOpenChange={setAddOpen}
          onSave={handleSave}
        />
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : insurances.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No insurance policies yet"
          description="Add health, life, vehicle, or home insurance and keep the documents attached."
        />
      ) : (
        <div className="space-y-3">
          {insurances.map((insurance) => (
            <InsuranceCard
              key={insurance.id}
              insurance={insurance}
              onEdit={() => setDialogState({ open: true, editing: insurance })}
              onDelete={() => setPendingDelete(insurance)}
            />
          ))}
        </div>
      )}

      <InsuranceFormDialog
        trigger={<span />}
        editing={dialogState.editing}
        open={dialogState.open}
        onOpenChange={(open) => setDialogState({ open, editing: open ? dialogState.editing : null })}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this insurance?"
        description="This also removes its uploaded documents. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
