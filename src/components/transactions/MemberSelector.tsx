import { useState } from 'react'
import { ChevronRight, Users } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { FamilyMember } from '@/types'

interface MemberSelectorProps {
  members: FamilyMember[]
  value: string | null
  onChange: (memberId: string | null) => void
}

/** A transaction doesn't have to belong to a person — "Family" (null) is a first-class option. */
export function MemberSelector({ members, value, onChange }: MemberSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = members.find((m) => m.id === value)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2">
            <Avatar className="size-6">
              <AvatarFallback className="text-xs">
                {selected ? selected.name.charAt(0).toUpperCase() : <Users className="size-3.5" />}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{selected?.name ?? 'Family'}</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Member</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1.5 pt-2 pb-6">
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
            data-selected={value === null}
          >
            <Avatar className="size-7">
              <AvatarFallback>
                <Users className="size-4" />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">Family</span>
          </button>
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                onChange(member.id)
                setOpen(false)
              }}
              className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
              data-selected={member.id === value}
            >
              <Avatar className="size-7">
                <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{member.name}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
