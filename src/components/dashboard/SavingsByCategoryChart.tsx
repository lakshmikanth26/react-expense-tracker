import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from './ChartCard'
import { computeCategoryTotals } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import type { Category, TransactionWithRelations } from '@/types'

const BAR_COLOR = 'var(--color-savings)'

interface SavingsByCategoryChartProps {
  transactions: TransactionWithRelations[]
  onCategoryClick?: (categoryId: string | null) => void
}

/** Amounts by category as a bar chart — a pie/donut reads poorly with only a couple of
 *  savings categories (a near-full or near-empty ring), so this favors exact numbers. */
export function SavingsByCategoryChart({ transactions, onCategoryClick }: SavingsByCategoryChartProps) {
  const filtered = transactions.filter((t) => t.type === 'savings')
  const totals = computeCategoryTotals(filtered)
  const categoryById = new Map<string, Pick<Category, 'id' | 'name' | 'icon'>>()
  for (const t of filtered) {
    if (t.category_id && t.category && !categoryById.has(t.category_id)) {
      categoryById.set(t.category_id, t.category)
    }
  }

  const data = totals.slice(0, 8).map((total) => ({
    ...total,
    name: (total.categoryId && categoryById.get(total.categoryId)?.name) || 'Uncategorized',
    icon: (total.categoryId && categoryById.get(total.categoryId)?.icon) || '📋',
  }))

  return (
    <ChartCard
      title="Savings by Category"
      isEmpty={data.length === 0}
      emptyMessage="Add a savings entry to see where your money is going."
    >
      <ResponsiveContainer width="100%" height={Math.max(data.length * 40, 60)}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 64, top: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 12 }}
            tickFormatter={(name: string) => `${data.find((d) => d.name === name)?.icon ?? '📋'} ${name}`}
          />
          <Tooltip formatter={(value) => formatCurrency(Number(value), undefined, { showDecimals: true })} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
          <Bar
            dataKey="amount"
            radius={[0, 6, 6, 0]}
            barSize={18}
            onClick={onCategoryClick ? (entry: unknown) => onCategoryClick((entry as { categoryId: string | null }).categoryId) : undefined}
            cursor={onCategoryClick ? 'pointer' : undefined}
          >
            {data.map((entry) => (
              <Cell key={entry.categoryId ?? 'uncategorized'} fill={BAR_COLOR} />
            ))}
            <LabelList dataKey="amount" position="right" formatter={(value: unknown) => formatCurrency(Number(value))} style={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
