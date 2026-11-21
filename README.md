# Expedix - Sistema Empresarial de Gestión y Automatización de Expedientes Electrónicos

Plataforma empresarial de grado de producción diseñada para la administración integral, generación masiva y automatización de expedientes electrónicos, documentos maestros, hojas de cálculo integradas y almacenamiento en la nube sin depender de herramientas de usuario final como Google Apps Script o AutoCrat.

---

## 1. Organización del Repositorio

El proyecto **Expedix** se encuentra organizado en ramas independientes para mantener una estricta separación de responsabilidades y despliegues desacoplados:

| Rama | Contenido | Ubicación de Archivos |
| :--- | :--- | :--- |
| **`main`** | Documentación principal y configuración global de exclusiones | Raíz del proyecto (`README.md`, `.gitignore`) |
| **`feature/api`** | Backend completo: API REST, WebSockets (Channels), Celery, ReportLab, Dockerfile y CI/CD | Directamente en la raíz de la rama |
| **`feature/web`** | Frontend completo: SPA React 19, Mantine UI v7, Univer Sheets SDK, Dockerfile y CI/CD | Directamente en la raíz de la rama |
| **`feature/deploy`** | Infraestructura de despliegue: Manifiestos de Kubernetes y Blueprint de Render | Subdirectorios `k8s/` y `render/` |

---

## 2. Publicación de Imágenes en Docker Hub

El proyecto utiliza un **ÚNICO REPOSITORIO** en Docker Hub para almacenar ambos componentes mediante etiquetas diferenciadas e independientes:

