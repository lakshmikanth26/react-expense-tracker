import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Download,
  Laptop,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Sun,
  Tags,
  Users,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { useTheme } from '@/components/common/theme-provider'
import { useAuth } from '@/hooks/useAuth'
import { useFamily, useInvalidateFamily } from '@/hooks/useFamily'
import { useAddMember, useAllMembers, useUpdateMember } from '@/hooks/useMembers'
import { useCategories, useCreateCategory, useUpdateCategory } from '@/hooks/useCategories'
import { useAccounts, useCreateAccount, useUpdateAccount } from '@/hooks/useAccounts'
import { MemberFormDialog } from '@/components/settings/MemberFormDialog'
import { CategoryFormDialog, type CategoryFormValues } from '@/components/settings/CategoryFormDialog'
import { AccountFormDialog, type AccountFormValues } from '@/components/settings/AccountFormDialog'
import { DeleteFamilyDialog } from '@/components/settings/DeleteFamilyDialog'
import { updateFamily, deleteMyFamily } from '@/services/family'
import { listAllTransactions } from '@/services/transactions'
import { transactionsToCsv, downloadCsv } from '@/lib/csv'
import { todayKey } from '@/lib/dates'
import { toFriendlyMessage } from '@/lib/errors'
import { accountTypeIcons, accountTypeLabels } from '@/lib/account-icons'
import type { Account, Category, CategoryType, FamilyMember } from '@/types'

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP']

