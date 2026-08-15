import type { TransactionWithRelations } from '@/types'
import { accountTypeLabels } from './account-icons'

function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) return `"${field.replace(/"/g, '""')}"`
  return field
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n')
}

const CSV_HEADER = ['Date', 'Type', 'Amount', 'Category', 'Member', 'Account', 'Description', 'Merchant', 'Notes']

export function transactionsToCsv(transactions: TransactionWithRelations[]): string {
  const rows = transactions.map((t) => [
    t.transaction_date,
    t.type,
    String(Number(t.amount)),
    t.type === 'transfer' ? `${t.account?.name ?? ''} -> ${t.transfer_to_account?.name ?? ''}` : (t.category?.name ?? ''),
    t.member?.name ?? 'Family',
    t.account ? `${t.account.name} (${accountTypeLabels[t.account.type]})` : '',
    t.description ?? '',
    t.merchant ?? '',
    t.notes ?? '',
  ])
  return toCsv([CSV_HEADER, ...rows])
}

/** Triggers a real browser download — this is a deployed web app, not a sandboxed preview. */
export function downloadCsv(filename: string, csv: string): void {
  // Leading BOM so Excel detects UTF-8 instead of mangling the ₹ symbol / non-ASCII text.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
