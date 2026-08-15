import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartCard } from './ChartCard'
import { computeCategoryTotals } from '@/lib/calculations'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import type { Category, TransactionWithRelations } from '@/types'

const PALETTE = [
  'oklch(0.65 0.19 25)',
  'oklch(0.7 0.16 155)',
  'oklch(0.7 0.17 75)',
  'oklch(0.62 0.19 280)',
  'oklch(0.68 0.16 210)',
  'oklch(0.72 0.18 330)',
  'oklch(0.6 0.12 60)',
  'oklch(0.55 0.02 260)',
]

interface CategoryBreakdownChartProps {
  transactions: TransactionWithRelations[]
  onCategoryClick?: (categoryId: string | null) => void
}

export function CategoryBreakdownChart({ transactions, onCategoryClick }: CategoryBreakdownChartProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totals = computeCategoryTotals(expenses)
  const categoryById = new Map<string, Pick<Category, 'id' | 'name' | 'icon'>>()
  for (const t of expenses) {
    if (t.category_id && t.category && !categoryById.has(t.category_id)) {
      categoryById.set(t.category_id, t.category)
    }
  }

  const data = totals.map((total, index) => ({
    ...total,
    name: (total.categoryId && categoryById.get(total.categoryId)?.name) || 'Uncategorized',
    icon: (total.categoryId && categoryById.get(total.categoryId)?.icon) || '📋',
    color: PALETTE[index % PALETTE.length],
  }))

  return (
    <ChartCard
      title="Spending by Category"
      isEmpty={data.length === 0}
      emptyMessage="Add a few expenses to see your spending breakdown."
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <ResponsiveContainer width="100%" height={200} className="max-w-[200px]">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              onClick={onCategoryClick ? (entry: unknown) => onCategoryClick((entry as { categoryId: string | null }).categoryId) : undefined}
              cursor={onCategoryClick ? 'pointer' : undefined}
            >
              {data.map((entry) => (
                <Cell key={entry.categoryId ?? 'uncategorized'} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value), undefined, { showDecimals: true })} />
          </PieChart>
        </ResponsiveContainer>

        <div className="w-full flex-1 space-y-1.5">
          {data.slice(0, 6).map((entry) => (
            <button
              key={entry.categoryId ?? 'uncategorized'}
              type="button"
              onClick={() => onCategoryClick?.(entry.categoryId)}
              disabled={!onCategoryClick}
              className="flex w-full items-center justify-between rounded text-sm disabled:cursor-default"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="truncate">
                  {entry.icon} {entry.name}
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatPercent(entry.percentage)}</span>
            </button>
          ))}
        </div>
      </div>
    </ChartCard>
  )
}
