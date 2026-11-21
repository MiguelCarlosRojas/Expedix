# Expedix Web - Aplicación Frontend Empresarial

Interfaz de usuario del sistema **Expedix**, construida con **React 19**, **TypeScript**, **Vite** y **Mantine UI v7**. Incluye el editor embebido de hojas de cálculo **Univer Sheets SDK v1.5.2**, constructor visual de campos dinámicos con `@dnd-kit`, centro de métricas `@mantine/charts` y conexión en tiempo real vía WebSockets para notificaciones reactivas.

---

## Estructura del Código

```text
/
├── public/                   # Recursos estáticos públicos y favicons
├── src/
│   ├── components/           # Componentes UI reutilizables, modales y editores
│   │   ├── editors/          # UniverSpreadsheetEditor y GoogleDocsEditor
│   │   ├── forms/            # DynamicForm y FormBuilder drag-and-drop
│   │   └── ui/               # Botones, inputs, badges y modales estándar
│   ├── features/             # Páginas y vistas principales del sistema
│   │   ├── administration/   # Administración empresarial y correlativos
│   │   ├── auth/             # Inicio de sesión y autenticación
│   │   ├── dashboard/        # KPIs y 7 gráficos analíticos
│   │   ├── documents/        # Listado y asistente de generación (wizard)
│   │   ├── drives/           # Explorador integrado de Google Drive
│   │   ├── home/             # Accesos directos exclusivos por rol
│   │   ├── reports/          # Los 5 reportes del sistema y exportación
│   │   ├── roles/            # Matriz de roles y permisos
│   │   └── users/            # Gestión de cuentas y asignación de roles
│   ├── hooks/                # Hooks personalizados (useAuth, usePermissions, useNotifications)
│   ├── layouts/              # AppLayout, Sidebar fija (8 ítems) y Header
│   ├── routes/               # Enrutamiento con react-router-dom
│   ├── services/             # Cliente Axios configurado para la API REST
│   ├── styles/               # Estilos globales y temas Mantine
│   └── types/                # Definiciones de tipos TypeScript
├── index.html                # Plantilla HTML de la SPA
├── package.json              # Manifiesto de dependencias y scripts
├── pnpm-lock.yaml            # Bloqueo de versiones reproducible
├── tsconfig.json             # Configuración TypeScript
└── vite.config.ts            # Configuración de empaquetado Vite
```

---

## Dependencias Principales

- **React 19**
- **TypeScript 5.x**
- **Mantine UI v7** (`@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/charts`, `@mantine/notifications`, `@mantine/modals`, `@mantine/dates`)
- **Univer Sheets SDK v1.5.2** (`@univerjs/presets`, `@univerjs/preset-sheets-core`)
- **Drag & Drop**: `@dnd-kit/core` y `@dnd-kit/sortable`
- **Iconografía**: `@tabler/icons-react`
- **Estado y Enrutamiento**: `@tanstack/react-query`, `react-router-dom`

---

## Desarrollo Local

1. Instalar dependencias con `pnpm`:
   ```bash
   pnpm install
   ```
2. Iniciar el servidor de desarrollo Vite con HMR:
   ```bash
   pnpm dev
   ```
3. Compilar para producción (validación de tipos y empaquetado optimizado):
   ```bash
   pnpm build
   ```
4. Previsualizar el build de producción:
   ```bash
   pnpm preview
   ```
