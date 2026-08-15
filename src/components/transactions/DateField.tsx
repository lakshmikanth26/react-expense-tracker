import { Button } from '@/components/ui/button'
import { todayKey } from '@/lib/dates'

interface DateFieldProps {
  value: string
  onChange: (dateKey: string) => void
}

/** Native `<input type="date">` already operates in the browser's local calendar — no UTC round-trip to worry about. */
export function DateField({ value, onChange }: DateFieldProps) {
  const isToday = value === todayKey()

  return (
    <div className="flex items-center gap-2 rounded-lg border px-4 py-3">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm font-medium outline-none"
        aria-label="Transaction date"
      />
      {!isToday && (
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange(todayKey())}>
          Today
        </Button>
      )}
    </div>
  )
}
