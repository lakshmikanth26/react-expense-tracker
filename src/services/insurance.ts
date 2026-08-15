import { supabase } from '@/lib/supabase'
import type { Insurance, InsuranceDocument } from '@/types'

const DOCUMENTS_BUCKET = 'insurance-documents'

export async function listInsurances(familyId: string): Promise<Insurance[]> {
  const { data, error } = await supabase
    .from('insurances')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Insurance[]
}

export interface InsuranceInput {
  family_id: string
  name: string
  type: Insurance['type']
  provider: string | null
  policy_number: string | null
  premium_amount: number | null
  renewal_date: string | null
  notes: string | null
}

export async function createInsurance(input: InsuranceInput): Promise<Insurance> {
  const { data, error } = await supabase.from('insurances').insert(input).select().single()
  if (error) throw error
  return data as Insurance
}

export async function updateInsurance(id: string, updates: Partial<InsuranceInput>): Promise<Insurance> {
  const { data, error } = await supabase.from('insurances').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data as Insurance
}

/** Deletes the insurance row (which cascades its insurance_documents rows) after first
 *  removing the underlying files — Storage doesn't garbage-collect objects on its own
 *  just because the row referencing them disappears. */
export async function deleteInsurance(id: string): Promise<void> {
  const documents = await listInsuranceDocuments(id)
  if (documents.length > 0) {
    const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(documents.map((d) => d.storage_path))
    if (storageError) throw storageError
  }
  const { error } = await supabase.from('insurances').delete().eq('id', id)
  if (error) throw error
}

export async function listInsuranceDocuments(insuranceId: string): Promise<InsuranceDocument[]> {
  const { data, error } = await supabase
    .from('insurance_documents')
    .select('*')
    .eq('insurance_id', insuranceId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as InsuranceDocument[]
}

/** Uploads to the private bucket under "{family_id}/{insurance_id}/..." (the path Storage RLS scopes on), then records the row. */
export async function uploadInsuranceDocument(familyId: string, insuranceId: string, file: File): Promise<InsuranceDocument> {
  const safeName = file.name.replace(/[^\w.\-]/g, '_')
  const storagePath = `${familyId}/${insuranceId}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, file, {
    contentType: file.type || undefined,
  })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('insurance_documents')
    .insert({
      insurance_id: insuranceId,
      family_id: familyId,
      file_name: file.name,
      storage_path: storagePath,
      file_size: file.size,
      content_type: file.type || null,
    })
    .select()
    .single()
  if (error) throw error
  return data as InsuranceDocument
}

/** Bucket is private, so downloads go through a short-lived signed URL rather than a public one. */
export async function getInsuranceDocumentUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(storagePath, 60)
  if (error) throw error
  return data.signedUrl
}

export async function deleteInsuranceDocument(document: InsuranceDocument): Promise<void> {
  const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.storage_path])
  if (storageError) throw storageError
  const { error } = await supabase.from('insurance_documents').delete().eq('id', document.id)
  if (error) throw error
}
