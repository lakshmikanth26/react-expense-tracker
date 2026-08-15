import { useEffect, useState } from 'react'
import { Check, Copy, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toFriendlyMessage } from '@/lib/errors'
import { useCreateTelegramLinkCode } from '@/hooks/useTelegram'
import type { FamilyMember } from '@/types'

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string | undefined

interface TelegramLinkDialogProps {
  member: FamilyMember | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TelegramLinkDialog({ member, open, onOpenChange }: TelegramLinkDialogProps) {
  const createCode = useCreateTelegramLinkCode()
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open && member) {
      setCode(null)
      setCopied(false)
      createCode.mutate(member.id, { onSuccess: (data) => setCode(data.code) })
    }
    // Only (re-)generate when the dialog opens for a member, not on every mutation identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member?.id])

  function handleCopy() {
    if (!code) return
    navigator.clipboard.writeText(`/link ${code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect {member?.name} to Telegram</DialogTitle>
          <DialogDescription>
            Message the bot the code below to add transactions by chatting — e.g. "Expense - 500 - Food - today".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {createCode.isPending ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Generating code…</p>
          ) : createCode.isError ? (
            <p className="py-4 text-center text-sm text-destructive">
              {toFriendlyMessage(createCode.error, 'Could not generate a link code.')}
            </p>
          ) : code ? (
            <>
              <div className="flex items-center justify-between rounded-xl border bg-muted/40 p-4">
                <code className="text-2xl font-semibold tracking-widest">{code}</code>
                <Button variant="outline" size="icon-sm" aria-label="Copy link command" onClick={handleCopy}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Open Telegram and start a chat with the bot{BOT_USERNAME ? ` @${BOT_USERNAME}` : ''}.</li>
                <li>
                  Send <code className="rounded bg-muted px-1 py-0.5">/link {code}</code>
                </li>
                <li>You're linked — this code expires in 10 minutes.</li>
              </ol>
              {BOT_USERNAME && (
                <Button asChild variant="secondary" className="w-full">
                  <a href={`https://t.me/${BOT_USERNAME}?start=${code}`} target="_blank" rel="noopener noreferrer">
                    <Send className="size-4" /> Open chat with bot
                  </a>
                </Button>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
