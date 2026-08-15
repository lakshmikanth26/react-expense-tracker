import { supabase } from '@/lib/supabase'
import type { TelegramLinkCode } from '@/types'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
const CODE_LENGTH = 6
const CODE_TTL_MINUTES = 10

function generateCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

/** Replaces any unused code for this member with a fresh one, valid for 10 minutes. */
export async function createTelegramLinkCode(familyId: string, memberId: string): Promise<TelegramLinkCode> {
  await supabase.from('telegram_link_codes').delete().eq('member_id', memberId).is('used_at', null)

  const { data, error } = await supabase
    .from('telegram_link_codes')
    .insert({
      family_id: familyId,
      member_id: memberId,
      code: generateCode(),
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60_000).toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data as TelegramLinkCode
}
