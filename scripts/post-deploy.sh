#!/usr/bin/env bash
set -e
URL="${1:-}"
if [ -z "$URL" ]; then
  echo "Usage: $0 <deploy-url>"
  exit 1
fi
HEALTH="${URL%/}/api/health"
echo "Verifying deploy at $HEALTH..."
curl -sf "$HEALTH" || { echo "Health check failed"; exit 1; }
echo "Post-deploy verification passed."
