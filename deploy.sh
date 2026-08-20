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

nginx -t
systemctl restart nginx

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
