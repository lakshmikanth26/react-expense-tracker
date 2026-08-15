import { useState } from 'react'
import { Wallet2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'sign-in' | 'sign-up'

export default function Login() {
  const { signInWithPassword, signUpWithPassword, signInWithOtp, verifyOtp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } =
      mode === 'sign-in' ? await signInWithPassword(email, password) : await signUpWithPassword(email, password)
    setLoading(false)

    if (error) {
      toast.error(error)
      return
    }
    if (mode === 'sign-up') {
      toast.success('Check your email to confirm your account.')
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    if (!otpSent) {
      const { error } = await signInWithOtp(email)
      setLoading(false)
      if (error) return toast.error(error)
      setOtpSent(true)
      toast.success('We sent a 6-digit code to your email.')
      return
    }
    const { error } = await verifyOtp(email, otp)
    setLoading(false)
    if (error) toast.error(error)
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error('Enter your email above first.')
      return
    }
    const { error } = await resetPassword(email)
    if (error) toast.error(error)
    else toast.success('Password reset email sent.')
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Wallet2 className="mb-1 size-8 text-primary" />
          <CardTitle className="text-xl">Family Finance Tracker</CardTitle>
          <CardDescription>Track expenses and income together, in seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password">
            <TabsList className="w-full">
              <TabsTrigger value="password" className="flex-1">
                Password
              </TabsTrigger>
              <TabsTrigger value="otp" className="flex-1">
                Email code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="pt-4">
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'sign-in' && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-muted-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {mode === 'sign-in' ? 'Sign in' : 'Create account'}
                </Button>
                <button
                  type="button"
                  onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                  className="w-full text-center text-sm text-muted-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="otp" className="pt-4">
              <form className="space-y-4" onSubmit={handleOtpSubmit}>
                <div className="space-y-1.5">
                  <Label htmlFor="otp-email">Email</Label>
                  <Input
                    id="otp-email"
                    type="email"
                    required
                    disabled={otpSent}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {otpSent && (
                  <div className="space-y-1.5">
                    <Label htmlFor="otp-code">6-digit code</Label>
                    <Input
                      id="otp-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {otpSent ? 'Verify code' : 'Send code'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
