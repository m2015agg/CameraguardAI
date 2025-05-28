#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# setup.sh — 1-time “git clone” bootstrap for CameraGuardAI
# Usage: bash setup.sh
# Prereqs: supabase CLI, docker & docker-compose, yq, openssl
# ──────────────────────────────────────────────────────────────
set -euo pipefail

# 1) copy template → .env (skip if user already has one)
if [[ -f .env ]]; then
  echo "⚠  .env already exists, skipping template copy."
else
  cp .env.template .env
  echo "✓  .env created from .env.template"
fi

# 2) start Supabase’s local stack (will generate supabase/kong/kong.yml)
echo "⏳  Starting Supabase local stack…"
supabase init 2>/dev/null || true
supabase start --no-telemetry &

# wait for Kong file to appear (timeout after 30s)
KONG_FILE="supabase/kong/kong.yml"
for i in {1..30}; do
  if [[ -f "$KONG_FILE" ]]; then break; fi
  sleep 1
done
if [[ ! -f "$KONG_FILE" ]]; then
  echo "❌  supabase/kong/kong.yml not found—did Supabase start correctly?" >&2
  exit 1
fi

# 3) pull anon & service keys + generate JWT, write into .env
echo "⏳  Populating Supabase keys into .env…"
./scripts/generate-env.sh

# 4) bring up the full stack
echo "⏳  Bringing up MQTT + CameraGuardAI…"
docker compose pull
docker compose up -d

echo "🎉  Setup complete!"
echo "  • Supabase Studio → http://localhost:3000"
echo "  • Mosquitto MQTT → 1883 (TCP) & 8080 (WebSocket)"
echo "  • CameraGuardAI app → whatever port you exposed"
