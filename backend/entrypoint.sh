#!/bin/bash
set -e

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
alembic upgrade head

echo "🚀 Starting application..."
exec "$@"
