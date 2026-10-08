"""
Local development settings for Apex Logistics Enterprise.
"""
from .base import *  # noqa: F403

DEBUG = True

ALLOWED_HOSTS = ['*']

# Debug toolbar disabled for REST API stability

# Email backend for local testing
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Celery local eager execution (runs in-memory without requiring external Redis)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

