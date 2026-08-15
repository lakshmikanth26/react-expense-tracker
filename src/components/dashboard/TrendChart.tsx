import { useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartCard } from './ChartCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMonthlyTrend } from '@/hooks/useDashboard'
import { computeMonthlySeries } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import { parseDateKey } from '@/lib/dates'

const RANGE_OPTIONS = [
  { value: '1', label: 'This month' },
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'This year' },
]

export function TrendChart({ monthKey }: { monthKey: string }) {
  const [monthsBack, setMonthsBack] = useState('6')
  const { transactions, earliestMonthKey, isLoading } = useMonthlyTrend(monthKey, Number(monthsBack))
  const series = computeMonthlySeries(transactions, earliestMonthKey, monthKey).map((point) => ({
    ...point,
    label: parseDateKey(point.month).toLocaleDateString('en-IN', { month: 'short' }),
  }))
  const hasData = series.some((p) => p.income > 0 || p.expense > 0)

  return (
    <ChartCard
      title="Income vs Expense & Savings"
      headerRight={
        <Select value={monthsBack} onValueChange={setMonthsBack}>
          <SelectTrigger size="sm" className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      isEmpty={!isLoading && !hasData}
    >
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={series} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
          <YAxis tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" width={40} tickFormatter={(v) => formatCurrency(v)} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value), undefined, { showDecimals: true })}
            contentStyle={{ background: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name="Income" fill="var(--income)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="var(--expense)" radius={[4, 4, 0, 0]} />
          <Line dataKey="savings" name="Savings" stroke="var(--primary)" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
