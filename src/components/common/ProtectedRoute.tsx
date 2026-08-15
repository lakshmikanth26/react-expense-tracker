import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useFamily } from '@/hooks/useFamily'
import { FullPageSpinner } from './FullPageSpinner'

/** Requires a signed-in user with a family; otherwise redirects to /login or /onboarding. */
export function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth()
  const { hasFamily, isLoading: familyLoading } = useFamily()
  const location = useLocation()

  if (authLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (familyLoading) return <FullPageSpinner />
  if (!hasFamily) return <Navigate to="/onboarding" replace />

  return <Outlet />
}

/** For /login — bounces an already-signed-in user onward instead of showing the form again. */
export function PublicOnlyRoute() {
  const { user, loading: authLoading } = useAuth()
  const { hasFamily, isLoading: familyLoading } = useFamily()

  if (authLoading || (user && familyLoading)) return <FullPageSpinner />
  if (user) return <Navigate to={hasFamily ? '/' : '/onboarding'} replace />

  return <Outlet />
}

/** For /onboarding — requires a signed-in user who doesn't have a family yet. */
export function OnboardingRoute() {
  const { user, loading: authLoading } = useAuth()
  const { hasFamily, isLoading: familyLoading } = useFamily()

  if (authLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (familyLoading) return <FullPageSpinner />
  if (hasFamily) return <Navigate to="/" replace />

  return <Outlet />
}
