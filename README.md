# Expedix - Sistema Empresarial de Gestión y Automatización de Expedientes Electrónicos

Plataforma empresarial de grado de producción diseñada para la administración integral, generación masiva y automatización de expedientes electrónicos, documentos maestros, hojas de cálculo integradas y almacenamiento en la nube sin depender de herramientas de usuario final como Google Apps Script o AutoCrat.

---

## 1. Organización del Repositorio

El proyecto **Expedix** se encuentra organizado en ramas independientes para mantener una separación limpia de responsabilidades:

| Rama | Contenido | Ubicación de Archivos |
| :--- | :--- | :--- |
| **`main`** | Documentación principal y configuración de exclusiones | Raíz del proyecto (`README.md`, `.gitignore`) |
| **`feature/api`** | Backend completo: API REST, modelos, Channels, Celery y servicios | Directamente en la raíz de la rama |
| **`feature/web`** | Frontend completo: SPA React 19, Mantine UI v7 y Univer Sheets SDK | Directamente en la raíz de la rama |

---

## 2. Arquitectura y Tecnologías

### Backend (`feature/api`)
- **Python 3.12+**
- **Django 5.1 / 6.0 compatible** con **Django REST Framework (DRF)**
- **PostgreSQL 16** con soporte nativo de campos `JSONB` y esquema relacional normalizado
- **Redis 7** (Message Broker & Cache)
- **Celery & Celery Beat** (procesamiento asíncrono y tareas programadas de expedientes)
- **Django Channels & Daphne** (WebSockets reactivos en tiempo real para notificaciones y sincronización)
- **Google API Python Client** (Google Drive API v3, Google Docs API v1, Google Sheets API v4)
- **ReportLab & OpenPyXL** (compilación y exportación de PDFs empresariales y hojas Excel nativas)

