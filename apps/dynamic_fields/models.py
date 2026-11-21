from django.db import models

class DynamicField(models.Model):
    FIELD_TYPE_CHOICES = [
        ('text', 'Texto corto'),
        ('textarea', 'Texto largo'),
        ('integer', 'Número entero'),
        ('decimal', 'Número decimal'),
        ('date', 'Fecha'),
        ('datetime', 'Fecha y hora'),
        ('email', 'Correo'),
        ('phone', 'Teléfono'),
        ('currency', 'Moneda'),
        ('select', 'Select'),
        ('multiselect', 'Selección múltiple'),
        ('radio', 'Radio'),
        ('checkbox', 'Checkbox'),
        ('boolean', 'Booleano'),
        ('file', 'Archivo adjunto'),
    ]

    WIDTH_CHOICES = [
        ('col-12', '100% (Ancho Completo)'),
        ('col-6', '50% (Media Columna)'),
        ('col-4', '33% (Un Tercio)'),
        ('col-3', '25% (Un Cuarto)'),
    ]

    template = models.ForeignKey(
        'templates_manager.DocumentTemplate',
        on_delete=models.CASCADE,
        related_name='fields',
        verbose_name="Plantilla Asociada"
    )
    name = models.CharField(max_length=120, verbose_name="Nombre / Etiqueta del Campo")
    identifier = models.SlugField(max_length=120, verbose_name="Identificador Único")
    field_type = models.CharField(max_length=30, choices=FIELD_TYPE_CHOICES, default='text', verbose_name="Tipo de Campo")
    description = models.CharField(max_length=255, blank=True, default="", verbose_name="Descripción o Ayuda")
    placeholder = models.CharField(max_length=150, blank=True, default="", verbose_name="Placeholder")
    default_value = models.CharField(max_length=255, blank=True, default="", verbose_name="Valor Predeterminado")
    
    is_required = models.BooleanField(default=False, verbose_name="Obligatorio")
    min_length = models.PositiveIntegerField(null=True, blank=True, verbose_name="Longitud Mínima")
    max_length = models.PositiveIntegerField(null=True, blank=True, verbose_name="Longitud Máxima")
    min_value = models.FloatField(null=True, blank=True, verbose_name="Valor Mínimo")
    max_value = models.FloatField(null=True, blank=True, verbose_name="Valor Máximo")
    
    # List of options for select, multiselect, radio: [{'label': 'Opción 1', 'value': 'opt1'}]
    options = models.JSONField(default=list, blank=True, verbose_name="Opciones")
    
    order = models.PositiveIntegerField(default=0, verbose_name="Orden")
    section = models.CharField(max_length=100, default="Datos Generales", verbose_name="Sección / Grupo")
    width = models.CharField(max_length=20, choices=WIDTH_CHOICES, default='col-12', verbose_name="Ancho en Formulario")
    
    # Conditional visibility rules: {'field': 'otro_campo', 'operator': '==', 'value': 'SI'}
    visibility_conditions = models.JSONField(default=dict, blank=True, verbose_name="Condiciones de Visibilidad")
    
    # Google Workspace Mappings
    sheets_column = models.CharField(max_length=50, blank=True, default="", verbose_name="Columna Google Sheets")
    docs_tag = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Etiqueta Google Docs",
        help_text="Ejemplo: {{NOMBRE_COMPLETO}}"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Campo Dinámico"
        verbose_name_plural = "Campos Dinámicos"
        ordering = ['order', 'id']
        unique_together = ('template', 'identifier')

    def save(self, *args, **kwargs):
        # Auto-generate uppercase docs_tag if not provided
        if not self.docs_tag:
            clean_ident = self.identifier.upper().replace('-', '_')
            self.docs_tag = f"{{{{{clean_ident}}}}}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.docs_tag}) - {self.template.nombre}"
