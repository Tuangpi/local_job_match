#!/usr/bin/env bash
set -euo pipefail

# Simple backup helper for the Local Job Match MVP.
# Usage: DATABASE_URL=... UPLOAD_DIR=... ./scripts/backup.sh

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" --format=custom --file "$BACKUP_DIR/db-$TIMESTAMP.dump"
fi

if [ -d "${UPLOAD_DIR:-./apps/api/storage/uploads}" ]; then
  tar -czf "$BACKUP_DIR/uploads-$TIMESTAMP.tar.gz" -C "$(dirname "${UPLOAD_DIR:-./apps/api/storage/uploads}")" "$(basename "${UPLOAD_DIR:-./apps/api/storage/uploads}")"
fi

echo "Backup completed in $BACKUP_DIR"
