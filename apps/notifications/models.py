from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = [
        ('GENERADO', 'Documento Generado'),
        ('ERROR', 'Error de Procesamiento'),
        ('PENDIENTE', 'Expediente Pendiente'),
        ('OBSERVADO', 'Documento Observado'),
        ('REINTENTO', 'Reintento Automático'),
        ('CONEXION', 'Problema de Conexión'),
        ('ADMIN', 'Cambio Administrativo'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="Usuario Destino"
    )
    title = models.CharField(max_length=200, verbose_name="Título")
    message = models.TextField(verbose_name="Mensaje / Detalle")
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='GENERADO')
    is_read = models.BooleanField(default=False, verbose_name="Leída")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Metadatos Adicionales")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Notificación")

    class Meta:
        verbose_name = "Notificación"
        verbose_name_plural = "Notificaciones"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title} ({'Leída' if self.is_read else 'Nueva'})"

class PushSubscription(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='push_subscriptions'
    )
    endpoint = models.URLField(max_length=500, unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Suscripción Push Web"
        verbose_name_plural = "Suscripciones Push Web"
