// Mirrors prisma/schema.prisma. Hand-maintained rather than generated: the app
// never runs `prisma generate` (Prisma is a dev-time migration tool only), and
// `supabase gen types` requires CLI access to a live project this repo doesn't
// assume. Keep this in sync whenever the schema changes.
//
// All `numeric`/`decimal` columns are typed as `string`, not `number`: PostgREST
// serializes them as strings to avoid float precision loss over the wire. Always
// go through toPaise()/fromPaise() in lib/calculations.ts rather than doing
// arithmetic on them directly.

export type CategoryType = 'expense' | 'income' | 'savings'

export type AccountType = 'cash' | 'bank' | 'savings' | 'credit_card' | 'upi' | 'wallet' | 'other'

export type TransactionType = 'expense' | 'income' | 'transfer' | 'savings'

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Family {
  id: string
  name: string
  currency: string
  created_at: string
  updated_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string | null
  name: string
  avatar_url: string | null
  is_active: boolean
  /** BIGINT — kept as a string like other large/precise numeric columns (see header note). */
  telegram_chat_id: string | null
  created_at: string
  updated_at: string
}

export interface TelegramLinkCode {
  id: string
  family_id: string
  member_id: string
  code: string
  expires_at: string
  used_at: string | null
  created_at: string
}

export interface Category {
  id: string
  family_id: string
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  parent_id: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  family_id: string
  name: string
  type: AccountType
  opening_balance: string
  current_balance: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  family_id: string
  member_id: string | null
  category_id: string | null
  account_id: string | null
  transfer_to_account_id: string | null
  type: TransactionType
  amount: string
  transaction_date: string
  description: string | null
  notes: string | null
  merchant: string | null
  payment_method: string | null
  is_recurring: boolean
  recurring_transaction_id: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

/** Transaction joined with the display fields the UI needs, in one round trip. */
export interface TransactionWithRelations extends Transaction {
  category: Pick<Category, 'id' | 'name' | 'icon' | 'color' | 'type'> | null
  account: Pick<Account, 'id' | 'name' | 'type'> | null
  transfer_to_account: Pick<Account, 'id' | 'name' | 'type'> | null
  member: Pick<FamilyMember, 'id' | 'name' | 'avatar_url'> | null
}

export interface RecurringTransaction {
  id: string
  family_id: string
  member_id: string | null
  category_id: string | null
  account_id: string | null
  transfer_to_account_id: string | null
  type: TransactionType
  amount: string
  description: string | null
  frequency: RecurringFrequency
  interval: number
  start_date: string
  end_date: string | null
  day_of_month: number | null
  next_run_date: string
  last_generated_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Budget {
  id: string
  family_id: string
  category_id: string | null
  month: string
  amount: string
  created_at: string
  updated_at: string
}

export interface SavingsGoal {
  id: string
  family_id: string
  name: string
  icon: string | null
  target_amount: string
  current_amount: string
  target_date: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface QuickAddPreset {
  id: string
  family_id: string
  label: string
  icon: string | null
  type: TransactionType
  amount: string | null
  category_id: string | null
  account_id: string | null
  member_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}
