#!/usr/bin/env bash
# First-time local setup: create .env if missing, start the Docker stack,
# install Angular dependencies. Safe to re-run.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example - review it before continuing."
fi

docker compose up -d
echo "Waiting for services to become healthy..."
docker compose ps

(cd apps/clinic-admin && npm install)

cat <<'EOF'

Setup complete.
  cd apps/clinic-admin && npm start   # http://localhost:4200
EOF
