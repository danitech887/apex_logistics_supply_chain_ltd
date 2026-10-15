#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Upgrading pip and installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Running database migrations on Neon PostgreSQL..."
python manage.py migrate --noinput

echo "==> Collecting static assets for WhiteNoise..."
python manage.py collectstatic --noinput

echo "==> Seeding initial enterprise data..."
python manage.py seed_enterprise_data

echo "==> Backend build completed successfully!"
