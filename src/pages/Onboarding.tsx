import { useState } from 'react'
import { Wallet2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createFamilyWithDefaults } from '@/services/family'
import { useInvalidateFamily } from '@/hooks/useFamily'
import { toFriendlyMessage } from '@/lib/errors'

export default function Onboarding() {
  const [familyName, setFamilyName] = useState('')
  const [memberName, setMemberName] = useState('')
  const [loading, setLoading] = useState(false)
  const invalidateFamily = useInvalidateFamily()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await createFamilyWithDefaults(familyName.trim(), memberName.trim())
      await invalidateFamily()
      toast.success('Your family is set up.')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not create your family. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Wallet2 className="mb-1 size-8 text-primary" />
          <CardTitle className="text-xl">Set up your family</CardTitle>
          <CardDescription>
            We'll create sensible default categories and accounts so you can start tracking right away.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="family-name">Family name</Label>
              <Input
                id="family-name"
                placeholder="The Kumar Family"
                required
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-name">Your name</Label>
              <Input
                id="member-name"
                placeholder="Lakshmikanth"
                required
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Create family
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
