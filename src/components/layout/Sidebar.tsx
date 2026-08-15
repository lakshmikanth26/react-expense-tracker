import { NavLink } from 'react-router-dom'
import { LogOut, Wallet2 } from 'lucide-react'
import { primaryNavItems, secondaryNavItems } from './nav-items'
import { AddActionMenu } from './AddActionMenu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useFamily } from '@/hooks/useFamily'

function SidebarLink({ to, label, Icon }: { to: string; label: string; Icon: (typeof primaryNavItems)[number]['icon'] }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      <Icon className="size-4" />
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  const { signOut } = useAuth()
  const { family } = useFamily()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <Wallet2 className="size-6 text-primary" />
        <span className="truncate font-semibold">{family?.name ?? 'Family Finance'}</span>
      </div>

      <div className="px-3">
        <AddActionMenu trigger={<Button className="w-full justify-center">+ Add</Button>} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {[...primaryNavItems, ...secondaryNavItems].map((item) => (
          <SidebarLink key={item.to} {...item} Icon={item.icon} />
        ))}
      </nav>

      <div className="border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={() => signOut()}>
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </aside>
  )
}
