import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useState } from 'react'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { StatCard } from '@/components/dashboard/StatCard'
import { MonthComparison } from '@/components/dashboard/MonthComparison'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { CategoryBreakdownChart } from '@/components/dashboard/CategoryBreakdownChart'
import { TransactionList } from '@/components/transactions/TransactionList'
import { InsightsCard } from '@/components/dashboard/InsightsCard'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { GoalCard } from '@/components/goals/GoalCard'
import { Target } from 'lucide-react'
import { useMonthTransactions, useAllTimeTransactionAmounts } from '@/hooks/useDashboard'
import { useDeleteTransaction, useDuplicateTransaction } from '@/hooks/useTransactions'
import { useSavingsGoals } from '@/hooks/useGoals'
import { useBudgets } from '@/hooks/useBudgets'
import { computeCategoryTotals, computeSummary, compareSummaries } from '@/lib/calculations'
import { addMonths, currentMonthKey, formatMonthLabel } from '@/lib/dates'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { toFriendlyMessage } from '@/lib/errors'
import { computeInsights } from '@/lib/insights'
import type { TransactionWithRelations } from '@/types'

export default function Dashboard() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const monthKey = params.get('month') ?? currentMonthKey()
  const previousMonthKey = addMonths(monthKey, -1)

  const { transactions, isLoading } = useMonthTransactions(monthKey)
  const { transactions: previousTransactions } = useMonthTransactions(previousMonthKey)
  const { budgets } = useBudgets(monthKey)
  const { transactions: allTimeTransactions } = useAllTimeTransactionAmounts()
  const { goals, isLoading: goalsLoading } = useSavingsGoals()

  const duplicateMutation = useDuplicateTransaction()
  const deleteMutation = useDeleteTransaction()
  const [pendingDelete, setPendingDelete] = useState<TransactionWithRelations | null>(null)

  function setMonthKey(next: string) {
    setParams(next === currentMonthKey() ? {} : { month: next })
  }

  const summary = computeSummary(transactions)
  const previousSummary = computeSummary(previousTransactions)
  const comparison = compareSummaries(summary, previousSummary)
  const totalSummary = computeSummary(allTimeTransactions)

  const expenseCategoryTotals = computeCategoryTotals(transactions.filter((t) => t.type === 'expense'))
  const largestCategory = expenseCategoryTotals[0]
  const largestCategoryDetails = transactions.find((t) => t.category_id === largestCategory?.categoryId)?.category
  const largestExpense = [...transactions].filter((t) => t.type === 'expense').sort((a, b) => Number(b.amount) - Number(a.amount))[0]

  const recentInMonth = transactions.slice(0, 5)
  const insights = computeInsights({ transactions, previousTransactions, budgets })

  async function handleDuplicate(t: TransactionWithRelations) {
    try {
      const created = await duplicateMutation.mutateAsync(t)
      toast.success('Transaction duplicated', { action: { label: 'Edit', onClick: () => navigate(`/add?id=${created.id}`) } })
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
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 text-sm font-semibold">Total Summary</h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total Income" value={formatCurrency(totalSummary.income)} tone="income" />
          <StatCard label="Total Expenses" value={formatCurrency(totalSummary.expense)} tone="expense" />
          <StatCard label="Total Savings" value={formatCurrency(totalSummary.savings)} />
          <StatCard label="Total Leftover" value={formatCurrency(totalSummary.leftover)} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Savings Goals</h2>
          <button
            className="text-xs font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => navigate('/goals')}
          >
            See all
          </button>
        </div>
        {goalsLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
        ) : goals.length === 0 ? (
          <EmptyState icon={Target} title="No savings goals yet" description="Create one from the Goals tab." className="py-6" />
        ) : (
          <div className="space-y-3">
            {goals.slice(0, 3).map((goal) => (
              <GoalCard key={goal.id} goal={goal} onEdit={() => navigate('/goals')} onDelete={() => navigate('/goals')} />
            ))}
          </div>
        )}
      </div>

      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Income" value={formatCurrency(summary.income)} tone="income" />
        <StatCard label="Expenses" value={formatCurrency(summary.expense)} tone="expense" />
        <StatCard label="Savings" value={formatCurrency(summary.savings)} />
        <StatCard label="Savings Rate" value={formatPercent(summary.savingsRate)} />
      </div>

      <QuickActions />

      {!isLoading && transactions.length > 0 && <InsightsCard insights={insights} />}

      {!isLoading && transactions.length > 0 && (
        <MonthComparison
          previousMonthKey={previousMonthKey}
          income={comparison.income}
          expense={comparison.expense}
          savings={comparison.savings}
        />
      )}

      <TrendChart monthKey={monthKey} />
      <CategoryBreakdownChart
        transactions={transactions}
        type="savings"
        onCategoryClick={(categoryId) => navigate(categoryId ? `/transactions?category=${categoryId}` : '/transactions')}
      />
      <CategoryBreakdownChart
        transactions={transactions}
        type="expense"
        onCategoryClick={(categoryId) => navigate(categoryId ? `/transactions?category=${categoryId}` : '/transactions')}
      />

      {!isLoading && transactions.length > 0 && (
        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-semibold">{formatMonthLabel(monthKey)} summary</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transactions</span>
              <span className="font-medium tabular-nums">{transactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Leftover (after spending &amp; saving)</span>
              <span className="font-medium tabular-nums">{formatCurrency(summary.leftover)}</span>
            </div>
            {largestCategory && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Largest category</span>
                <span className="font-medium">
                  {largestCategoryDetails?.icon} {largestCategoryDetails?.name ?? 'Uncategorized'} · {formatCurrency(largestCategory.amount)}
                </span>
              </div>
            )}
            {largestExpense && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Largest expense</span>
                <span className="max-w-[60%] truncate text-right font-medium">
                  {largestExpense.description || largestExpense.category?.name || 'Expense'} · {formatCurrency(Number(largestExpense.amount))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Transactions</h2>
          <button
            className="text-xs font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => navigate('/transactions')}
          >
            See all
          </button>
        </div>
        <TransactionList
          transactions={recentInMonth}
          onEdit={(t) => navigate(`/add?id=${t.id}`)}
          onDuplicate={handleDuplicate}
          onDelete={setPendingDelete}
          emptyTitle="No expenses yet"
          emptyDescription="Start tracking your family's spending for this month."
        />
      </div>

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