### Frontend (`feature/web`)
- **React 19**
- **TypeScript & Vite**
- **Mantine UI v7** (`@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/charts`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dates`)
- **Iconografía**: `@tabler/icons-react`
- **Constructor visual**: `@dnd-kit/core` & `@dnd-kit/sortable` (14 tipos de campos dinámicos)
- **Editor de Hojas de Cálculo**: **Univer Sheets SDK v1.5.2** (`@univerjs/presets`, `@univerjs/preset-sheets-core`)
- **Gestión de estado y enrutamiento**: `@tanstack/react-query`, `react-router-dom`

---

## 3. Estructura Visual y Navegación

El menú lateral está fijado a la izquierda con scroll independiente y mantiene el orden corporativo reglamentario:

1. **Inicio**: Contiene **EXCLUSIVAMENTE ACCESOS DIRECTOS** en tarjetas interactivas filtradas por RBAC (sin estadísticas, sin gráficos, sin notificaciones ni actividad).
2. **Dashboard**: Centro analítico con 8 KPIs en tiempo real, 7 gráficos interactivos de `@mantine/charts`, monitor de conectividad de Google Workspace y tabla de últimas operaciones inmutables.
3. **Documentos**: Gestión del ciclo de vida de expedientes electrónicos (`PENDIENTE`, `EN_PROCESO`, `GENERADO`, `OBSERVADO`, `ERROR`), asistente de generación paso a paso (10 etapas automáticas) y generación de PDFs con membrete oficial.
4. **Drives (Módulo Prioritario)**: Administrador integrado de Google Drive con explorador de archivos (vista cuadrícula y lista), navegación por carpetas, creación de carpetas y documentos de Docs/Sheets, subida de archivos y **editor Univer Sheets integrado** con guardado automático debounced (3s) y manual.
5. **Reportes**: Centro analítico con exactamente los 5 reportes del sistema (R1: Resumen General, R2: Documentos por Tipo, R3: Productividad, R4: Errores y Procesamiento, R5: Almacenamiento en Drive) con exportación a PDF, Excel (.xlsx) y CSV.
6. **Administración**: Perfil empresarial, razón social, RUC/NIT, datos fiscales, representante legal, prefijos y correlativos de expedientes (`EXP-2026-XXXX`).
7. **Roles y Permisos**: Matriz RBAC granular con más de 70 permisos individuales agrupados por módulos operativos, creación y clonación de roles.
8. **Usuarios**: Administración de usuarios, asignación de roles, activación/desactivación y gestión de credenciales.

---

## 4. Guía de Ejecución y Desarrollo

### A. Backend (`feature/api`)
1. Clonar o cambiar a la rama `feature/api`:
   ```bash
   git checkout feature/api
   ```
2. Crear y activar el entorno virtual de Python 3.12:
   ```bash
   python -m venv venv
   # En Windows:
   .\venv\Scripts\Activate.ps1
   # En Linux / macOS:
   source venv/bin/activate
   ```
3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
4. Configurar las variables de entorno en el entorno local (ver sección de Configuración).
5. Aplicar migraciones e inicializar datos del sistema:
   ```bash
   python manage.py migrate
   python manage.py seed_system_data
   ```
6. Iniciar el servidor de desarrollo (Daphne / ASGI):
   ```bash
   python manage.py runserver 8000
   ```

### B. Frontend (`feature/web`)
1. Clonar o cambiar a la rama `feature/web`:
   ```bash
   git checkout feature/web
   ```
2. Instalar dependencias con `pnpm`:
   ```bash
   pnpm install
   ```
3. Iniciar el servidor de desarrollo Vite:
   ```bash
   pnpm dev
   ```
4. Compilar para producción:
   ```bash
   pnpm build
   ```

---

## 5. Configuración de Variables de Entorno

El sistema requiere las siguientes variables de entorno para su correcto funcionamiento en cada entorno:

| Variable | Descripción | Ejemplo / Valor por Defecto |
| :--- | :--- | :--- |
| `DEBUG` | Modo depuración (debe ser `False` en producción) | `False` |
| `DJANGO_SECRET_KEY` | Clave criptográfica de Django (generar valor único y seguro) | *Secreto generado* |
| `ALLOWED_HOSTS` | Dominios o IPs permitidos separados por comas | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Orígenes web autorizados para interactuar con la API | `http://localhost:5173` |
| `USE_POSTGRES` | Habilitar motor PostgreSQL (`True` en producción) | `True` o `False` |
| `DB_NAME` | Nombre de la base de datos PostgreSQL | `expedientes_db` |
| `DB_USER` | Usuario de base de datos | `expedientes_user` |
| `DB_PASSWORD` | Contraseña segura de base de datos | *Secreto* |
| `DB_HOST` | Host del servidor PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `REDIS_URL` | URL de conexión para Redis y Channels | `redis://localhost:6379/0` |
| `CELERY_BROKER_URL` | URL del broker Celery | `redis://localhost:6379/1` |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | Ruta al archivo JSON de cuenta de servicio de Google Workspace | `credentials/google_credentials.json` |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Identificador de carpeta raíz en Google Drive | `root` |

> [!IMPORTANT]
> Nunca almacene archivos `.env`, claves privadas ni credenciales reales en el control de versiones. Todas las contraseñas y secretos deben configurarse en variables de entorno locales protegidas o en un gestor de secretos empresarial.
> Si en algún momento se utilizaron credenciales de prueba en entornos compartidos, se recomienda su rotación inmediata.

---

## 6. Roles y Modelo de Seguridad (RBAC)

El sistema implementa control de acceso basado en roles (RBAC) con más de 70 permisos granulares:

- **Superadministrador**: Control total de módulos, configuración empresarial y administración de roles.
- **Director General**: Aprobación de expedientes, supervisión ejecutiva y consulta de reportes.
- **Operador Documental**: Generación de expedientes, administración de plantillas maestras y gestión de archivos en Drive.
- **Auditor**: Consulta y exportación de reportes analíticos e inspección del log inmutable de auditoría.

Las credenciales de acceso para cada usuario deben ser generadas de forma segura y personalizada durante el despliegue inicial.

---

## 7. Pruebas Automatizadas

Para validar la integridad operativa de la API, modelo documental y reportes:

```bash
pytest tests/test_full_system.py -v
```

Cobertura de pruebas automatizadas:
- Autenticación, sesión y cierre de sesión.
- Actualización de perfil y control de accesos.
- Filtrado de accesos directos por rol en Inicio.
- Indicadores (8 KPIs) y series de gráficos del Dashboard.
- Ciclo de vida de plantillas maestras y clonación independiente.
- Explorador de archivos de Drive y jerarquía de carpetas.
- Editor Univer Sheets y sincronización debounced.
- Ciclo de vida documental y compilación de PDF oficial ReportLab.
- Exportación certificada de los 5 reportes (PDF, Excel, CSV).
