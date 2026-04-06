#!/usr/bin/env sh
set -eu

export PORT="${PORT:-10000}"

envsubst '${PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
fi

php artisan config:clear >/dev/null 2>&1 || true
php artisan route:clear >/dev/null 2>&1 || true
php artisan view:clear >/dev/null 2>&1 || true

php artisan storage:link >/dev/null 2>&1 || true

php-fpm -D
nginx -g 'daemon off;'

