#!/usr/bin/env sh
set -eu

export PORT="${PORT:-10000}"

# Configure nginx with the correct port using sed
sed "s/\${PORT}/${PORT}/g" /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

# Verify nginx config was created
echo "Nginx configuration created:"
cat /etc/nginx/http.d/default.conf

# Don't copy .env.example - Railway injects environment variables directly
# If .env doesn't exist, create one with just the APP_KEY from env
if [ ! -f ".env" ]; then
  if [ -n "${APP_KEY:-}" ]; then
    echo "APP_KEY=${APP_KEY}" > .env
  fi
fi

php artisan config:clear >/dev/null 2>&1 || true
php artisan route:clear >/dev/null 2>&1 || true
php artisan view:clear >/dev/null 2>&1 || true

php artisan storage:link >/dev/null 2>&1 || true

# Optional: run migrations on deploy (Railway-friendly when no shell is available)
if [ "${RUN_MIGRATIONS:-false}" = "true" ] || [ "${RUN_MIGRATIONS:-false}" = "1" ]; then
  php artisan migrate --force
fi

# Optional: run seeders on deploy
# - set RUN_SEEDERS=true to run the default DatabaseSeeder
# - set SEEDER_CLASS=YourSeederClass to run a specific seeder
if [ "${RUN_SEEDERS:-false}" = "true" ] || [ "${RUN_SEEDERS:-false}" = "1" ]; then
  if [ -n "${SEEDER_CLASS:-}" ]; then
    php artisan db:seed --force --class="${SEEDER_CLASS}"
  else
    php artisan db:seed --force
  fi
fi

# Start PHP-FPM and nginx
php-fpm -D

# Wait for PHP-FPM to be ready
echo "Waiting for PHP-FPM to start..."
for i in $(seq 1 10); do
  if nc -z 127.0.0.1 9000 2>/dev/null; then
    echo "PHP-FPM is ready!"
    break
  fi
  echo "Waiting... ($i/10)"
  sleep 1
done

echo "Starting nginx..."
# Test nginx configuration
nginx -t
if [ $? -ne 0 ]; then
  echo "ERROR: nginx configuration failed"
  cat /etc/nginx/http.d/default.conf
  exit 1
fi
nginx -g 'daemon off;'
