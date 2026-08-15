import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/formatters'
import type { SavingsGoal } from '@/types'

const SAVED_COLOR = 'var(--color-savings)'
const REMAINING_COLOR = 'var(--muted)'
const COMPLETE_COLOR = 'var(--color-income)'

interface GoalsChartProps {
  goals: SavingsGoal[]
}

function GoalDonut({ goal }: { goal: SavingsGoal }) {
  const target = Number(goal.target_amount)
  const current = Number(goal.current_amount)
  const complete = target > 0 && current >= target
  const saved = target > 0 ? Math.min(current, target) : current
  const remaining = Math.max(target - current, 0)
  const data = target > 0 ? [{ name: 'saved', value: saved }, { name: 'remaining', value: remaining }] : [{ name: 'saved', value: 1 }]

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative size-[104px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={34} outerRadius={48} startAngle={90} endAngle={-270} stroke="none">
              <Cell fill={complete ? COMPLETE_COLOR : SAVED_COLOR} />
              {target > 0 && <Cell fill={REMAINING_COLOR} />}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), undefined, { showDecimals: true })}
              wrapperStyle={{ zIndex: 20 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-sm leading-tight font-semibold tabular-nums">{formatCurrency(current)}</span>
          {target > 0 && <span className="text-[10px] leading-tight text-muted-foreground">of {formatCurrency(target)}</span>}
        </div>
      </div>
      <span className="flex max-w-[104px] items-center gap-1 truncate text-xs font-medium">
        <span className="leading-none">{goal.icon ?? '🎯'}</span>
        <span className="truncate">{goal.name}</span>
      </span>
    </div>
  )
}

/** One donut per goal, showing exact saved/target amounts rather than a percentage. */
export function GoalsChart({ goals }: GoalsChartProps) {
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3">
      {goals.map((goal) => (
        <GoalDonut key={goal.id} goal={goal} />
      ))}
    </div>
  )
}
