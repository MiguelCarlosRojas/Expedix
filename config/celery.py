import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module for 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('dbPayOut')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat schedule for periodic document sync / automation
app.conf.beat_schedule = {
    'sync-pending-expedientes-every-5-minutes': {
        'task': 'apps.integrations.tasks.process_pending_expedientes_task',
        'schedule': crontab(minute='*/5'),
    },
    'sync-drive-cache-every-hour': {
        'task': 'apps.integrations.tasks.sync_drive_cache_task',
        'schedule': crontab(minute='0', hour='*'),
    },
}
