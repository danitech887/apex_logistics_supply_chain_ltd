"""
Apex Logistics Enterprise Django Config
"""
from .celery import app as celery_app

__all__ = ('celery_app',)
