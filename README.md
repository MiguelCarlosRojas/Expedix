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

Para ejecutar la suite de integración localmente en Windows:

```powershell
Set-Location "backend"
.\venv\Scripts\Activate.ps1
pytest tests/test_full_system.py -v
Set-Location ".."
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
- Endpoint de verificación de salud (`/health/` y `/api/v1/health/`).

---

## 8. Guía de Ejecución Local en Windows (PowerShell)

### A. Preparación de Infraestructura Opcional (PostgreSQL y Redis)
Por defecto, Expedix en desarrollo local puede ejecutarse con **SQLite** y memoria en canales para desarrollo ágil sin necesidad de contenedores. Si desea utilizar PostgreSQL y Redis reales idénticos a producción, puede levantarlos de forma aislada:

```powershell
# Levantar únicamente PostgreSQL y Redis en segundo plano
docker compose up -d expedix-postgres expedix-redis
```

### B. Ejecución del Backend (Django + Daphne ASGI)

```powershell
# 1. Acceder al directorio backend
Set-Location "backend"

# 2. Configurar variables de entorno locales
Copy-Item ".env.example" ".env"

# 3. Activar el entorno virtual de Python 3.12
.\venv\Scripts\Activate.ps1

# 4. Instalar dependencias si fuera necesario
pip install -r requirements.txt

# 5. Aplicar migraciones en la base de datos
python manage.py migrate

# 6. Sembrar datos maestros del sistema (Roles, Permisos, Empresa, Plantillas y Superusuario)
python manage.py seed_system_data

# 7. Iniciar el servidor ASGI con Daphne (soporte WebSockets nativo en puerto 8000)
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

El backend responderá de inmediato en:
- Health Check: `http://127.0.0.1:8000/health/`
- API REST: `http://127.0.0.1:8000/api/v1/`
- Panel Django Admin: `http://127.0.0.1:8000/admin/`

**Credenciales iniciales sembradas:**
- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** `Superadministrador`

### C. Ejecución del Frontend (React 19 + Vite)

En una segunda terminal de PowerShell:

```powershell
# 1. Acceder al directorio frontend
Set-Location "frontend"

# 2. Configurar variables de entorno locales
Copy-Item ".env.example" ".env"

# 3. Instalar dependencias con pnpm
pnpm install

# 4. Iniciar el servidor de desarrollo Vite con HMR
pnpm dev
```

La aplicación abrirá en `http://localhost:5173`. Las llamadas a `/api` y los sockets `/ws` son redirigidos de forma transparente al backend mediante el proxy de desarrollo configurado en `vite.config.ts`.

---

## 9. Ejecución Completa con Docker Compose

Para levantar la arquitectura completa (6 servicios orquestados) en un único comando:

```powershell
# Compilar y levantar todos los contenedores
docker compose up --build

# Para detener los servicios conservando los datos persistentes de PostgreSQL y Redis:
docker compose down

# Para ver los logs en tiempo real de un servicio específico:
docker compose logs -f expedix-api
docker compose logs -f expedix-web
```

---

## 10. Solución a Incidencias CI/CD en GitHub Actions

### Error: `Username and password required` en `docker/login-action`
Este error se producía cuando el pipeline se ejecutaba antes de registrar los secretos en GitHub.
- **Causa:** Ausencia de variables en el almacén de secretos del repositorio.
- **Solución implementada:** Se registraron los secretos `DOCKERHUB_USERNAME` (`miguelangelcr`) y `DOCKERHUB_TOKEN` en `Settings -> Secrets and variables -> Actions`.
- **Ejecuciones exitosas verificadas:**
  - API Workflow (Run `44982347647`): Construcción y publicación exitosa de `miguelangelcr/expedix-ia:api-latest` y `api-sha-8686d87`.
  - Web Workflow (Run `45089437224`): Validación TypeScript, build Vite y publicación exitosa de `miguelangelcr/expedix-ia:web-latest` y `web-sha-9ee8690`.

### Advertencia: `[DEP0040] DeprecationWarning: The punycode module is deprecated`
- **Origen:** Proviene del runtime interno de Node.js 24 ejecutado por el runner de GitHub Actions al cargar paquetes de acciones empacadas con versiones anteriores de utilitarios de red (`punycode`).
- **Impacto:** Es un aviso informativo (*warning*) de deprecación del motor Node.js del runner, no un error bloqueante, y no afecta en absoluto a las aplicaciones Django ni React del repositorio.

---

## 11. Ficha Técnica y Metadatos de Docker Hub

Para mantener una presentación consistente con proyectos como Vork:

- **Repositorio Oficial:** `miguelangelcr/expedix-ia`
- **Descripción (< 350 caracteres):**
  > Plataforma empresarial de automatización y gestión de expedientes electrónicos. API REST en Django/Daphne ASGI y Frontend SPA en React 19/Vite, preparada para despliegue en Docker, Kubernetes y Render.
- **Website URL:** `https://hub.docker.com/r/miguelangelcr/expedix-ia/tags`
- **Topics Relevantes:**
  `expedix`, `expedix-ia`, `api`, `django`, `python`, `react`, `reactjs`, `typescript`, `vite`, `mantine`, `rest-api`, `daphne`, `asgi`, `celery`, `redis`, `postgresql`, `docker`, `dockerhub`, `kubernetes`, `render`, `github-actions`, `cicd`, `nginx`, `microservices`
