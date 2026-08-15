import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { useMonthTransactions } from '@/hooks/useDashboard'
import { useYearTransactions } from '@/hooks/useReports'
import { useBudgets } from '@/hooks/useBudgets'
import { computeBudgetUsage, computeCategoryTotals, computeMonthlySeries, computeSummary } from '@/lib/calculations'
import { currentMonthKey, formatMonthLabel } from '@/lib/dates'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import { downloadCsv, transactionsToCsv } from '@/lib/csv'
import { toFriendlyMessage } from '@/lib/errors'
import type { TransactionWithRelations } from '@/types'

function ExportButton({ label, getTransactions, filename }: { label: string; getTransactions: () => TransactionWithRelations[]; filename: string }) {
  function handleExport() {
    try {
      const transactions = getTransactions()
      downloadCsv(filename, transactionsToCsv(transactions))
      toast.success('CSV exported')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not export CSV.'))
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="size-4" /> {label}
    </Button>
  )
}

function MonthlyReport({ monthKey, onChangeMonth }: { monthKey: string; onChangeMonth: (m: string) => void }) {
  const { transactions } = useMonthTransactions(monthKey)
  const { budgets } = useBudgets(monthKey)
  const summary = computeSummary(transactions)
  const expenseTotals = computeCategoryTotals(transactions.filter((t) => t.type === 'expense'))
  const categoryById = new Map(transactions.filter((t) => t.category).map((t) => [t.category_id, t.category!]))
  const largestExpenses = [...transactions].filter((t) => t.type === 'expense').sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 5)
  const spentByCategory = new Map(expenseTotals.map((t) => [t.categoryId, t.amount]))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <MonthSelector monthKey={monthKey} onChange={onChangeMonth} />
        <ExportButton
          label="Export CSV"
          getTransactions={() => transactions}
          filename={`family-finance-${monthKey.slice(0, 7)}.csv`}
        />
      </div>

      <div className="rounded-xl border p-4">
        <p className="mb-3 text-sm font-semibold">{formatMonthLabel(monthKey)}</p>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Income</dt><dd className="font-medium tabular-nums text-income">{formatCurrency(summary.income)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Expenses</dt><dd className="font-medium tabular-nums text-expense">{formatCurrency(summary.expense)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Savings</dt><dd className="font-medium tabular-nums">{formatCurrency(summary.savings)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Savings rate</dt><dd className="font-medium tabular-nums">{formatPercent(summary.savingsRate)}</dd></div>
        </dl>
      </div>

      <div className="rounded-xl border p-4">
        <p className="mb-3 text-sm font-semibold">Top categories</p>
        {expenseTotals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses this month.</p>
        ) : (
          <div className="space-y-1.5 text-sm">
            {expenseTotals.slice(0, 8).map((t) => (
              <div key={t.categoryId ?? 'uncategorized'} className="flex justify-between">
                <span className="text-muted-foreground">
                  {categoryById.get(t.categoryId)?.icon} {categoryById.get(t.categoryId)?.name ?? 'Uncategorized'}
                </span>
                <span className="tabular-nums">{formatCurrency(t.amount)} ({formatPercent(t.percentage, 0)})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border p-4">
        <p className="mb-3 text-sm font-semibold">Largest expenses</p>
        {largestExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expenses this month.</p>
        ) : (
          <div className="space-y-1.5 text-sm">
            {largestExpenses.map((t) => (
              <div key={t.id} className="flex justify-between">
                <span className="max-w-[65%] truncate text-muted-foreground">{t.description || t.category?.name || 'Expense'}</span>
                <span className="tabular-nums">{formatCurrency(Number(t.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {budgets.length > 0 && (
        <div className="rounded-xl border p-4">
          <p className="mb-3 text-sm font-semibold">Budget performance</p>
          <div className="space-y-1.5 text-sm">
            {budgets.map((b) => {
              const spent = b.category_id ? (spentByCategory.get(b.category_id) ?? 0) : summary.expense
              const usage = computeBudgetUsage(spent, Number(b.amount))
              const label = b.category_id ? (categoryById.get(b.category_id)?.name ?? 'Category') : 'Overall'
              return (
                <div key={b.id} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={usage.status === 'over' ? 'font-medium text-expense' : 'tabular-nums'}>{formatPercent(usage.percentage, 0)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function YearlyReport({ year, onChangeYear }: { year: number; onChangeYear: (y: number) => void }) {
  const { transactions } = useYearTransactions(year)
  const series = computeMonthlySeries(transactions, `${year}-01-01`, `${year}-12-01`)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onChangeYear(year - 1)} aria-label="Previous year">
            ‹
          </Button>
          <span className="text-base font-semibold">{year}</span>
          <Button variant="ghost" size="icon" onClick={() => onChangeYear(year + 1)} disabled={year >= new Date().getFullYear()} aria-label="Next year">
            ›
          </Button>
        </div>
        <ExportButton label="Export CSV" getTransactions={() => transactions} filename={`family-finance-${year}.csv`} />
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="p-3 font-medium">Month</th>
              <th className="p-3 text-right font-medium">Income</th>
              <th className="p-3 text-right font-medium">Expenses</th>
              <th className="p-3 text-right font-medium">Savings</th>
            </tr>
          </thead>
          <tbody>
            {series.map((point) => (
              <tr key={point.month} className="border-b last:border-0">
                <td className="p-3">{formatMonthLabel(point.month).split(' ')[0]}</td>
                <td className="p-3 text-right tabular-nums text-income">{formatCurrency(point.income)}</td>
                <td className="p-3 text-right tabular-nums text-expense">{formatCurrency(point.expense)}</td>
                <td className="p-3 text-right tabular-nums">{formatCurrency(point.savings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Reports() {
  const [params, setParams] = useSearchParams()
  const monthKey = params.get('month') ?? currentMonthKey()
  const [year, setYear] = useState(new Date().getFullYear())

  function setMonthKey(next: string) {
    setParams(next === currentMonthKey() ? {} : { month: next })
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
      <Tabs defaultValue="monthly">
        <TabsList className="w-full">
          <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
          <TabsTrigger value="yearly" className="flex-1">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="monthly" className="pt-4">
          <MonthlyReport monthKey={monthKey} onChangeMonth={setMonthKey} />
        </TabsContent>
        <TabsContent value="yearly" className="pt-4">
          <YearlyReport year={year} onChangeYear={setYear} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
