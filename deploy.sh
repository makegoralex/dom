#!/bin/bash
set -e

cd /var/www/dom
git pull origin main

if [ -f package.json ]; then
  npm install
fi

if [ -f ecosystem.config.js ]; then
  pm2 startOrRestart ecosystem.config.js
fi

if [ -f backend/package.json ]; then
  cd /var/www/dom/backend
  npm install
fi

if [ -f frontend/package.json ]; then
  cd /var/www/dom/frontend
  npm install
  npm run build
fi
