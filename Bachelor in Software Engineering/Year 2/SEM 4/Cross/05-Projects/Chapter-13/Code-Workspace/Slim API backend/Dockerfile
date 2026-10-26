# ============================================================================
#  Production image for the Books API (PHP 8.2 + Apache).
#  Used by Render / Railway / Fly / any Docker host.
# ============================================================================
FROM php:8.2-apache

# PDO MySQL driver + Apache URL rewriting.
RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite

# Serve from /public (Slim front controller lives there).
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Composer (from the official composer image).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install PHP dependencies first (better layer caching).
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --optimize-autoloader --no-scripts || true

# Application source.
COPY . .
RUN composer install --no-dev --no-interaction --optimize-autoloader

# Render/Railway provide $PORT; make Apache listen on it (defaults to 80 locally).
RUN sed -ri 's!Listen 80!Listen ${PORT:-80}!' /etc/apache2/ports.conf \
    && sed -ri 's!:80>!:${PORT:-80}>!' /etc/apache2/sites-available/000-default.conf

EXPOSE 80
CMD ["apache2-foreground"]