**Repositorio Oficial:**
[https://hub.docker.com/r/miguelangelcr/expedix-ia](https://hub.docker.com/r/miguelangelcr/expedix-ia)

### Estrategia de Etiquetas (Tags)

| Componente | Etiqueta Estable | Etiqueta por Commit | Comando de Descarga |
| :--- | :--- | :--- | :--- |
| **Backend / Celery** | `api`, `api-latest` | `api-sha-<commit>` | `docker pull miguelangelcr/expedix-ia:api-latest` |
| **Frontend Web** | `web`, `web-latest` | `web-sha-<commit>` | `docker pull miguelangelcr/expedix-ia:web-latest` |

> [!NOTE]
> La publicación de una nueva versión de la API no sobrescribe la imagen de la Web, ni viceversa. No se utiliza una etiqueta genérica `latest` para evitar colisiones entre componentes.

---

## 3. Arquitectura y Tecnologías

### Backend (`feature/api`)
- **Python 3.12+**
- **Django 5.1 / 6.0 compatible** con **Django REST Framework (DRF)**
- **PostgreSQL 16** con soporte nativo de campos `JSONB` y esquema relacional normalizado
- **Redis 7** (Message Broker & Cache)
- **Celery & Celery Beat** (procesamiento asíncrono y tareas programadas de expedientes)
- **Django Channels & Daphne** (WebSockets reactivos en tiempo real para notificaciones y sincronización)
- **Google API Python Client** (Google Drive API v3, Google Docs API v1, Google Sheets API v4)
- **ReportLab & OpenPyXL** (compilación y exportación de PDFs empresariales y hojas Excel nativas)
- **Health Checks**: Endpoint `/health/` y `/api/v1/health/` para probes de Kubernetes y Render.

### Frontend (`feature/web`)
- **React 19**
- **TypeScript & Vite**
- **Mantine UI v7** (`@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/charts`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dates`)
- **Iconografía**: `@tabler/icons-react`
- **Constructor visual**: `@dnd-kit/core` & `@dnd-kit/sortable` (14 tipos de campos dinámicos)
- **Editor de Hojas de Cálculo**: **Univer Sheets SDK v1.5.2** (`@univerjs/presets`, `@univerjs/preset-sheets-core`)
- **Gestión de estado y enrutamiento**: `@tanstack/react-query`, `react-router-dom`

---

## 4. Despliegue en Producción

### A. Kubernetes (`feature/deploy/k8s`)
El clúster orquesta de forma autónoma los Pods, Servicios e Ingress en el namespace dedicado `expedix`:
- `expedix-api`: 2 réplicas ejecutando Daphne con probes `/health/`.
- `expedix-web`: 2 réplicas ejecutando Nginx con fallback SPA y `/health`.
- `expedix-celery-worker`: 2 réplicas procesando colas de tareas documentales.
- `expedix-celery-beat`: 1 réplica ejecutando el planificador periódico.
- `expedix-ingress`: Enrutamiento Nginx Ingress con soporte WebSockets y TLS.

Consulte la [Guía de Kubernetes en feature/deploy](https://github.com/MiguelCarlosRojas/Expedix/tree/feature/deploy/k8s).

### B. Render Cloud (`feature/deploy/render`)
Render no ejecuta manifiestos de Kubernetes, sino que utiliza sus servicios propios con las mismas imágenes de Docker Hub:
- `expedix-api` (Web Service con puerto dinámico `$PORT` y health check `/health/`).
- `expedix-web` (Web Service Nginx con puerto dinámico `$PORT` y health check `/health`).
- `expedix-celery-worker` (Background Worker con comando `celery -A config worker -l INFO`).
- `expedix-celery-beat` (Background Worker con comando `celery -A config beat -l INFO`).
- `expedix-postgres` (PostgreSQL gestionado por Render).
- `expedix-redis` (Redis gestionado por Render).

Consulte la [Guía de Render en feature/deploy](https://github.com/MiguelCarlosRojas/Expedix/tree/feature/deploy/render).

---

## 5. Automatización CI/CD (GitHub Actions)

Cada rama de desarrollo cuenta con su propio workflow en `.github/workflows/docker-publish.yml`:
- **`feature/api`**: Ejecuta las pruebas automatizadas de integración (`pytest`). Al aprobar, compila la imagen Docker multiplataforma y la publica en `miguelangelcr/expedix-ia` con las etiquetas `api`, `api-latest` y `api-sha-<commit>`.
- **`feature/web`**: Instala dependencias con `pnpm`, ejecuta la validación de TypeScript y compila el bundle de Vite. Al aprobar, compila la imagen Nginx y la publica en `miguelangelcr/expedix-ia` con las etiquetas `web`, `web-latest` y `web-sha-<commit>`.

---

## 6. Configuración de Variables de Entorno

| Variable | Componente | Descripción |
| :--- | :--- | :--- |
| `DEBUG` | API / Workers | `False` en producción |
| `DJANGO_SECRET_KEY` | API / Workers | Clave criptográfica única de Django |
| `ALLOWED_HOSTS` | API | Dominios permitidos separados por comas |
| `DATABASE_URL` | API / Workers | URL de conexión PostgreSQL (`postgresql://user:pass@host:5432/db`) |
| `REDIS_URL` | API / Workers | URL de conexión Redis (`redis://host:6379/0`) |
| `CELERY_BROKER_URL` | API / Workers | Broker de mensajería Celery (`redis://host:6379/1`) |
| `CELERY_RESULT_BACKEND` | API / Workers | Backend de resultados de Celery (`redis://host:6379/1`) |
| `CORS_ALLOWED_ORIGINS` | API | Orígenes frontend permitidos (`https://expedix-web.onrender.com`) |
| `CSRF_TRUSTED_ORIGINS` | API | Orígenes de confianza CSRF |
| `VITE_API_BASE_URL` | Web | URL pública base de la API REST |
| `VITE_WS_BASE_URL` | Web | URL pública de WebSockets (`wss://expedix-api.onrender.com`) |

---

## 7. Pruebas y Aseguramiento de Calidad

Para ejecutar la suite de integración localmente:

```bash
cd backend
pytest tests/test_full_system.py -v
```

Cobertura validada:
- Autenticación, sesión y cierre de sesión.
- Actualización de perfil y control de accesos.
- Filtrado de accesos directos por rol en Inicio.
- Indicadores (8 KPIs) y series de gráficos del Dashboard.
- Ciclo de vida de plantillas maestras y clonación independiente.
- Explorador de archivos de Drive y jerarquía de carpetas.
- Editor Univer Sheets y sincronización debounced.
- Ciclo de vida documental y compilación de PDF oficial ReportLab.
- Exportación certificada de los 5 reportes (PDF, Excel, CSV).
- Endpoint de verificación de salud (`/health/`).
