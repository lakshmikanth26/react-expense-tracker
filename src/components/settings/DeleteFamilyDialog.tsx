import { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DeleteFamilyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyName: string
  onConfirm: () => void | Promise<void>
}

/** Requires typing the family's exact name before the destructive action is enabled — this permanently deletes everything. */
export function DeleteFamilyDialog({ open, onOpenChange, familyName, onConfirm }: DeleteFamilyDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (open) setConfirmText('')
  }, [open])

  const canDelete = confirmText === familyName

  async function handleConfirm() {
    if (!canDelete) return
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete all family data?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes {familyName} and everything in it — every transaction, category, account,
            budget, goal, and member. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="delete-family-confirm">
            Type <span className="font-semibold">{familyName}</span> to confirm
          </Label>
          <Input id="delete-family-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canDelete || deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
