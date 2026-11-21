from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name="Usuario"
    )
    action = models.CharField(max_length=60, verbose_name="Acción Realizada")
    module = models.CharField(max_length=60, verbose_name="Módulo Afectado")
    record_id = models.CharField(max_length=100, blank=True, default="", verbose_name="ID Registro")
    description = models.CharField(max_length=255, blank=True, default="", verbose_name="Descripción")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="Dirección IP")
    user_agent = models.CharField(max_length=255, blank=True, default="", verbose_name="User Agent")
    payload = models.JSONField(default=dict, blank=True, verbose_name="Datos Modificados")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="Fecha y Hora")

    class Meta:
        verbose_name = "Registro de Auditoría"
        verbose_name_plural = "Registros de Auditoría"
        ordering = ['-timestamp']

    def __str__(self):
        user_name = self.user.username if self.user else "Anónimo"
        return f"[{self.timestamp:%Y-%m-%d %H:%M:%S}] {user_name} - {self.action} ({self.module})"