export default function Settings() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const { family } = useFamily()
  const invalidateFamily = useInvalidateFamily()

  // ---- Family ----
  const [familyName, setFamilyName] = useState('')
  const [currency, setCurrency] = useState('INR')
  const [savingFamily, setSavingFamily] = useState(false)

  useEffect(() => {
    if (family) {
      setFamilyName(family.name)
      setCurrency(family.currency)
    }
    // Only re-sync when the family identity changes, not on every field edit or refetch —
    // otherwise saving one field would clobber unsaved edits to the other.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id])

  async function handleSaveFamily() {
    if (!family || !familyName.trim()) return
    setSavingFamily(true)
    try {
      await updateFamily(family.id, { name: familyName.trim(), currency })
      await invalidateFamily()
      toast.success('Family settings saved')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save family settings.'))
    } finally {
      setSavingFamily(false)
    }
  }

  // ---- Members ----
  const { members, isLoading: membersLoading } = useAllMembers()
  const addMemberMutation = useAddMember()
  const updateMemberMutation = useUpdateMember()
  const [memberDialog, setMemberDialog] = useState<{ open: boolean; editing: FamilyMember | null }>({
    open: false,
    editing: null,
  })

  async function handleSaveMember(name: string) {
    try {
      if (memberDialog.editing) {
        await updateMemberMutation.mutateAsync({ id: memberDialog.editing.id, updates: { name } })
        toast.success('Member updated')
      } else {
        await addMemberMutation.mutateAsync(name)
        toast.success('Member added')
      }
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save this member.'))
    }
  }

  async function handleToggleMember(member: FamilyMember) {
    try {
      await updateMemberMutation.mutateAsync({ id: member.id, updates: { is_active: !member.is_active } })
      toast.success(member.is_active ? 'Member deactivated' : 'Member reactivated')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not update this member.'))
    }
  }

  // ---- Categories ----
  const { categories: expenseCategories, isLoading: expenseCategoriesLoading } = useCategories('expense')
  const { categories: incomeCategories, isLoading: incomeCategoriesLoading } = useCategories('income')
  const allCategories = [...expenseCategories, ...incomeCategories]
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; editing: Category | null; type: CategoryType }>({
    open: false,
    editing: null,
    type: 'expense',
  })

  async function handleSaveCategory(values: CategoryFormValues) {
    try {
      if (categoryDialog.editing) {
        await updateCategoryMutation.mutateAsync({
          id: categoryDialog.editing.id,
          updates: { name: values.name, icon: values.icon },
        })
        toast.success('Category updated')
      } else {
        await createCategoryMutation.mutateAsync({
          name: values.name,
          type: values.type,
          icon: values.icon,
          color: null,
          parent_id: values.parentId,
        })
        toast.success('Category added')
      }
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save this category.'))
    }
  }

  async function handleToggleCategory(category: Category) {
    try {
      await updateCategoryMutation.mutateAsync({ id: category.id, updates: { is_active: !category.is_active } })
      toast.success(category.is_active ? 'Category deactivated' : 'Category reactivated')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not update this category.'))
    }
  }

  // ---- Accounts ----
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const createAccountMutation = useCreateAccount()
  const updateAccountMutation = useUpdateAccount()
  const [accountDialog, setAccountDialog] = useState<{ open: boolean; editing: Account | null }>({
    open: false,
    editing: null,
  })

  async function handleSaveAccount(values: AccountFormValues) {
    try {
      if (accountDialog.editing) {
        await updateAccountMutation.mutateAsync({
          id: accountDialog.editing.id,
          updates: { name: values.name, type: values.type },
        })
        toast.success('Account updated')
      } else {
        await createAccountMutation.mutateAsync({
          name: values.name,
          type: values.type,
          opening_balance: values.openingBalance || '0',
        })
        toast.success('Account added')
      }
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not save this account.'))
    }
  }

  async function handleToggleAccount(account: Account) {
    try {
      await updateAccountMutation.mutateAsync({ id: account.id, updates: { is_active: !account.is_active } })
      toast.success('Account deactivated')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not update this account.'))
    }
  }

  // ---- Data ----
  const [exportingCsv, setExportingCsv] = useState(false)
  const [deleteFamilyOpen, setDeleteFamilyOpen] = useState(false)

  async function handleExportCsv() {
    if (!family) return
    setExportingCsv(true)
    try {
      const transactions = await listAllTransactions(family.id)
      const csv = transactionsToCsv(transactions)
      downloadCsv(`family-finance-export-${todayKey()}.csv`, csv)
      toast.success('Export downloaded')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not export your transactions.'))
    } finally {
      setExportingCsv(false)
    }
  }

  async function handleDeleteFamily() {
    if (!family) return
    try {
      await deleteMyFamily(family.id)
      await signOut()
      navigate('/login')
    } catch (error) {
      toast.error(toFriendlyMessage(error, 'Could not delete your family data.'))
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {/* Family */}
      <Card>
        <CardHeader>
          <CardTitle>Family</CardTitle>
          <CardDescription>Your family's name and default currency.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="family-name">Family name</Label>
              <Input id="family-name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currency !== 'INR' && (
                <p className="text-xs text-muted-foreground">
                  Only INR is fully formatted today — other currencies will show amounts using {currency}'s symbol via
                  the browser's default formatting.
                </p>
              )}
            </div>
          </div>
          <Button size="sm" onClick={handleSaveFamily} disabled={savingFamily || !familyName.trim()}>
            Save family settings
          </Button>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="size-4" /> Members
            </span>
            <Button size="sm" onClick={() => setMemberDialog({ open: true, editing: null })}>
              <Plus className="size-4" /> Add
            </Button>
          </CardTitle>
          <CardDescription>People in your family who can be tagged on transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : members.length === 0 ? (
            <EmptyState icon={Users} title="No members yet" description="Add the people in your family." />
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className={member.is_active ? 'font-medium' : 'font-medium text-muted-foreground line-through'}>
                      {member.name}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit member"
                      onClick={() => setMemberDialog({ open: true, editing: member })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Switch
                      checked={member.is_active}
                      onCheckedChange={() => handleToggleMember(member)}
                      aria-label={member.is_active ? 'Deactivate member' : 'Reactivate member'}
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="size-4" /> Categories
          </CardTitle>
          <CardDescription>Group your transactions for budgets and reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {(
            [
              { type: 'expense' as const, label: 'Expense', categories: expenseCategories, isLoading: expenseCategoriesLoading },
              { type: 'income' as const, label: 'Income', categories: incomeCategories, isLoading: incomeCategoriesLoading },
            ]
          ).map((group) => (
            <div key={group.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">{group.label}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCategoryDialog({ open: true, editing: null, type: group.type })}
                >
                  <Plus className="size-4" /> Add
                </Button>
              </div>
              {group.isLoading ? (
                <p className="py-2 text-center text-sm text-muted-foreground">Loading…</p>
              ) : group.categories.length === 0 ? (
                <EmptyState title={`No ${group.label.toLowerCase()} categories yet`} className="py-6" />
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between rounded-xl border p-3">
                      <span className="flex items-center gap-2">
                        <span className="text-lg leading-none">{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                        {category.parent_id && <span className="text-xs text-muted-foreground">(sub)</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit category"
                          onClick={() => setCategoryDialog({ open: true, editing: category, type: category.type })}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Switch
                          checked={category.is_active}
                          onCheckedChange={() => handleToggleCategory(category)}
                          aria-label="Deactivate category"
                        />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wallet className="size-4" /> Accounts
            </span>
            <Button size="sm" onClick={() => setAccountDialog({ open: true, editing: null })}>
              <Plus className="size-4" /> Add
            </Button>
          </CardTitle>
          <CardDescription>Where your money lives — cash, bank accounts, cards, and wallets.</CardDescription>
        </CardHeader>
        <CardContent>
          {accountsLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading…</p>
          ) : accounts.length === 0 ? (
            <EmptyState icon={Wallet} title="No accounts yet" description="Add an account to start tracking balances." />
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-xl border p-3">
                  <span className="flex items-center gap-3">
                    <span className="text-lg leading-none">{accountTypeIcons[account.type]}</span>
                    <span className="flex flex-col">
                      <span className="font-medium">{account.name}</span>
                      <span className="text-xs text-muted-foreground">{accountTypeLabels[account.type]}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit account"
                      onClick={() => setAccountDialog({ open: true, editing: account })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Switch
                      checked={account.is_active}
                      onCheckedChange={() => handleToggleAccount(account)}
                      aria-label="Deactivate account"
                    />
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Choose how the app looks on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-lg border p-1">
            <Button variant={theme === 'system' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('system')}>
              <Laptop className="size-4" /> System
            </Button>
            <Button variant={theme === 'light' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('light')}>
              <Sun className="size-4" /> Light
            </Button>
            <Button variant={theme === 'dark' ? 'default' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>
              <Moon className="size-4" /> Dark
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Export your transactions or sign out.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exportingCsv}>
            <Download className="size-4" /> Export CSV
          </Button>
          <div>
            <Button variant="ghost" size="sm" onClick={() => signOut().then(() => navigate('/login'))}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Permanently delete this family and everything in it — transactions, categories, accounts, budgets,
            goals, and members. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" onClick={() => setDeleteFamilyOpen(true)}>
            Delete family data
          </Button>
        </CardContent>
      </Card>

      <MemberFormDialog
        trigger={<span />}
        editing={memberDialog.editing}
        open={memberDialog.open}
        onOpenChange={(open) => setMemberDialog({ open, editing: open ? memberDialog.editing : null })}
        onSave={handleSaveMember}
      />

      <CategoryFormDialog
        trigger={<span />}
        editing={categoryDialog.editing}
        defaultType={categoryDialog.type}
        categories={allCategories}
        open={categoryDialog.open}
        onOpenChange={(open) => setCategoryDialog((s) => ({ ...s, open, editing: open ? s.editing : null }))}
        onSave={handleSaveCategory}
      />

      <AccountFormDialog
        trigger={<span />}
        editing={accountDialog.editing}
        open={accountDialog.open}
        onOpenChange={(open) => setAccountDialog({ open, editing: open ? accountDialog.editing : null })}
        onSave={handleSaveAccount}
      />

      <DeleteFamilyDialog
        open={deleteFamilyOpen}
        onOpenChange={setDeleteFamilyOpen}
        familyName={family?.name ?? ''}
        onConfirm={handleDeleteFamily}
      />
    </div>
  )
}
