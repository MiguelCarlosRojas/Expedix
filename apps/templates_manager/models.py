from django.db import models
from django.conf import settings

class DocumentTemplate(models.Model):
    TYPE_CHOICES = [
        ('ACTA', 'Acta de Conformidad'),
        ('SOLICITUD', 'Solicitud de Pago'),
        ('INFORME', 'Informe Técnico'),
        ('CONSTANCIA', 'Constancia de Prestación'),
        ('CONTRATO', 'Contrato o Convenio'),
        ('OTRO', 'Otro Documento'),
    ]

    nombre = models.CharField(max_length=150, verbose_name="Nombre de la Plantilla")
    descripcion = models.TextField(blank=True, default="", verbose_name="Descripción")
    tipo = models.CharField(max_length=30, choices=TYPE_CHOICES, default='ACTA', verbose_name="Tipo")
    google_doc_id = models.CharField(max_length=150, blank=True, default="", verbose_name="ID Google Docs")
    drive_id = models.CharField(max_length=150, blank=True, default="primary", verbose_name="Drive ID")
    target_folder_id = models.CharField(max_length=150, blank=True, default="", verbose_name="Carpeta Destino Drive")
    target_folder_name = models.CharField(max_length=150, blank=True, default="Expedientes Emitidos", verbose_name="Nombre Carpeta Destino")
    naming_pattern = models.CharField(
        max_length=200,
        default="{{NUMERO_EXPEDIENTE}}_{{SOLICITANTE}}",
        verbose_name="Nomenclatura del Archivo"
    )
    is_active = models.BooleanField(default=True, verbose_name="Activa")
    version = models.PositiveIntegerField(default=1, verbose_name="Versión Actual")
    
    # Snapshot of template content/HTML for local preview/rendering
    content_preview = models.TextField(blank=True, default="", verbose_name="Previsualización de Contenido")

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Plantilla Documental"
        verbose_name_plural = "Plantillas Documentales"
        ordering = ['-id']

    def __str__(self):
        return f"{self.nombre} (v{self.version})"

class TemplateVersion(models.Model):
    template = models.ForeignKey(DocumentTemplate, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    google_doc_id = models.CharField(max_length=150, blank=True, default="")
    naming_pattern = models.CharField(max_length=200, default="")
    changelog = models.TextField(blank=True, default="Actualización de versión")
    content_snapshot = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Versión de Plantilla"
        verbose_name_plural = "Versiones de Plantillas"
        ordering = ['-version_number']
        unique_together = ('template', 'version_number')

    def __str__(self):
        return f"{self.template.nombre} - v{self.version_number}"
