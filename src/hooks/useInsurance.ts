import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFamily } from './useFamily'
import {
  createInsurance,
  deleteInsurance,
  deleteInsuranceDocument,
  listInsurances,
  listInsuranceDocuments,
  updateInsurance,
  uploadInsuranceDocument,
  type InsuranceInput,
} from '@/services/insurance'
import type { InsuranceDocument } from '@/types'

function insurancesQueryKey(familyId: string | undefined) {
  return ['insurances', familyId] as const
}

function documentsQueryKey(insuranceId: string) {
  return ['insurance-documents', insuranceId] as const
}

export function useInsurances() {
  const { family } = useFamily()
  const query = useQuery({
    queryKey: insurancesQueryKey(family?.id),
    queryFn: () => listInsurances(family!.id),
    enabled: !!family,
  })
  return { insurances: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

function useInvalidateInsurances() {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: insurancesQueryKey(family?.id) })
}

export function useCreateInsurance() {
  const invalidate = useInvalidateInsurances()
  return useMutation({ mutationFn: (input: InsuranceInput) => createInsurance(input), onSuccess: invalidate })
}

export function useUpdateInsurance() {
  const invalidate = useInvalidateInsurances()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<InsuranceInput> }) => updateInsurance(id, updates),
    onSuccess: invalidate,
  })
}

export function useDeleteInsurance() {
  const invalidate = useInvalidateInsurances()
  return useMutation({ mutationFn: (id: string) => deleteInsurance(id), onSuccess: invalidate })
}

export function useInsuranceDocuments(insuranceId: string) {
  const query = useQuery({
    queryKey: documentsQueryKey(insuranceId),
    queryFn: () => listInsuranceDocuments(insuranceId),
  })
  return { documents: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

export function useUploadInsuranceDocument(insuranceId: string) {
  const { family } = useFamily()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadInsuranceDocument(family!.id, insuranceId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQueryKey(insuranceId) }),
  })
}

export function useDeleteInsuranceDocument(insuranceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (document: InsuranceDocument) => deleteInsuranceDocument(document),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentsQueryKey(insuranceId) }),
  })
}
