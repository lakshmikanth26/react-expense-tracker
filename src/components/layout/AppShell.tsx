import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 pb-20 md:pb-0">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
