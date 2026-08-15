import { accountTypeIcons } from '@/lib/account-icons'
import { formatCurrencyPrecise } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { Account } from '@/types'

export function AccountBalanceRow({ account }: { account: Account }) {
  const balance = Number(account.current_balance)
  const isNegative = balance < 0

  return (
    <div className="flex items-center justify-between rounded-xl border p-4">
      <span className="flex items-center gap-3">
        <span className="text-xl leading-none">{accountTypeIcons[account.type]}</span>
        <span className="font-medium">{account.name}</span>
      </span>
      <span className={cn('font-semibold tabular-nums', isNegative && 'text-expense')}>
        {isNegative ? '−' : ''}
        {formatCurrencyPrecise(Math.abs(balance))}
      </span>
    </div>
  )
}
