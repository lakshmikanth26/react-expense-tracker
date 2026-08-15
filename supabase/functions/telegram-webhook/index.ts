// Supabase Edge Function: receives Telegram Bot API webhook updates and lets
// linked family members add transactions by chatting, e.g.:
//   Expense - 20K - Food - LK - today
//
// Deploy: supabase functions deploy telegram-webhook
// Secrets: supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=...
// Register: see supabase/functions/telegram-webhook/register-webhook.sh
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically by the
// Edge Functions runtime — never set those as function secrets yourself.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')!
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const TYPE_ALIASES: Record<string, 'expense' | 'income' | 'savings'> = {
  expense: 'expense',
  exp: 'expense',
  spend: 'expense',
  income: 'income',
  inc: 'income',
  earn: 'income',
  savings: 'savings',
  saving: 'savings',
  save: 'savings',
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function sendMessage(chatId: number, text: string) {
  return fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.trim().replace(/^(rs\.?|inr|₹)\s*/i, '').replace(/,/g, '')
  const match = cleaned.match(/^([\d.]+)\s*(k|l|lakh|cr|crore|m)?$/i)
  if (!match) return null
  const value = parseFloat(match[1])
  if (Number.isNaN(value)) return null
  const suffix = (match[2] ?? '').toLowerCase()
  const multiplier = suffix === 'k' ? 1_000 : suffix === 'l' || suffix === 'lakh' ? 100_000 : suffix === 'cr' || suffix === 'crore' ? 10_000_000 : suffix === 'm' ? 1_000_000 : 1
  return value * multiplier
}

/** Returns a YYYY-MM-DD date string, or null if `raw` doesn't look like a date at all. */
function parseDate(raw: string): string | null {
  const token = raw.trim().toLowerCase()
  const today = new Date()
  if (token === 'today') return toDateKey(today)
  if (token === 'yesterday') return toDateKey(new Date(today.getTime() - 86_400_000))
  if (token === 'tomorrow') return toDateKey(new Date(today.getTime() + 86_400_000))

  let m = token.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return toDateKey(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])))

  m = token.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) return toDateKey(new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])))

  m = token.match(/^(\d{1,2})\s+([a-z]{3,})\s*(\d{4})?$/)
  if (m) {
    const month = MONTHS[m[2].slice(0, 3)]
    if (month === undefined) return null
    return toDateKey(new Date(m[3] ? Number(m[3]) : today.getFullYear(), month, Number(m[1])))
  }

  return null
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toLowerCase()
}

interface FamilyMemberRow {
  id: string
  name: string
}

function findMember(token: string, members: FamilyMemberRow[]): FamilyMemberRow | null {
  const t = token.trim().toLowerCase()
  return (
    members.find((m) => m.name.toLowerCase() === t) ??
    members.find((m) => initials(m.name) === t) ??
    members.find((m) => m.name.toLowerCase().startsWith(t)) ??
    null
  )
}

interface CategoryRow {
  id: string
  name: string
}

function findCategory(token: string, categories: CategoryRow[]): CategoryRow | null {
  const t = token.trim().toLowerCase()
  return (
    categories.find((c) => c.name.toLowerCase() === t) ??
    categories.find((c) => c.name.toLowerCase().startsWith(t)) ??
    categories.find((c) => c.name.toLowerCase().includes(t)) ??
    null
  )
}

interface GoalRow {
  id: string
  name: string
}

function findGoal(token: string, goals: GoalRow[]): GoalRow | null {
  const t = token.trim().toLowerCase()
  return (
    goals.find((g) => g.name.toLowerCase() === t) ??
    goals.find((g) => g.name.toLowerCase().startsWith(t)) ??
    goals.find((g) => g.name.toLowerCase().includes(t)) ??
    null
  )
}

async function handleLink(chatId: number, code: string) {
  const trimmed = code.trim().toUpperCase()
  const { data: linkCode } = await supabase
    .from('telegram_link_codes')
    .select('id, family_id, member_id, expires_at, used_at')
    .eq('code', trimmed)
    .maybeSingle()

  if (!linkCode || linkCode.used_at || new Date(linkCode.expires_at) < new Date()) {
    await sendMessage(chatId, "That code isn't valid or has expired. Generate a new one from Settings → Members in the app.")
    return
  }

  const { error: updateError } = await supabase
    .from('family_members')
    .update({ telegram_chat_id: chatId })
    .eq('id', linkCode.member_id)

  if (updateError) {
    const alreadyLinked = updateError.code === '23505' // unique_violation on telegram_chat_id
    await sendMessage(
      chatId,
      alreadyLinked
        ? 'This Telegram account is already linked to a different family member. Unlink it in Settings first.'
        : "Something went wrong linking your account. Please try again.",
    )
    return
  }

  await supabase.from('telegram_link_codes').update({ used_at: new Date().toISOString() }).eq('id', linkCode.id)

  const { data: member } = await supabase.from('family_members').select('name').eq('id', linkCode.member_id).single()
  await sendMessage(
    chatId,
    `You're linked, ${member?.name ?? 'there'}! Send messages like:\n\n` +
      '`Expense - 500 - Food - today`\n`Income - 50000 - Salary`\n`Savings - 5000 - Emergency Fund - my goal`\n\n' +
      'Format: *Type - Amount - Category - [Member] - [Date] - [Goal]* — anything after Category is optional and ' +
      'order-independent (I figure out which bit is a date, a member, or a goal). For savings, if a goal shares ' +
      "the category's name I'll link it automatically.",
  )
}

