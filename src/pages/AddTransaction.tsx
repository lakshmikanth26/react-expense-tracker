import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/transactions/CurrencyInput'
import { CategorySelector } from '@/components/transactions/CategorySelector'
import { AccountSelector } from '@/components/transactions/AccountSelector'
import { MemberSelector } from '@/components/transactions/MemberSelector'
import { DateField } from '@/components/transactions/DateField'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'
import { useFamily } from '@/hooks/useFamily'
import { useCategories } from '@/hooks/useCategories'
import { useAccounts } from '@/hooks/useAccounts'
import { useMembers } from '@/hooks/useMembers'
import { useCreateTransaction, useUpdateTransaction, useRecentTransactions } from '@/hooks/useTransactions'
import { getTransaction } from '@/services/transactions'
import { queryKeys } from '@/lib/queryKeys'
import { getRecentSelection, saveRecentSelection } from '@/lib/recent-selections'
import { todayKey } from '@/lib/dates'
import { toFriendlyMessage } from '@/lib/errors'
import { formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { TransactionType } from '@/types'

const typeLabel: Record<TransactionType, string> = {
  expense: 'Expense',
  income: 'Income',
  transfer: 'Transfer',
}

export default function AddTransaction() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { family } = useFamily()
  const editId = params.get('id')

  const editQuery = useQuery({
    queryKey: queryKeys.transaction(editId ?? undefined),
    queryFn: () => getTransaction(editId!),
    enabled: !!editId,
  })

  const type: TransactionType = (editQuery.data?.type ?? (params.get('type') as TransactionType | null) ?? 'expense')

  const { categories } = useCategories(type === 'transfer' ? undefined : type)
  const { accounts } = useAccounts()
  const { members } = useMembers()
  const { transactions: recent } = useRecentTransactions(5)
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [transferToAccountId, setTransferToAccountId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [dateKey, setDateKey] = useState(todayKey())
  const [note, setNote] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Prefill: edit mode loads the existing transaction; create mode applies last-used
  // smart defaults for this transaction type so the common case needs zero taps.
  useEffect(() => {
    if (initialized) return
    if (editId) {
      if (!editQuery.data) return
      const t = editQuery.data
      setAmount(String(Number(t.amount)))
      setCategoryId(t.category_id)
      setAccountId(t.account_id)
      setTransferToAccountId(t.transfer_to_account_id)
      setMemberId(t.member_id)
      setDateKey(t.transaction_date)
      setNote(t.description ?? '')
      setInitialized(true)
      return
    }
    const recentDefault = getRecentSelection(type)
    if (recentDefault) {
      setCategoryId(recentDefault.categoryId)
      setAccountId(recentDefault.accountId)
      setMemberId(recentDefault.memberId)
    }
    setInitialized(true)
  }, [editId, editQuery.data, type, initialized])

  const [saving, setSaving] = useState(false)

  const canSave = useMemo(() => {
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) return false
    if (!accountId) return false
    if (type === 'transfer') return !!transferToAccountId && transferToAccountId !== accountId
    return !!categoryId
  }, [amount, accountId, categoryId, transferToAccountId, type])

  async function handleSave() {
    if (!family || !canSave) return
    setSaving(true)
    const input = {
      family_id: family.id,
      member_id: memberId,
      category_id: type === 'transfer' ? null : categoryId,
      account_id: accountId,
      transfer_to_account_id: type === 'transfer' ? transferToAccountId : null,
      type,
      amount: Number(amount),
      transaction_date: dateKey,
      description: note.trim() || null,
      notes: null,
      merchant: null,
      payment_method: null,
    }

    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, input })
        toast.success('Transaction updated')
      } else {
        await createMutation.mutateAsync(input)
        saveRecentSelection(type, { categoryId, accountId, memberId })
        toast.success(`${typeLabel[type]} saved`)
      }
      navigate('/transactions')
    } catch (error) {
      toast.error(toFriendlyMessage(error, `Unable to save this ${type}. Please try again.`))
    } finally {
      setSaving(false)
    }
  }

  if (editId && editQuery.isLoading) return <FullPageSpinner />

  return (
    <div className="pb-8">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {editId ? `Edit ${typeLabel[type]}` : `Add ${typeLabel[type]}`}
        </h1>
      </div>

      <CurrencyInput value={amount} onChange={setAmount} autoFocus />

      <div className="space-y-3">
        {type !== 'transfer' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <CategorySelector categories={categories} value={categoryId} onChange={setCategoryId} />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{type === 'transfer' ? 'From account' : 'Account'}</label>
          <AccountSelector label="account" accounts={accounts} value={accountId} onChange={setAccountId} excludeId={type === 'transfer' ? transferToAccountId : undefined} />
        </div>

        {type === 'transfer' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To account</label>
            <AccountSelector
              label="destination account"
              accounts={accounts}
              value={transferToAccountId}
              onChange={setTransferToAccountId}
              excludeId={accountId}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Member</label>
          <MemberSelector members={members} value={memberId} onChange={setMemberId} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Date</label>
          <DateField value={dateKey} onChange={setDateKey} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Optional</label>
          <Textarea placeholder="Add note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
      </div>

      {!editId && recent.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Recent — tap to reuse</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recent.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setAmount(String(Number(t.amount)))
                  if (t.category_id && type !== 'transfer') setCategoryId(t.category_id)
                  if (t.account_id) setAccountId(t.account_id)
                  if (t.member_id !== undefined) setMemberId(t.member_id)
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
              >
                <span>{t.category?.icon ?? '📋'}</span>
                {t.category?.name ?? t.description ?? 'Transaction'}
                <span className="text-muted-foreground">{formatCurrency(Number(t.amount))}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        className={cn('mt-6 h-12 w-full text-base font-semibold')}
        disabled={!canSave || saving}
        onClick={handleSave}
      >
        {editId ? 'Save changes' : `Save ${typeLabel[type]}`}
      </Button>
    </div>
  )
}
