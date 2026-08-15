import { Home, Receipt, BarChart3, Wallet, Target, Repeat, Settings, Landmark, FileText, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Primary items shown in the mobile bottom nav (Add is rendered separately as the center FAB). */
export const primaryNavItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

/** Extra destinations, shown in the "More" sheet on mobile and inline in the desktop sidebar. */
export const secondaryNavItems: NavItem[] = [
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/reports', label: 'Reports', icon: FileText },
  { to: '/settings', label: 'Settings', icon: Settings },
]
