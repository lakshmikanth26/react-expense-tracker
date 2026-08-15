import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { generateDueRecurringTransactions } from '@/services/recurring'

/** Families already synced this session — avoids re-running on every route change/remount. */
const syncedFamilyIds = new Set<string>()

/**
 * Catches up any due recurring transactions once per family per app session. This is a
 * static-hosted SPA with no backend scheduler, so "due" recurring transactions are
 * generated client-side the next time a family member opens the app, rather than by a
 * cron job — see services/recurring.ts for the idempotency approach.
 */
export function useRecurringSync() {
  const { family } = useFamily()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!family || syncedFamilyIds.has(family.id)) return
    syncedFamilyIds.add(family.id)

    generateDueRecurringTransactions(family.id)
      .then((count) => {
        if (count > 0) {
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
          queryClient.invalidateQueries({ queryKey: ['recurring-transactions', family.id] })
        }
      })
      .catch((error) => console.error('Failed to generate due recurring transactions', error))
  }, [family, queryClient])
}
