import { useState } from 'react'
import { ChevronRight, Shapes } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Category } from '@/types'

interface CategorySelectorProps {
  categories: Category[]
  value: string | null
  onChange: (categoryId: string) => void
  recentCategoryId?: string | null
}

export function CategorySelector({ categories, value, onChange, recentCategoryId }: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = categories.find((c) => c.id === value)

  const ordered = recentCategoryId
    ? [...categories].sort((a, b) => (a.id === recentCategoryId ? -1 : b.id === recentCategoryId ? 1 : 0))
    : categories

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex items-center gap-2">
            <span className="text-xl leading-none">{selected?.icon ?? '📋'}</span>
            <span className="font-medium">{selected?.name ?? 'Choose category'}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Category</SheetTitle>
        </SheetHeader>
        {ordered.length === 0 ? (
          <p className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <Shapes className="size-6" />
            No categories yet. Add one from Settings.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 pt-2 pb-6">
            {ordered.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  onChange(category.id)
                  setOpen(false)
                }}
                className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
                data-selected={category.id === value}
              >
                <span className="text-2xl leading-none">{category.icon ?? '📋'}</span>
                <span className="line-clamp-1 text-xs font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
