#!/usr/bin/env bash
# Registers this Edge Function as the Telegram bot's webhook.
# Run once after `supabase functions deploy telegram-webhook` and
# `supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=...`
#
# Usage: TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... SUPABASE_PROJECT_REF=... ./register-webhook.sh
set -euo pipefail

: "${TELEGRAM_BOT_TOKEN:?set TELEGRAM_BOT_TOKEN}"
: "${TELEGRAM_WEBHOOK_SECRET:?set TELEGRAM_WEBHOOK_SECRET}"
: "${SUPABASE_PROJECT_REF:?set SUPABASE_PROJECT_REF}"

WEBHOOK_URL="https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/telegram-webhook"

curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H 'Content-Type: application/json' \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"secret_token\": \"${TELEGRAM_WEBHOOK_SECRET}\"}"
echo
