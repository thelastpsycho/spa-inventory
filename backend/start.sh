#!/bin/bash
# Railway startup script for Laravel

# Set default port if not provided
PORT=${PORT:-8000}

# Start PHP built-in server
php -S 0.0.0.0:${PORT} -t public
