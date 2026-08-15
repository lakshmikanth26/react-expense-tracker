import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TransactionList } from '@/components/transactions/TransactionList'
import { FilterSheet, emptyFilterState, isFilterActive, type TransactionFilterState } from '@/components/transactions/FilterSheet'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useTransactionsList, useDeleteTransaction, useDuplicateTransaction } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useMembers } from '@/hooks/useMembers'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { endOfMonthKeyExclusive, startOfMonthKey } from '@/lib/dates'
import { toFriendlyMessage } from '@/lib/errors'
import type { TransactionWithRelations } from '@/types'
import type { TransactionFilters } from '@/services/transactions'

const PAGE_SIZE = 50

export default function Transactions() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [offset, setOffset] = useState(0)
  const [filterState, setFilterState] = useState<TransactionFilterState>(() => ({
    ...emptyFilterState,
    categoryId: params.get('category'),
  }))

  const { categories } = useCategories()
  const { accounts } = useAccounts()
  const { members } = useMembers()

  const categoryIds = useMemo(() => {
    if (!filterState.categoryId) return undefined
    const children = categories.filter((c) => c.parent_id === filterState.categoryId).map((c) => c.id)
    return [filterState.categoryId, ...children]
  }, [filterState.categoryId, categories])

  const filters: TransactionFilters = useMemo(
    () => ({
      startDate: filterState.month ? startOfMonthKey(filterState.month) : undefined,
      endDateExclusive: filterState.month ? endOfMonthKeyExclusive(filterState.month) : undefined,
      categoryIds,
      memberId: filterState.memberId === null ? undefined : filterState.memberId === '' ? null : filterState.memberId,
      accountId: filterState.accountId ?? undefined,
      type: filterState.type ?? undefined,
      minAmount: filterState.minAmount ? Number(filterState.minAmount) : undefined,
      maxAmount: filterState.maxAmount ? Number(filterState.maxAmount) : undefined,
      search: debouncedSearch || undefined,
    }),
    [filterState, categoryIds, debouncedSearch]
  )

  const { transactions, count, isLoading } = useTransactionsList(filters, { limit: PAGE_SIZE, offset })
  const deleteMutation = useDeleteTransaction()
  const duplicateMutation = useDuplicateTransaction()
  const [pendingDelete, setPendingDelete] = useState<TransactionWithRelations | null>(null)

  function updateFilters(next: TransactionFilterState) {
    setFilterState(next)
    setOffset(0)
  }

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

  const hasActiveFilters = isFilterActive(filterState) || !!search

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
        <Button size="sm" onClick={() => navigate('/add?type=expense')}>
          + Add
        </Button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setOffset(0)
            }}
            placeholder="Search description, merchant, notes…"
            className="pl-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <FilterSheet categories={categories} accounts={accounts} members={members} value={filterState} onChange={updateFilters} />
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => {
            setFilterState(emptyFilterState)
            setSearch('')
            setOffset(0)
          }}
          className="mb-3 text-xs font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Clear all filters
        </button>
      )}

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <TransactionList
            transactions={transactions}
            onEdit={(t) => navigate(`/add?id=${t.id}`)}
            onDuplicate={handleDuplicate}
            onDelete={setPendingDelete}
            emptyTitle={hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
            emptyDescription={hasActiveFilters ? 'Try adjusting or clearing your filters.' : "Start tracking your family's spending."}
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
