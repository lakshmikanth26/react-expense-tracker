import type { TransactionType } from '@/types'

interface RecentSelection {
  categoryId: string | null
  accountId: string | null
  memberId: string | null
}

const STORAGE_KEY = 'fft-recent-selections'

function readAll(): Partial<Record<TransactionType, RecentSelection>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** Remembers the last category/account/member used per transaction type, so the next Add form starts pre-filled. */
export function getRecentSelection(type: TransactionType): RecentSelection | null {
  return readAll()[type] ?? null
}

export function saveRecentSelection(type: TransactionType, selection: RecentSelection): void {
  const all = readAll()
  all[type] = selection
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // Storage can be unavailable (private browsing, quota) — smart defaults are a nicety, not critical.
  }
}
