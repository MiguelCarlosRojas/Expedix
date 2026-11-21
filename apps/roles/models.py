from django.db import models

class Role(models.Model):
    name = models.CharField(max_length=60, unique=True, verbose_name="Nombre del Rol")
    code = models.CharField(max_length=60, unique=True, verbose_name="Código")
    description = models.TextField(blank=True, default="", verbose_name="Descripción")
    is_active = models.BooleanField(default=True, verbose_name="Activo")
    is_system = models.BooleanField(default=False, verbose_name="Rol de Sistema")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ['id']

    def __str__(self):
        return self.name

class Permission(models.Model):
    MODULE_CHOICES = [
        ('inicio', 'Inicio'),
        ('dashboard', 'Dashboard'),
        ('documentos', 'Documentos'),
        ('drives', 'Drives'),
        ('reportes', 'Reportes'),
        ('administracion', 'Administración'),
        ('roles', 'Roles y Permisos'),
        ('usuarios', 'Usuarios'),
        ('notificaciones', 'Notificaciones'),
    ]

    ACTION_CHOICES = [
        ('view', 'Visualizar'),
        ('create', 'Crear'),
        ('edit', 'Editar'),
        ('delete', 'Eliminar'),
        ('generate', 'Generar'),
        ('download', 'Descargar'),
        ('export', 'Exportar'),
        ('admin', 'Administrar'),
    ]

    module = models.CharField(max_length=40, choices=MODULE_CHOICES, verbose_name="Módulo")
    action = models.CharField(max_length=40, choices=ACTION_CHOICES, verbose_name="Acción")
    codename = models.CharField(max_length=100, unique=True, verbose_name="Código")
    name = models.CharField(max_length=120, verbose_name="Nombre")
    description = models.CharField(max_length=255, blank=True, default="", verbose_name="Descripción")

    class Meta:
        verbose_name = "Permiso"
        verbose_name_plural = "Permisos"
        unique_together = ('module', 'action')
        ordering = ['module', 'action']

    def __str__(self):
        return f"{self.get_module_display()} - {self.get_action_display()} ({self.codename})"

class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='roles')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Permiso de Rol"
        verbose_name_plural = "Permisos de Roles"
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} -> {self.permission.codename}"
