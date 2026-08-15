import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Never surface raw Postgres/PostgREST errors to users (constraint names, SQLSTATE
 * codes, etc). Map the ones our schema can actually raise to friendly copy; log the
 * original for debugging and fall back to a generic message for anything else.
 */
export function toFriendlyMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const pgError = error as PostgrestError
    const message = pgError.message ?? ''

    if (message.includes('transactions_amount_positive') || message.includes('recurring_transactions_amount_positive')) {
      return 'Amount must be greater than zero.'
    }
    if (message.includes('transfer_needs_destination')) {
      return 'Please choose a different destination account for this transfer.'
    }
    if (message.includes('does not belong to family')) {
      return 'That category, account, or member is no longer available. Please re-select and try again.'
    }
    if (message.includes('already belong to a family')) {
      return 'You already belong to a family.'
    }
    if (pgError.code === '23505') {
      return 'That already exists.'
    }
    if (pgError.code === 'PGRST301' || pgError.code === '401') {
      return 'Your session has expired. Please sign in again.'
    }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You appear to be offline. Please check your connection and try again.'
  }

  console.error(error)
  return fallback
}
