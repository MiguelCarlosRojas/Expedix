from django.db import models
from django.conf import settings

class Expediente(models.Model):
    STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROCESO', 'En Proceso'),
        ('GENERADO', 'Generado'),
        ('ERROR', 'Error'),
        ('OBSERVADO', 'Observado'),
    ]

    numero_expediente = models.CharField(max_length=60, unique=True, verbose_name="Número de Expediente")
    asunto = models.CharField(max_length=255, verbose_name="Asunto / Título")
    solicitante = models.CharField(max_length=150, verbose_name="Solicitante / Beneficiario")
    
    template = models.ForeignKey(
        'templates_manager.DocumentTemplate',
        on_delete=models.PROTECT,
        related_name='expedientes',
        verbose_name="Plantilla Utilizada"
    )

    estado = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default='PENDIENTE',
        verbose_name="Estado Actual"
    )

    # Dynamic Field Values stored as JSONB
    dynamic_values = models.JSONField(default=dict, blank=True, verbose_name="Valores de Campos Dinámicos")

    # Storage and Google Workspace references
    drive_id = models.CharField(max_length=120, default="primary", verbose_name="ID de Drive")
    drive_folder_id = models.CharField(max_length=150, blank=True, default="", verbose_name="Carpeta en Drive")
    drive_folder_name = models.CharField(max_length=150, blank=True, default="Expedientes Emitidos", verbose_name="Nombre Carpeta Drive")
    
    google_doc_id = models.CharField(max_length=150, blank=True, default="", verbose_name="ID Copia Google Docs")
    google_doc_url = models.CharField(max_length=500, blank=True, default="", verbose_name="Enlace Google Docs")
    
    pdf_drive_file_id = models.CharField(max_length=150, blank=True, default="", verbose_name="ID PDF en Drive")
    pdf_url = models.CharField(max_length=500, blank=True, default="", verbose_name="Enlace de Descarga PDF")
    pdf_local_file = models.FileField(upload_to='generated_pdfs/', null=True, blank=True, verbose_name="Archivo PDF Local")

    # Execution tracking & Error logs
    error_message = models.TextField(blank=True, default="", verbose_name="Detalle de Error")
    retry_count = models.PositiveIntegerField(default=0, verbose_name="Cantidad de Reintentos")
    processing_time_seconds = models.FloatField(null=True, blank=True, verbose_name="Tiempo de Procesamiento (s)")

    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expedientes_responsable',
        verbose_name="Usuario Responsable"
    )

    fecha_generacion = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Generación")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Expediente Electrónico"
        verbose_name_plural = "Expedientes Electrónicos"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.numero_expediente} - {self.asunto} ({self.get_estado_display()})"

class DocumentStatusHistory(models.Model):
    expediente = models.ForeignKey(Expediente, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    comment = models.TextField(blank=True, default="")
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Historial de Estado"
        verbose_name_plural = "Historial de Estados"
        ordering = ['-created_at']
