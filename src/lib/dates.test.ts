import { describe, expect, it } from 'vitest'
import { addMonths, advanceDateKey, monthKeyOf, toDateKey } from './dates'

describe('advanceDateKey', () => {
  it('advances monthly', () => {
    expect(advanceDateKey('2026-01-01', 'monthly', 1)).toBe('2026-02-01')
  })

  it('clamps day-of-month overflow (Jan 31 -> Feb 28)', () => {
    expect(advanceDateKey('2026-01-31', 'monthly', 1)).toBe('2026-02-28')
  })

  it('respects a leap year when clamping', () => {
    expect(advanceDateKey('2028-01-31', 'monthly', 1)).toBe('2028-02-29')
  })

  it('advances yearly', () => {
    expect(advanceDateKey('2026-03-10', 'yearly', 1)).toBe('2027-03-10')
  })

  it('advances weekly by 7 * interval days', () => {
    expect(advanceDateKey('2026-01-01', 'weekly', 2)).toBe('2026-01-15')
  })

  it('advances daily', () => {
    expect(advanceDateKey('2026-01-30', 'daily', 3)).toBe('2026-02-02')
  })
})

describe('monthKeyOf / addMonths', () => {
  it('normalizes any day within a month to the 1st', () => {
    expect(monthKeyOf('2026-08-27')).toBe('2026-08-01')
  })

  it('rolls over year boundaries', () => {
    expect(addMonths('2026-12-01', 1)).toBe('2027-01-01')
    expect(addMonths('2026-01-01', -1)).toBe('2025-12-01')
  })
})

describe('toDateKey', () => {
  it('uses local date parts, not UTC', () => {
    // A date constructed from local y/m/d must format back to the same key regardless
    // of the runner's timezone offset — this is the whole point of avoiding ISO/UTC round-trips.
    const date = new Date(2026, 7, 15) // August 15, 2026, local time
    expect(toDateKey(date)).toBe('2026-08-15')
  })
})
