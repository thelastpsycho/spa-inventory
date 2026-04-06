FROM php:8.4-fpm-alpine

WORKDIR /var/www/html

# System deps + PHP extensions commonly needed by Laravel
RUN apk add --no-cache \
    nginx \
    bash \
    curl \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    postgresql-dev \
    sqlite-dev \
    git \
    unzip \
  && docker-php-ext-install -j"$(nproc)" \
    bcmath \
    intl \
    mbstring \
    opcache \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    pdo_sqlite \
    zip \
  && rm -rf /var/cache/apk/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# App files
COPY . /var/www/html

# Install dependencies (no dev) at build time
# (Laravel needs bootstrap/cache present during composer scripts)
RUN mkdir -p storage bootstrap/cache \
  && chown -R www-data:www-data /var/www/html \
  && chmod -R ug+rwX storage bootstrap/cache \
  && composer install --no-dev --no-interaction --no-progress --prefer-dist --optimize-autoloader

# Nginx + startup
COPY docker/nginx.conf.template /etc/nginx/http.d/default.conf.template
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 10000

CMD ["/start.sh"]
