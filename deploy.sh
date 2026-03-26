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
systemctl reload nginx

echo "=== DEPLOY OK ==="
