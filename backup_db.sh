#!/usr/bin/env bash
# YBAM_WBC 每日数据库备份：pg_dump 自定义格式（压缩、可用 pg_restore 恢复），
# 保留最近 7 天。备份目录在仓库外（部署重置不影响），B2 每日 04:00 会把
# /root/db-backups 一起同步上云。cron 示例（每天 03:00）：
#   0 3 * * * /root/YBAM_WBC/backup_db.sh >> /root/db-backups/backup-wbc.log 2>&1
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# .env 里是 SQLAlchemy 方言前缀（postgresql+psycopg2://），pg_dump 要纯前缀。
RAW=$(sed -n 's/^DATABASE_URL=//p' "$script_dir/.env" | tail -n 1 | tr -d '"')
DATABASE_URL=${RAW/postgresql+psycopg2:\/\//postgresql:\/\/}
if [[ -z "$DATABASE_URL" ]]; then
  echo "[backup-wbc] missing DATABASE_URL in .env" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-/root/db-backups}"
mkdir -p "$BACKUP_DIR"

outfile="$BACKUP_DIR/ybam-wbc-$(date +%Y%m%d-%H%M%S).dump"
echo "[backup-wbc] $(date '+%F %T') dumping to $outfile"
pg_dump --format=custom --no-owner --file="$outfile" "$DATABASE_URL"

# 空文件视为失败：删掉残骸并报错，别让坏备份顶掉好备份的保留窗口。
if [[ ! -s "$outfile" ]]; then
  rm -f "$outfile"
  echo "[backup-wbc] dump produced an empty file, aborting" >&2
  exit 1
fi

echo "[backup-wbc] done ($(du -h "$outfile" | cut -f1))"

# 保留 7 天：只清本脚本命名规则的文件。
find "$BACKUP_DIR" -maxdepth 1 -name 'ybam-wbc-*.dump' -mtime +6 -delete
echo "[backup-wbc] retained $(find "$BACKUP_DIR" -maxdepth 1 -name 'ybam-wbc-*.dump' | wc -l) backup(s)"
