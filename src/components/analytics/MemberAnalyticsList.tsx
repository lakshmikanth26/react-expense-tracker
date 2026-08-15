import { Users } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { computeCategoryTotals, computeMemberTotals } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'
import type { FamilyMember, TransactionWithRelations } from '@/types'

interface MemberAnalyticsListProps {
  transactions: TransactionWithRelations[]
  members: FamilyMember[]
}

export function MemberAnalyticsList({ transactions, members }: MemberAnalyticsListProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totals = computeMemberTotals(expenses)
  const memberById = new Map(members.map((m) => [m.id, m]))

  if (totals.length === 0) {
    return <EmptyState icon={Users} title="Not enough data yet" description="Add a few expenses to see spending by member." />
  }

  return (
    <div className="space-y-4">
      {totals.map((total) => {
        const member = total.memberId ? memberById.get(total.memberId) : null
        const memberExpenses = expenses.filter((t) => t.member_id === total.memberId)
        const topCategories = computeCategoryTotals(memberExpenses).slice(0, 3)
        const categoryNameById = new Map<string, string>()
        for (const t of memberExpenses) {
          if (t.category_id && t.category) categoryNameById.set(t.category_id, `${t.category.icon ?? ''} ${t.category.name}`.trim())
        }

        return (
          <div key={total.memberId ?? 'family'} className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <Avatar className="size-8">
                  <AvatarFallback>{member ? member.name.charAt(0).toUpperCase() : <Users className="size-4" />}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{member?.name ?? 'Family'}</span>
              </span>
              <span className="font-semibold tabular-nums">{formatCurrency(total.amount)}</span>
            </div>
            {topCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topCategories.map((c) => (
                  <span key={c.categoryId ?? 'uncategorized'} className="rounded-full bg-muted px-2.5 py-1 text-xs">
                    {(c.categoryId && categoryNameById.get(c.categoryId)) || 'Uncategorized'} · {formatCurrency(c.amount)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
