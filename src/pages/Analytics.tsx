import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MonthSelector } from '@/components/dashboard/MonthSelector'
import { CategoryAnalyticsTable } from '@/components/analytics/CategoryAnalyticsTable'
import { MemberAnalyticsList } from '@/components/analytics/MemberAnalyticsList'
import { useMonthTransactions } from '@/hooks/useDashboard'
import { useCategories } from '@/hooks/useCategories'
import { useMembers } from '@/hooks/useMembers'
import { addMonths, currentMonthKey } from '@/lib/dates'

export default function Analytics() {
  const [params, setParams] = useSearchParams()
  const monthKey = params.get('month') ?? currentMonthKey()
  const previousMonthKey = addMonths(monthKey, -1)

  const { transactions, isLoading } = useMonthTransactions(monthKey)
  const { transactions: previousTransactions } = useMonthTransactions(previousMonthKey)
  const { categories } = useCategories('expense')
  const { categories: savingsCategories } = useCategories('savings')
  const { members } = useMembers()

  function setMonthKey(next: string) {
    setParams(next === currentMonthKey() ? {} : { month: next })
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Tabs defaultValue="category">
          <TabsList className="w-full">
            <TabsTrigger value="category" className="flex-1">
              By Category
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex-1">
              By Savings
            </TabsTrigger>
            <TabsTrigger value="member" className="flex-1">
              By Member
            </TabsTrigger>
          </TabsList>
          <TabsContent value="category" className="pt-2">
            <CategoryAnalyticsTable transactions={transactions} previousTransactions={previousTransactions} categories={categories} type="expense" />
          </TabsContent>
          <TabsContent value="savings" className="pt-2">
            <CategoryAnalyticsTable
              transactions={transactions}
              previousTransactions={previousTransactions}
              categories={savingsCategories}
              type="savings"
            />
          </TabsContent>
          <TabsContent value="member" className="pt-2">
            <MemberAnalyticsList transactions={transactions} members={members} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
