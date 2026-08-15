import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FamilyMember } from '@/types'

interface MemberFormDialogProps {
  trigger: React.ReactNode
  editing?: FamilyMember | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSave: (name: string) => void | Promise<void>
}

export function MemberFormDialog({ trigger, editing, open, onOpenChange, onSave }: MemberFormDialogProps) {
  const [name, setName] = useState(editing?.name ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setName(editing?.name ?? '')
  }, [open, editing])

  const canSave = name.trim().length > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave(name.trim())
      onOpenChange?.(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit member' : 'Add member'}</DialogTitle>
          <DialogDescription>Family members can be tagged on transactions to track who spent what.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="member-name">Name</Label>
          <Input id="member-name" placeholder="Priya" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            Save member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
