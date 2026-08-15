import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ChartCardProps {
  title: string
  headerRight?: ReactNode
  children: ReactNode
  isEmpty?: boolean
  emptyMessage?: string
}

export function ChartCard({ title, headerRight, children, isEmpty, emptyMessage }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {headerRight}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-[220px] flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
            <p>Not enough data yet.</p>
            <p className="text-xs">{emptyMessage ?? 'Add a few transactions to see this chart.'}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}
