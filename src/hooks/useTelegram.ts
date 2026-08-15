import { useMutation } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import { createTelegramLinkCode } from '@/services/telegram'

export function useCreateTelegramLinkCode() {
  const { family } = useFamily()
  return useMutation({
    mutationFn: (memberId: string) => createTelegramLinkCode(family!.id, memberId),
  })
}
