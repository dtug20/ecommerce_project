#!/bin/bash
# MongoDB Backup Script for Shofy
# Run daily via cron: 0 2 * * * /path/to/scripts/backup.sh
#
# Usage:
#   ./scripts/backup.sh                    # Uses default MONGO_URI
#   MONGO_URI=mongodb://... ./scripts/backup.sh  # Custom URI

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/shofy}"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
DB_NAME="${DB_NAME:-shofy}"
MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017}"
RETAIN_DAYS="${RETAIN_DAYS:-30}"

echo "[backup] Starting MongoDB backup: $DB_NAME"
mkdir -p "$BACKUP_DIR"

# Create backup
mongodump --uri="$MONGO_URI/$DB_NAME" --out="$BACKUP_DIR/$DATE"

# Compress
cd "$BACKUP_DIR" && tar -czf "$DATE.tar.gz" "$DATE" && rm -rf "$DATE"

# Retain last N daily backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +"$RETAIN_DAYS" -delete

echo "[backup] Complete: $BACKUP_DIR/$DATE.tar.gz"
echo "[backup] Retained backups (last $RETAIN_DAYS days):"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null | tail -5
