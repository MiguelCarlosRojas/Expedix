# Expedix API - Backend y Motor de Automatización Documental

Servicio central del sistema **Expedix**, desarrollado en **Python 3.12+**, **Django 5.1/6.0**, **Django REST Framework (DRF)** y **Django Channels**, encargado de la lógica de negocio, ciclo de vida de expedientes electrónicos, control de acceso basado en roles (RBAC), conectores con Google Workspace y generación documental oficial en PDF.

---

## Estructura del Código

```text
/
├── apps/
│   ├── accounts/             # Usuarios, autenticación y perfiles
│   ├── audit/                # Registro inmutable de auditoría
│   ├── company/              # Datos fiscales y prefijos correlativos
│   ├── dashboard/            # KPIs, métricas y estado de integraciones
│   ├── documents/            # Expedientes, ciclo de vida y compilador ReportLab
│   ├── drives/               # Explorador de Google Drive y jerarquía de carpetas
│   ├── dynamic_fields/       # Constructor dinámico de campos y mapeo de tags
│   ├── home/                 # Accesos directos filtrados por RBAC
│   ├── integrations/         # Tareas asíncronas de Celery
│   ├── notifications/        # WebSockets con Django Channels
│   ├── reports/              # 5 reportes ejecutivos y exportadores (PDF, Excel, CSV)
│   ├── roles/                # Matriz de 72 permisos y roles
│   ├── spreadsheet_editor/   # Servicio de hojas de cálculo Univer / Google Sheets
│   └── templates_manager/    # Plantillas maestras y versionado
├── config/                   # Configuración ASGI, WSGI, Celery y Settings
├── tests/                    # Suite de pruebas automatizadas con pytest
├── manage.py                 # Punto de entrada de gestión de Django
├── pytest.ini                # Configuración de pruebas
└── requirements.txt          # Dependencias de Python
```

---

## Requisitos y Configuración

- **Python 3.12+**
- **PostgreSQL 16** (con soporte JSONB)
- **Redis 7** (broker para Celery y Channels)

### Instalación en Entorno Local

1. Crear y activar entorno virtual:
   ```bash
   python -m venv venv
   # En Windows:
   .\venv\Scripts\Activate.ps1
   # En Linux / macOS:
   source venv/bin/activate
   ```
2. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Configurar variables de entorno locales (ver documentación general).
4. Ejecutar migraciones e inicialización:
   ```bash
   python manage.py migrate
   python manage.py seed_system_data
   ```
5. Iniciar el servidor ASGI:
   ```bash
   daphne -b 0.0.0.0 -p 8000 config.asgi:application
   ```

---

## Pruebas Automatizadas

```bash
pytest tests/test_full_system.py -v
```
