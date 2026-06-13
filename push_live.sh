#!/usr/bin/env bash
set -euo pipefail

REMOTE_HOST="${REMOTE_HOST:-root@wbc.ybam.org.my}"
REMOTE_DIR="${REMOTE_DIR:-/root/YBAM_WBC}"
SERVICE_NAME="${SERVICE_NAME:-ybam-wbc.service}"
APP_BASE="${APP_BASE:-/YBAM_WBC/}"
HEALTH_URL="${HEALTH_URL:-https://wbc.ybam.org.my/YBAM_WBC/payment_gateway/ping}"
SKIP_BUILD=0

usage() {
    cat <<USAGE
Usage: ./push_live.sh [options]

Options:
  --skip-build     Skip the Vite build step.
  -h, --help       Show this help.

Environment overrides:
  REMOTE_HOST      Default: root@wbc.ybam.org.my
  REMOTE_DIR       Default: /root/YBAM_WBC
  SERVICE_NAME     Default: ybam-wbc.service
  APP_BASE         Default: /YBAM_WBC/
  HEALTH_URL       Default: https://wbc.ybam.org.my/YBAM_WBC/payment_gateway/ping
USAGE
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-build)
            SKIP_BUILD=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
done

echo "Deploy target: ${REMOTE_HOST}:${REMOTE_DIR}"

if [[ "$SKIP_BUILD" -eq 0 ]]; then
    echo "Building frontend with base ${APP_BASE}"
    (
        cd frontend
        VITE_BASE="$APP_BASE" npm run build
    )
fi

echo "Syncing code"
rsync -az --delete \
    --exclude='.git/' \
    --include='.env.example' \
    --exclude='.env' \
    --exclude='.env.*' \
    --exclude='venv/' \
    --exclude='.venv/' \
    --exclude='frontend/node_modules/' \
    --exclude='doc/' \
    --exclude='docs/' \
    --exclude='WBC2025.sql' \
    --exclude='uploads/' \
    --exclude='instance/' \
    --exclude='*.db' \
    --exclude='__pycache__/' \
    --exclude='*.pyc' \
    --exclude='.pytest_cache/' \
    --exclude='.mypy_cache/' \
    --exclude='.ruff_cache/' \
    --exclude='.vscode/' \
    ./ "${REMOTE_HOST}:${REMOTE_DIR}/"

echo "Running remote install, migrations, and restart"
ssh -o BatchMode=yes "$REMOTE_HOST" 'bash -s' <<REMOTE
set -euo pipefail
REMOTE_DIR="$REMOTE_DIR"
SERVICE_NAME="$SERVICE_NAME"

cd "\$REMOTE_DIR"

if [[ ! -f .env ]]; then
    echo "Missing remote .env at \$REMOTE_DIR/.env" >&2
    exit 1
fi

rm -rf \
    doc \
    docs \
    WBC2025.sql \
    ybam.db \
    instance \
    frontend/node_modules

if [[ ! -x venv/bin/python ]]; then
    python3 -m venv venv
fi

venv/bin/pip install -r requirements.txt

set -a
. ./.env
set +a

venv/bin/python - <<'PY'
from function import create_app
from models import db
from models.schema_migration import ensure_version_columns

app = create_app()
with app.app_context():
    db.create_all()
    ensure_version_columns()
print("schema migration ok")
PY

systemctl restart "\$SERVICE_NAME"
sleep 2
systemctl is-active --quiet "\$SERVICE_NAME"
systemctl --no-pager --full status "\$SERVICE_NAME" | sed -n '1,16p'
REMOTE

echo "Checking health endpoint"
curl -fsS --max-time 15 "$HEALTH_URL"
echo
echo "Deploy complete"
