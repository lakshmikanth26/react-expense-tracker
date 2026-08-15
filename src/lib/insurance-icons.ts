import type { InsuranceType } from '@/types'

export const insuranceTypeIcons: Record<InsuranceType, string> = {
  health: '🩺',
  life: '❤️',
  vehicle: '🚗',
  home: '🏠',
  other: '📄',
}

export const insuranceTypeLabels: Record<InsuranceType, string> = {
  health: 'Health',
  life: 'Life',
  vehicle: 'Vehicle',
  home: 'Home',
  other: 'Other',
}
