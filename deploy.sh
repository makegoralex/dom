#!/bin/bash
set -euo pipefail

echo "=== DEPLOY START ==="
cd /var/www/dom

git fetch origin main
git reset --hard origin/main

if [ -f /var/www/dom/package.json ]; then
  npm install
fi

if [ -f /var/www/dom/backend/package.json ]; then
  cd /var/www/dom/backend
  npm install
  npm run build
  test -f /var/www/dom/backend/dist/index.js
fi

if [ -f /var/www/dom/frontend/package.json ]; then
  cd /var/www/dom/frontend
  npm install
  npm run build
  test -f /var/www/dom/frontend/dist/index.html
fi

cd /var/www/dom
pm2 startOrRestart ecosystem.config.js

echo "Waiting for backend health check"
backend_ready=0
for attempt in 1 2 3 4 5 6; do
  if curl --fail --silent --show-error --max-time 5 http://127.0.0.1:3000/api/projects >/dev/null; then
    backend_ready=1
    break
  fi
  sleep 2
done

if [ "$backend_ready" -ne 1 ]; then
  echo "Backend health check failed"
  pm2 logs dom-backend --lines 80 --nostream || true
  exit 1
fi

# Backup copies inside sites-enabled are parsed as live virtual hosts. Archive
# the known stale people.evtenia.ru copies before validating nginx. Keeping
# them outside /etc/nginx preserves rollback data without duplicate servers.
nginx_backup_configs=(/etc/nginx/sites-enabled/people.bak-*)
if [ -e "${nginx_backup_configs[0]}" ]; then
  nginx_archive_dir="/etc/nginx/disabled-sites/people-$(date -u +%Y%m%dT%H%M%SZ)"
  install -d -m 700 "$nginx_archive_dir"
  mv -- "${nginx_backup_configs[@]}" "$nginx_archive_dir/"
  echo "Archived ${#nginx_backup_configs[@]} stale nginx backup configuration(s)"
fi

nginx_test_output="$(nginx -t 2>&1)"
printf '%s\n' "$nginx_test_output"
if grep -q 'conflicting server name' <<<"$nginx_test_output"; then
  echo "Conflicting nginx virtual hosts remain; refusing to reload" >&2
  exit 1
fi

# Reload workers gracefully so active HTTPS connections are not interrupted
# during an ordinary application deploy.
systemctl reload nginx

echo "Waiting for HTTPS health check"
https_ready=0
for attempt in 1 2 3 4 5 6; do
  if curl --fail --silent --show-error --insecure --max-time 5 --resolve dom.evtenia.ru:443:127.0.0.1 https://dom.evtenia.ru/ >/dev/null; then
    https_ready=1
    break
  fi
  sleep 2
done

if [ "$https_ready" -ne 1 ]; then
  echo "HTTPS health check failed"
  systemctl --no-pager --full status nginx || true
  journalctl -u nginx --since "10 minutes ago" --no-pager || true
  exit 1
fi

echo "=== DEPLOY OK ==="
