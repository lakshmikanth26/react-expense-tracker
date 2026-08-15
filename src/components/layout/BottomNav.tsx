import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Plus, MoreHorizontal } from 'lucide-react'
import { primaryNavItems, secondaryNavItems } from './nav-items'
import { AddActionMenu } from './AddActionMenu'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

const [home, transactions, analytics] = primaryNavItems

function NavButton({ to, label, Icon }: { to: string; label: string; Icon: (typeof primaryNavItems)[number]['icon'] }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground'
        )
      }
    >
      <Icon className="size-5" />
      {label}
    </NavLink>
  )
}

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        <NavButton to={home.to} label={home.label} Icon={home.icon} />
        <NavButton to={transactions.to} label={transactions.label} Icon={transactions.icon} />

        <div className="flex flex-1 items-center justify-center">
          <AddActionMenu
            trigger={
              <button
                type="button"
                aria-label="Add transaction"
                className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
              >
                <Plus className="size-7" />
              </button>
            }
          />
        </div>

        <NavButton to={analytics.to} label={analytics.label} Icon={analytics.icon} />

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium text-muted-foreground"
            >
              <MoreHorizontal className="size-5" />
              More
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <SheetTitle className="sr-only">More options</SheetTitle>
            <div className="grid grid-cols-2 gap-2 pt-4">
              {secondaryNavItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium"
                >
                  <Icon className="size-5 text-muted-foreground" />
                  {label}
                </NavLink>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
