import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/formatters'
import type { SavingsGoal } from '@/types'

interface GoalsChartProps {
  goals: SavingsGoal[]
}

interface GoalsChartTooltipPayload {
  fullName: string
  current: number
  target: number
  percentage: number
}

function GoalsTooltip({ active, payload }: { active?: boolean; payload?: { payload: GoalsChartTooltipPayload }[] }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{point.fullName}</p>
      <p>
        {formatCurrency(point.current)} of {formatCurrency(point.target)} ({formatPercent(point.percentage, 0)})
      </p>
    </div>
  )
}

/** Horizontal bars showing % complete per goal — a compact, at-a-glance chart for the Home page. */
export function GoalsChart({ goals }: GoalsChartProps) {
  const data = goals.map((goal) => {
    const target = Number(goal.target_amount)
    const current = Number(goal.current_amount)
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
    const label = goal.name.length > 14 ? `${goal.name.slice(0, 13)}…` : goal.name
    return {
      name: `${goal.icon ?? '🎯'} ${label}`,
      fullName: goal.name,
      percentage,
      current,
      target,
    }
  })

  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 44, 80)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
        <Tooltip content={<GoalsTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
        <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((entry) => (
            <Cell key={entry.fullName} fill={entry.percentage >= 100 ? 'var(--color-income)' : 'var(--color-savings)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
