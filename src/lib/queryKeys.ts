/** Central registry of react-query keys, so mutations invalidate consistently across hooks. */
export const queryKeys = {
  family: (userId: string | undefined) => ['my-family', userId] as const,
  categories: (familyId: string | undefined) => ['categories', familyId] as const,
  accounts: (familyId: string | undefined) => ['accounts', familyId] as const,
  members: (familyId: string | undefined) => ['family-members', familyId] as const,
  recentTransactions: (familyId: string | undefined) => ['transactions', 'recent', familyId] as const,
  transactionsList: (familyId: string | undefined, filters?: unknown) =>
    ['transactions', 'list', familyId, filters] as const,
  transaction: (id: string | undefined) => ['transactions', 'detail', id] as const,
}
