#!/usr/bin/env bash
# Registers the bot's slash-command menu (shown when a user types "/" in the chat).
# Run once after deploying, and again whenever the command list changes.
#
# Usage: TELEGRAM_BOT_TOKEN=... ./register-commands.sh
set -euo pipefail

: "${TELEGRAM_BOT_TOKEN:?set TELEGRAM_BOT_TOKEN}"

curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands" \
  -H 'Content-Type: application/json' \
  -d '{
    "commands": [
      {"command": "expense", "description": "Log an expense: /expense 500 - Food"},
      {"command": "income", "description": "Log income: /income 50000 - Salary"},
      {"command": "savings", "description": "Log savings: /savings 5000 - Emergency Fund"},
      {"command": "summary", "description": "Total savings, by category, and goal progress"},
      {"command": "link", "description": "Link this chat to your family member profile"},
      {"command": "help", "description": "Show commands and format examples"}
    ]
  }'
echo
