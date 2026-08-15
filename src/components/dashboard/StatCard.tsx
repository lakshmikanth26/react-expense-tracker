import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  tone?: 'default' | 'income' | 'expense'
  sub?: ReactNode
  className?: string
}

export function StatCard({ label, value, tone = 'default', sub, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border p-4', className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          tone === 'income' && 'text-income',
          tone === 'expense' && 'text-expense'
        )}
      >
        {value}
      </p>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}
