# Expedix - Infraestructura de Despliegue (Kubernetes y Render)

Esta rama (`feature/deploy`) contiene exclusivamente los manifiestos, configuraciones y guías de despliegue en entornos de producción e infraestructura cloud para el sistema **Expedix**.

---

## 1. Arquitectura de Despliegue

```text
/
├── k8s/                      # Manifiestos para clústeres Kubernetes
│   ├── namespace.yaml        # Namespace dedicado: expedix
│   ├── configmap.yaml        # Variables de configuración pública
│   ├── secrets.example.yaml  # Plantilla de secretos (sin credenciales reales)
│   ├── api-deployment.yaml   # Deployment API (daphne, 2 réplicas)
│   ├── api-service.yaml      # Service interno ClusterIP para API
│   ├── web-deployment.yaml   # Deployment Web (nginx SPA, 2 réplicas)
│   ├── web-service.yaml      # Service interno ClusterIP para Web
│   ├── worker-deployment.yaml# Deployment Celery Worker
│   ├── beat-deployment.yaml  # Deployment Celery Beat (1 réplica)
│   ├── ingress.yaml          # Enrutamiento Nginx Ingress con WebSockets y TLS
│   └── README.md             # Guía paso a paso de Kubernetes
└── render/                   # Configuración para despliegue en Render Cloud
    ├── render.yaml           # Blueprint oficial de Render (6 servicios)
    └── README.md             # Guía paso a paso de Render
```

---

## 2. Imágenes Reutilizadas desde Docker Hub

Todas las cargas de trabajo reutilizan exclusivamente las dos imágenes del repositorio único de Docker Hub:

| Componente | Imagen Docker |
| :--- | :--- |
| **API REST / Channels** | `docker.io/miguelangelcr/expedix-ia:api-latest` |
| **Celery Worker** | `docker.io/miguelangelcr/expedix-ia:api-latest` |
| **Celery Beat** | `docker.io/miguelangelcr/expedix-ia:api-latest` |
| **Web Frontend SPA** | `docker.io/miguelangelcr/expedix-ia:web-latest` |

---

## 3. Guías de Despliegue

- Para desplegar en clústeres Kubernetes (EKS, GKE, AKS, Minikube, Kind), consulte [k8s/README.md](k8s/README.md).
- Para desplegar en Render Cloud Platform (Web Services, Workers, Postgres, Redis), consulte [render/README.md](render/README.md).