async function handleTransactionText(chatId: number, text: string) {
  const { data: member } = await supabase
    .from('family_members')
    .select('id, family_id, name')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (!member) {
    await sendMessage(chatId, "You haven't linked this Telegram account yet. Generate a code from Settings → Members in the app, then send `/link <code>`.")
    return
  }

  const parts = text.trim().split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean)
  if (parts.length < 3) {
    await sendMessage(chatId, 'Please use the format: *Type - Amount - Category - [Member] - [Date] - [Goal]*\ne.g. `Expense - 500 - Food - today`')
    return
  }

  const type = TYPE_ALIASES[parts[0].toLowerCase()]
  if (!type) {
    await sendMessage(chatId, `I don't recognize "${parts[0]}" as a type. Use Expense, Income, or Savings.`)
    return
  }

  const amount = parseAmount(parts[1])
  if (amount == null || amount <= 0) {
    await sendMessage(chatId, `I couldn't read "${parts[1]}" as an amount. Try something like 500, 20k, or 1.5L.`)
    return
  }

  const categoryToken = parts[2]

  const [{ data: categories }, { data: members }, { data: accounts }, { data: goals }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('family_id', member.family_id).eq('type', type).eq('is_active', true),
    supabase.from('family_members').select('id, name').eq('family_id', member.family_id).eq('is_active', true),
    supabase.from('accounts').select('id, name').eq('family_id', member.family_id).eq('is_active', true).order('created_at', { ascending: true }),
    type === 'savings'
      ? supabase.from('savings_goals').select('id, name').eq('family_id', member.family_id)
      : Promise.resolve({ data: [] as GoalRow[] }),
  ])

  const category = findCategory(categoryToken, categories ?? [])
  if (!category) {
    const names = (categories ?? []).map((c) => c.name).join(', ')
    await sendMessage(chatId, `I couldn't match "${categoryToken}" to a ${type} category. Your categories: ${names || '(none yet)'}`)
    return
  }

  // Everything after Category is optional and order-independent: classify each
  // remaining token as the first slot it fits (date, then member, then goal) so
  // "Emergency Fund - 01 Aug 26 - Archana" and "Archana - 01 Aug 26" both work.
  let taggedMember = member
  let dateToken: string | undefined
  let goalMatch: GoalRow | null = null
  let memberMatched = false
  for (const token of parts.slice(3)) {
    const asDate = !dateToken ? parseDate(token) : null
    const asMember = !memberMatched ? findMember(token, members ?? []) : null
    const asGoal = type === 'savings' && !goalMatch ? findGoal(token, goals ?? []) : null

    if (asDate) {
      dateToken = token
    } else if (asMember) {
      taggedMember = asMember
      memberMatched = true
    } else if (asGoal) {
      goalMatch = asGoal
    }
  }
  // For savings, a goal sharing the matched category's name is linked automatically
  // even with no explicit goal field — most families name the goal and category alike.
  if (type === 'savings' && !goalMatch) {
    goalMatch = findGoal(category.name, goals ?? [])
  }

  const transactionDate = (dateToken && parseDate(dateToken)) || toDateKey(new Date())
  const account = accounts?.[0]

  if (!account) {
    await sendMessage(chatId, 'No account found to record this against — add one in Settings → Accounts first.')
    return
  }

  const { error: insertError } = await supabase.from('transactions').insert({
    family_id: member.family_id,
    member_id: taggedMember.id,
    category_id: category.id,
    account_id: account.id,
    goal_id: type === 'savings' ? (goalMatch?.id ?? null) : null,
    type,
    amount,
    transaction_date: transactionDate,
    notes: `Added via Telegram: "${text.trim()}"`,
  })

  if (insertError) {
    await sendMessage(chatId, "Something went wrong saving that transaction. Please try again or add it in the app.")
    return
  }

  await sendMessage(
    chatId,
    `✅ ${type[0].toUpperCase()}${type.slice(1)} of ${amount} logged under *${category.name}* for ${taggedMember.name} (${account.name}, ${transactionDate})` +
      (goalMatch ? ` → 🎯 ${goalMatch.name}` : '') +
      '.',
  )
}

Deno.serve(async (req) => {
  if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== TELEGRAM_WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 })
  }

  let update: { message?: { chat: { id: number }; text?: string } }
  try {
    update = await req.json()
  } catch {
    return new Response('ok') // not valid JSON — nothing Telegram can retry productively
  }

  const message = update.message
  if (!message?.text) return new Response('ok')

  const chatId = message.chat.id
  const text = message.text.trim()

  try {
    if (text === '/start') {
      await sendMessage(chatId, "Welcome! Generate a link code from Settings → Members in the app, then send `/link <code>` here.")
    } else if (text.startsWith('/start ')) {
      await handleLink(chatId, text.slice('/start '.length))
    } else if (text.startsWith('/link')) {
      await handleLink(chatId, text.slice('/link'.length))
    } else {
      await handleTransactionText(chatId, text)
    }
  } catch (error) {
    console.error('telegram-webhook error', error)
    await sendMessage(chatId, 'Something went wrong processing that. Please try again.')
  }

  return new Response('ok')
})
