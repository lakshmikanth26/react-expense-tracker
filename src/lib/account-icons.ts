import type { AccountType } from '@/types'

export const accountTypeIcons: Record<AccountType, string> = {
  cash: '💵',
  bank: '🏦',
  savings: '💰',
  credit_card: '💳',
  upi: '📱',
  wallet: '👛',
  other: '📦',
}

export const accountTypeLabels: Record<AccountType, string> = {
  cash: 'Cash',
  bank: 'Bank Account',
  savings: 'Savings Account',
  credit_card: 'Credit Card',
  upi: 'UPI',
  wallet: 'Wallet',
  other: 'Other',
}
