import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type OAuthProvider = 'google' | 'azure'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signUpWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithPhoneOtp: (phone: string) => Promise<{ error: string | null }>
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: string | null }>
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      async signInWithPassword(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return { error: error?.message ?? null }
      },
      async signUpWithPassword(email, password) {
        const { error } = await supabase.auth.signUp({ email, password })
        return { error: error?.message ?? null }
      },
      async signInWithPhoneOtp(phone) {
        const { error } = await supabase.auth.signInWithOtp({ phone })
        return { error: error?.message ?? null }
      },
      async verifyPhoneOtp(phone, token) {
        const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' })
        return { error: error?.message ?? null }
      },
      async signInWithOAuth(provider) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
        })
        return { error: error?.message ?? null }
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
        })
        return { error: error?.message ?? null }
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password })
        return { error: error?.message ?? null }
      },
      async signOut() {
        await supabase.auth.signOut()
      },
    }),
    [session, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
