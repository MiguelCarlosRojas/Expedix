import uuid
from django.db import models
from django.conf import settings

class DriveFolder(models.Model):
    google_folder_id = models.CharField(max_length=150, unique=True, default=uuid.uuid4, verbose_name="ID Google Drive")
    name = models.CharField(max_length=200, verbose_name="Nombre de Carpeta")
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name="Carpeta Padre"
    )
    is_trashed = models.BooleanField(default=False, verbose_name="En Papelera")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_folders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Carpeta de Drive"
        verbose_name_plural = "Carpetas de Drive"
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_breadcrumbs(self):
        crumbs = []
        curr = self
        while curr:
            crumbs.insert(0, {'id': curr.id, 'google_folder_id': curr.google_folder_id, 'name': curr.name})
            curr = curr.parent
        return crumbs

class DriveFile(models.Model):
    MIME_DOC = 'application/vnd.google-apps.document'
    MIME_SHEET = 'application/vnd.google-apps.spreadsheet'
    MIME_FOLDER = 'application/vnd.google-apps.folder'
    MIME_PDF = 'application/pdf'

    google_file_id = models.CharField(max_length=150, unique=True, default=uuid.uuid4, verbose_name="ID Google Drive")
    name = models.CharField(max_length=255, verbose_name="Nombre de Archivo")
    mime_type = models.CharField(max_length=120, default=MIME_DOC, verbose_name="MIME Type")
    size_bytes = models.BigIntegerField(default=0, verbose_name="Tamaño (bytes)")
    
    folder = models.ForeignKey(
        DriveFolder,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='files',
        verbose_name="Carpeta Contenedora"
    )

    owner_name = models.CharField(max_length=120, default="Administrador", verbose_name="Propietario")
    owner_email = models.EmailField(blank=True, default="", verbose_name="Correo Propietario")
    
    web_view_link = models.CharField(max_length=500, blank=True, default="", verbose_name="Enlace de Visualización")
    web_content_link = models.CharField(max_length=500, blank=True, default="", verbose_name="Enlace de Contenido")
    
    # Stores binary content locally when uploaded
    local_file = models.FileField(upload_to='drive_storage/', null=True, blank=True, verbose_name="Archivo Local")
    
    # Document or Sheet text/JSON snapshot for embedded editor
    content_data = models.JSONField(default=dict, blank=True, verbose_name="Datos / Snapshot del Editor")
    raw_html = models.TextField(blank=True, default="", verbose_name="Contenido HTML / Texto")

    is_trashed = models.BooleanField(default=False, verbose_name="En Papelera")
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_drive_files'
    )
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_drive_files'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Archivo de Drive"
        verbose_name_plural = "Archivos de Drive"
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.mime_type})"

    @property
    def human_size(self):
        bytes_val = self.size_bytes
        if bytes_val < 1024:
            return f"{bytes_val} B"
        elif bytes_val < 1024 * 1024:
            return f"{bytes_val / 1024:.1f} KB"
        elif bytes_val < 1024 * 1024 * 1024:
            return f"{bytes_val / (1024 * 1024):.1f} MB"
        return f"{bytes_val / (1024 * 1024 * 1024):.1f} GB"
