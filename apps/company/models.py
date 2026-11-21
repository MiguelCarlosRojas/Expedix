from django.db import models

class Company(models.Model):
    razon_social = models.CharField(max_length=200, verbose_name="Razón Social")
    nombre_comercial = models.CharField(max_length=200, blank=True, default="", verbose_name="Nombre Comercial")
    ruc = models.CharField(max_length=20, verbose_name="RUC / Identificación Fiscal")
    direccion = models.CharField(max_length=255, blank=True, default="", verbose_name="Dirección")
    telefono = models.CharField(max_length=50, blank=True, default="", verbose_name="Teléfono")
    correo = models.EmailField(verbose_name="Correo Electrónico")
    pagina_web = models.URLField(blank=True, default="", verbose_name="Página Web")
    logo = models.ImageField(upload_to='company/', null=True, blank=True, verbose_name="Logotipo")
    logo_url = models.CharField(max_length=500, blank=True, default="", verbose_name="URL Logotipo")
    descripcion = models.TextField(blank=True, default="", verbose_name="Descripción")

    # Configuración documental
    encabezado_documental = models.TextField(blank=True, default="", verbose_name="Encabezado Documental")
    pie_pagina_documental = models.TextField(blank=True, default="", verbose_name="Pie de Página Documental")
    prefijo_expedientes = models.CharField(max_length=20, default="EXP-", verbose_name="Prefijo de Expedientes")
    correlativo_actual = models.PositiveIntegerField(default=1000, verbose_name="Correlativo Actual")
    zona_horaria = models.CharField(max_length=50, default="America/Lima", verbose_name="Zona Horaria")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Datos de Empresa"
        verbose_name_plural = "Datos de Empresa"

    def __str__(self):
        return self.razon_social

    def get_next_expediente_number(self):
        self.correlativo_actual += 1
        self.save(update_fields=['correlativo_actual'])
        return f"{self.prefijo_expedientes}{self.correlativo_actual:06d}"
