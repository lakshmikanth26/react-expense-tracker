import type { Insight } from '@/lib/insights'

export function InsightsCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null

  return (
    <div className="rounded-xl border p-4">
      <p className="mb-3 text-sm font-semibold">Insights</p>
      <ul className="space-y-2.5">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="leading-tight">{insight.icon}</span>
            <span className="text-muted-foreground">{insight.text}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
