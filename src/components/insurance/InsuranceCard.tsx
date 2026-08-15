import { useRef } from 'react'
import { toast } from 'sonner'
import { Download, FileText, MoreVertical, Pencil, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { insuranceTypeIcons, insuranceTypeLabels } from '@/lib/insurance-icons'
import { formatCurrency } from '@/lib/formatters'
import { getInsuranceDocumentUrl } from '@/services/insurance'
import { useInsuranceDocuments, useUploadInsuranceDocument, useDeleteInsuranceDocument } from '@/hooks/useInsurance'
import { toFriendlyMessage } from '@/lib/errors'
import type { Insurance, InsuranceDocument } from '@/types'

interface InsuranceCardProps {
  insurance: Insurance
  onEdit: () => void
  onDelete: () => void
}

export function InsuranceCard({ insurance, onEdit, onDelete }: InsuranceCardProps) {
  const { documents, isLoading } = useInsuranceDocuments(insurance.id)
  const uploadMutation = useUploadInsuranceDocument(insurance.id)
  const deleteDocMutation = useDeleteInsuranceDocument(insurance.id)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await uploadMutation.mutateAsync(file)
      toast.success('Document uploaded')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not upload this file.'))
    }
  }

  async function handleDownload(doc: InsuranceDocument) {
    try {
      const url = await getInsuranceDocumentUrl(doc.storage_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not open this document.'))
    }
  }

  async function handleDeleteDoc(doc: InsuranceDocument) {
    try {
      await deleteDocMutation.mutateAsync(doc)
      toast.success('Document removed')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not remove this document.'))
    }
  }

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <span className="text-xl leading-none">{insuranceTypeIcons[insurance.type]}</span>
          {insurance.name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Insurance actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-sm text-muted-foreground">
        {insuranceTypeLabels[insurance.type]}
        {insurance.provider && ` · ${insurance.provider}`}
        {insurance.policy_number && ` · #${insurance.policy_number}`}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {insurance.premium_amount && `Premium: ${formatCurrency(Number(insurance.premium_amount))}`}
        {insurance.premium_amount && insurance.renewal_date && ' · '}
        {insurance.renewal_date && `Renews: ${new Date(insurance.renewal_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
      </p>
      {insurance.notes && <p className="mt-1 text-sm text-muted-foreground">{insurance.notes}</p>}

      <div className="mt-3 space-y-1.5">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading documents…</p>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-2.5 py-1.5 text-sm">
              <button
                type="button"
                onClick={() => handleDownload(doc)}
                className="flex min-w-0 items-center gap-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{doc.file_name}</span>
                <Download className="size-3.5 shrink-0 text-muted-foreground" />
              </button>
              <button
                type="button"
                aria-label="Remove document"
                onClick={() => handleDeleteDoc(doc)}
                className="shrink-0 text-muted-foreground outline-none hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <X className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} accept=".pdf,image/*" />
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadMutation.isPending}
      >
        <Upload className="size-4" /> {uploadMutation.isPending ? 'Uploading…' : 'Upload document'}
      </Button>
    </div>
  )
}
