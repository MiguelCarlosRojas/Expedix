from django.db import models
from apps.drives.models import DriveFile

class SpreadsheetSync(models.Model):
    file = models.OneToOneField(
        DriveFile,
        on_delete=models.CASCADE,
        related_name='spreadsheet_meta',
        verbose_name="Archivo de Hoja de Cálculo"
    )
    google_spreadsheet_id = models.CharField(max_length=150, blank=True, default="", verbose_name="ID Google Sheets")
    univer_snapshot = models.JSONField(default=dict, blank=True, verbose_name="Snapshot Univer SDK")
    version = models.PositiveIntegerField(default=1, verbose_name="Versión de Edición")
    last_synced_at = models.DateTimeField(auto_now=True, verbose_name="Última Sincronización")

    class Meta:
        verbose_name = "Sincronización de Hoja de Cálculo"
        verbose_name_plural = "Sincronizaciones de Hojas de Cálculo"

    def __str__(self):
        return f"Spreadsheet: {self.file.name} (v{self.version})"
