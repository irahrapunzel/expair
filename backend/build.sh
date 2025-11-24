#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status.
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run Django migrations and collect static files
python manage.py collectstatic --no-input
python manage.py migrate

# --- Automated Superuser Creation for Production ---
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
  # Use the variables set on the Render dashboard
  python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
# Only create the superuser if one with that username does not already exist
if not User.objects.filter(username=os.environ.get('DJANGO_SUPERUSER_USERNAME')).exists():
    User.objects.create_superuser(
        os.environ.get('DJANGO_SUPERUSER_USERNAME'), 
        os.environ.get('DJANGO_SUPERUSER_EMAIL'), 
        os.environ.get('DJANGO_SUPERUSER_PASSWORD')
    )
    print('Superuser created successfully on Render.')
else:
    print('Superuser already exists on Render database.')
EOF
fi