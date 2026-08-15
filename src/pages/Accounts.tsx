import { Link } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { AccountBalanceRow } from '@/components/accounts/AccountBalanceRow'
import { useAccounts } from '@/hooks/useAccounts'
import { summarizeAccountBalances } from '@/lib/calculations'
import { formatCurrency } from '@/lib/formatters'

export default function Accounts() {
  const { accounts, isLoading } = useAccounts()
  const summary = summarizeAccountBalances(accounts)

  const assetAccounts = accounts.filter((a) => a.type !== 'credit_card' || Number(a.current_balance) >= 0)
  const liabilityAccounts = accounts.filter((a) => a.type === 'credit_card' && Number(a.current_balance) < 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <Button asChild size="sm" variant="outline">
          <Link to="/settings">Manage</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
      ) : accounts.length === 0 ? (
        <EmptyState icon={Wallet} title="No accounts yet" description="Add an account from Settings to start tracking balances." />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs font-medium text-muted-foreground">Assets</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-income">{formatCurrency(summary.assets)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs font-medium text-muted-foreground">Liabilities</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-expense">{formatCurrency(summary.liabilities)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs font-medium text-muted-foreground">Net worth</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatCurrency(summary.netWorth)}</p>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Assets</h2>
            <div className="space-y-2">
              {assetAccounts.map((a) => (
                <AccountBalanceRow key={a.id} account={a} />
              ))}
            </div>
          </div>

          {liabilityAccounts.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Liabilities</h2>
              <div className="space-y-2">
                {liabilityAccounts.map((a) => (
                  <AccountBalanceRow key={a.id} account={a} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
