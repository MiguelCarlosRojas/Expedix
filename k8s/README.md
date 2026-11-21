# Despliegue de Expedix en Kubernetes

Esta carpeta contiene los manifiestos declarativos para orquestar y desplegar el sistema **Expedix** en cualquier clúster de Kubernetes (EKS, GKE, AKS, Minikube, Kind, etc.) utilizando exclusivamente las imágenes publicadas en Docker Hub:

- **Backend / Worker / Beat:** `docker.io/miguelangelcr/expedix-ia:api-latest`
- **Frontend SPA:** `docker.io/miguelangelcr/expedix-ia:web-latest`

---

## 1. Orden de Aplicación de Manifiestos

Para garantizar que las dependencias, namespaces y configuraciones se resuelvan adecuadamente, aplique los manifiestos en el siguiente orden:

```bash
# 1. Crear el Namespace 'expedix'
kubectl apply -f namespace.yaml

# 2. Configuración no sensible
kubectl apply -f configmap.yaml

# 3. Crear los secretos reales (copiar secrets.example.yaml y llenar los valores)
cp secrets.example.yaml secrets.yaml
# Editar secrets.yaml con las credenciales reales
kubectl apply -f secrets.yaml

# 4. Servicios internos
kubectl apply -f api-service.yaml
kubectl apply -f web-service.yaml

# 5. Cargas de trabajo (Deployments)
kubectl apply -f api-deployment.yaml
kubectl apply -f web-deployment.yaml
kubectl apply -f worker-deployment.yaml
kubectl apply -f beat-deployment.yaml

# 6. Enrutador público (Ingress)
kubectl apply -f ingress.yaml
```

---

## 2. Verificación del Estado del Clúster

Verificar que todos los Pods, Servicios e Ingress estén en estado `Running` o `Ready`:

```bash
# Consultar pods en el namespace expedix
kubectl get pods -n expedix -o wide

# Consultar servicios internos
kubectl get svc -n expedix

# Consultar logs de la API
kubectl logs -n expedix -l app=expedix-api --tail=100 -f

# Consultar estado del Ingress
kubectl get ingress -n expedix
```

---

## 3. Actualización de Versiones (Rollout)

Para actualizar a una nueva versión compilada por commit sin interrumpir el servicio:

```bash
# Actualizar la API a un commit específico:
kubectl set image deployment/expedix-api api=docker.io/miguelangelcr/expedix-ia:api-sha-<commit> -n expedix

# Verificar el estado de la actualización progresiva:
kubectl rollout status deployment/expedix-api -n expedix

# En caso de emergencia, realizar un rollback inmediato:
kubectl rollout undo deployment/expedix-api -n expedix
```
