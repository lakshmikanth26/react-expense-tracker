import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { TransactionList } from '@/components/transactions/TransactionList'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useTransactionsList, useDeleteTransaction, useDuplicateTransaction } from '@/hooks/useTransactions'
import { toFriendlyMessage } from '@/lib/errors'
import type { TransactionWithRelations } from '@/types'

const PAGE_SIZE = 50

export default function Transactions() {
  const navigate = useNavigate()
  const [offset, setOffset] = useState(0)
  const { transactions, count, isLoading } = useTransactionsList({ limit: PAGE_SIZE, offset })
  const deleteMutation = useDeleteTransaction()
  const duplicateMutation = useDuplicateTransaction()
  const [pendingDelete, setPendingDelete] = useState<TransactionWithRelations | null>(null)

  async function handleDuplicate(t: TransactionWithRelations) {
    try {
      const created = await duplicateMutation.mutateAsync(t)
      toast.success('Transaction duplicated', {
        action: { label: 'Edit', onClick: () => navigate(`/add?id=${created.id}`) },
      })
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not duplicate this transaction.'))
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete.id)
      toast.success('Transaction deleted')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not delete this transaction.'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <Button size="sm" onClick={() => navigate('/add?type=expense')}>
          + Add
        </Button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <TransactionList
            transactions={transactions}
            onEdit={(t) => navigate(`/add?id=${t.id}`)}
            onDuplicate={handleDuplicate}
            onDelete={setPendingDelete}
          />

          {count > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button variant="outline" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
                Previous
              </Button>
              <span className="text-muted-foreground">
                {offset + 1}–{Math.min(offset + PAGE_SIZE, count)} of {count}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= count}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete transaction?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
