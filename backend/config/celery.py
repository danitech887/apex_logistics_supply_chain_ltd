import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

app = Celery('apex_enterprise')

# Read configuration from Django settings, the CELERY namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Automatically discover tasks from all installed apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
