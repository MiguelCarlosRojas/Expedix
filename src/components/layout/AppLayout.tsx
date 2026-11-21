import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const pageTitles: Record<string, { title: string; breadcrumbs: Array<{ label: string; href?: string }> }> = {
  '/app/inicio': {
    title: 'Inicio',
    breadcrumbs: [{ label: 'Sistema' }, { label: 'Inicio' }],
  },
  '/app/dashboard': {
    title: 'Dashboard Ejecutivo',
    breadcrumbs: [{ label: 'Sistema' }, { label: 'Dashboard' }],
  },
  '/app/documentos': {
    title: 'Gestión de Expedientes y Documentos',
    breadcrumbs: [{ label: 'Sistema' }, { label: 'Documentos' }],
  },
  '/app/drives': {
    title: 'Administrador de Google Drive',
    breadcrumbs: [{ label: 'Sistema' }, { label: 'Drives' }],
  },
  '/app/reportes': {
    title: 'Centro de Reportes Empresariales',
    breadcrumbs: [{ label: 'Sistema' }, { label: 'Reportes' }],
  },
  '/app/administracion': {
    title: 'Administración Empresarial',
    breadcrumbs: [{ label: 'Configuración' }, { label: 'Administración' }],
  },
  '/app/roles': {
    title: 'Roles y Matriz de Permisos',
    breadcrumbs: [{ label: 'Seguridad' }, { label: 'Roles y Permisos' }],
  },
  '/app/usuarios': {
    title: 'Administración de Usuarios',
    breadcrumbs: [{ label: 'Seguridad' }, { label: 'Usuarios' }],
  },
};

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const currentPath = location.pathname;
  const currentConfig = pageTitles[currentPath] || {
    title: 'Gestión Documental',
    breadcrumbs: [{ label: 'Sistema' }, { label: 'Detalle' }],
  };

  const sidebarWidth = collapsed ? 76 : 260;

  return (
    <Box style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Fixed Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Content Area */}
      <Box
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        {/* Fixed Header */}
        <Header
          title={currentConfig.title}
          breadcrumbs={currentConfig.breadcrumbs}
        />

        {/* Central Scrollable Area */}
        <Box
          component="main"
          p="lg"
          style={{
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
