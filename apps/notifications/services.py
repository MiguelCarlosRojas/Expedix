from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification

def create_system_notification(user, title, message, notification_type='GENERADO', metadata=None):
    """
    Creates a Notification record in PostgreSQL and broadcasts it live via Channels WebSocket.
    """
    if metadata is None:
        metadata = {}

    notif = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        metadata=metadata
    )

    payload = {
        'id': notif.id,
        'title': notif.title,
        'message': notif.message,
        'notification_type': notif.notification_type,
        'is_read': notif.is_read,
        'created_at': notif.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        'metadata': notif.metadata
    }

    try:
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"user_{user.id}",
                {
                    'type': 'notification_message',
                    'notification': payload
                }
            )
    except Exception as e:
        # Avoid crashing if Redis or layer is momentarily unavailable
        pass

    return notif
