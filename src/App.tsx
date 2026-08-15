import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, PublicOnlyRoute, OnboardingRoute } from '@/components/common/ProtectedRoute'
import { FullPageSpinner } from '@/components/common/FullPageSpinner'

const Login = lazy(() => import('@/pages/auth/Login'))
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'))
const Onboarding = lazy(() => import('@/pages/Onboarding'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Transactions = lazy(() => import('@/pages/Transactions'))
const AddTransaction = lazy(() => import('@/pages/AddTransaction'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Budgets = lazy(() => import('@/pages/Budgets'))
const Goals = lazy(() => import('@/pages/Goals'))
const Recurring = lazy(() => import('@/pages/Recurring'))
const Accounts = lazy(() => import('@/pages/Accounts'))
const InsurancePage = lazy(() => import('@/pages/Insurance'))
const Reports = lazy(() => import('@/pages/Reports'))
const Settings = lazy(() => import('@/pages/Settings'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<OnboardingRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/add" element={<AddTransaction />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/recurring" element={<Recurring />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/insurance" element={<InsurancePage />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
