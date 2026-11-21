# Despliegue de Expedix en Render

Esta guía detalla el procedimiento para desplegar la arquitectura completa de **Expedix** en [Render Cloud Platform](https://render.com) utilizando las imágenes Docker publicadas en el repositorio único de Docker Hub `miguelangelcr/expedix-ia`.

> [!IMPORTANT]
> **Aclaración sobre Kubernetes en Render:**
> Render es una plataforma de servicios gestionados que **NO ejecuta manifiestos de Kubernetes** (`kubectl`, Deployments, Ingress). El despliegue en Render se realiza mediante sus tipos de servicio nativos (**Web Services**, **Background Workers**, **Managed PostgreSQL** y **Managed Redis**), reutilizando exactamente las mismas imágenes publicadas en Docker Hub.

---

## 1. Arquitectura de Servicios en Render

El sistema se compone de 6 servicios integrados:

| Nombre en Render | Tipo de Servicio | Imagen Docker Hub / Recurso | Función |
| :--- | :--- | :--- | :--- |
| **`expedix-postgres`** | PostgreSQL Gestionado | Render Postgres (v16) | Base de datos relacional y campos JSONB |
| **`expedix-redis`** | Redis Gestionado | Render Key Value Store | Broker Celery y capas de Channel WebSocket |
| **`expedix-api`** | Web Service | `docker.io/miguelangelcr/expedix-ia:api-latest` | API REST Django y servidor ASGI Daphne |
| **`expedix-web`** | Web Service | `docker.io/miguelangelcr/expedix-ia:web-latest` | SPA React 19 servida por Nginx |
| **`expedix-celery-worker`**| Background Worker | `docker.io/miguelangelcr/expedix-ia:api-latest` | Generación de expedientes y PDFs en cola |
| **`expedix-celery-beat`**  | Background Worker | `docker.io/miguelangelcr/expedix-ia:api-latest` | Planificador periódico de sincronizaciones |

---

## 2. Método de Despliegue: Blueprint Automatizado (Recomendado)

1. En el panel de Render, seleccione **Blueprints** -> **New Blueprint Instance**.
2. Conecte su repositorio GitHub `MiguelCarlosRojas/Expedix` y seleccione la rama `feature/deploy`.
3. Render detectará automáticamente el archivo [render/render.yaml](render.yaml).
4. Asigne los nombres y confirme la creación. Render aprovisionará la base de datos, Redis, los Web Services y los Workers en la misma región.

---

## 3. Método de Despliegue Manual (Paso a Paso)

### Paso 1: Base de Datos PostgreSQL
1. Clic en **New** -> **PostgreSQL**.
2. Nombre: `expedix-postgres`.
3. Base de datos: `expedientes_db`. Usuario: `expedientes_user`.
4. Copie la **Internal Database URL** generada.

### Paso 2: Redis
1. Clic en **New** -> **Redis**.
2. Nombre: `expedix-redis`.
3. Copie la **Internal Redis URL** generada.

### Paso 3: Web Service de la API
1. Clic en **New** -> **Web Service** -> **Existing Image**.
2. Imagen: `docker.io/miguelangelcr/expedix-ia:api-latest`.
3. Nombre: `expedix-api`.
4. **Health Check Path:** `/health/`.
5. Variables de entorno:
   - `DEBUG`: `False`
   - `DJANGO_SECRET_KEY`: *(Generar clave segura de 50 caracteres)*
   - `DATABASE_URL`: *(Pegar Internal Database URL de expedix-postgres)*
   - `REDIS_URL`: *(Pegar Internal Redis URL de expedix-redis)*
   - `CELERY_BROKER_URL`: *(Misma Internal Redis URL con `/1`)*
   - `CELERY_RESULT_BACKEND`: *(Misma Internal Redis URL con `/1`)*
   - `ALLOWED_HOSTS`: `*`
   - `CORS_ALLOWED_ORIGINS`: `https://expedix-web.onrender.com`
   - `CSRF_TRUSTED_ORIGINS`: `https://expedix-web.onrender.com,https://expedix-api.onrender.com`

### Paso 4: Web Service del Frontend
1. Clic en **New** -> **Web Service** -> **Existing Image**.
2. Imagen: `docker.io/miguelangelcr/expedix-ia:web-latest`.
3. Nombre: `expedix-web`.
4. **Health Check Path:** `/health`.
5. Variables de entorno:
   - `VITE_API_BASE_URL`: `https://expedix-api.onrender.com`
   - `VITE_WS_BASE_URL`: `wss://expedix-api.onrender.com`

### Paso 5: Celery Worker
1. Clic en **New** -> **Background Worker** -> **Existing Image**.
2. Imagen: `docker.io/miguelangelcr/expedix-ia:api-latest`.
3. Nombre: `expedix-celery-worker`.
4. **Docker Command:** `celery -A config worker -l INFO`.
5. Configurar las mismas variables de entorno que `expedix-api` (`DATABASE_URL`, `REDIS_URL`, etc.).

### Paso 6: Celery Beat
1. Clic en **New** -> **Background Worker** -> **Existing Image**.
2. Imagen: `docker.io/miguelangelcr/expedix-ia:api-latest`.
3. Nombre: `expedix-celery-beat`.
4. **Docker Command:** `celery -A config beat -l INFO`.
5. Configurar las mismas variables de entorno que `expedix-api`.

---

## 4. Actualización de Versiones y Rollback en Render

### Actualización de Imágenes
Cuando GitHub Actions publica una nueva imagen con etiqueta `api-latest` o `web-latest`:
1. En el panel del servicio correspondiente en Render, haga clic en **Manual Deploy** -> **Deploy latest image**.
2. O bien, configure el **Deploy Hook URL** de Render como un secret en GitHub Actions para disparar el redespliegue automático tras cada publicación exitosa.

### Despliegue por Commit o Rollback
Para volver a una versión previa ante cualquier anomalía:
1. En Render, diríjase a **Settings** -> **Image URL**.
2. Cambie la etiqueta de la imagen:
   - De: `docker.io/miguelangelcr/expedix-ia:api-latest`
   - A: `docker.io/miguelangelcr/expedix-ia:api-sha-<commit_anterior>`
3. Guarde los cambios. Render desplegará inmediatamente la imagen exacta correspondiente a dicho commit.
