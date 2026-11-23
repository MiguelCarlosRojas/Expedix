import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box, Stack, Group, Text, Tooltip, ActionIcon, ScrollArea, Divider,
  Collapse, UnstyledButton, Badge
} from '@mantine/core';
import {
  IconHome,
  IconLayoutDashboard,
  IconFiles,
  IconBrandGoogleDrive,
  IconReportAnalytics,
  IconBuildingStore,
  IconShieldLock,
  IconUsers,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconPaw,
  IconStethoscope,
  IconFileCertificate,
  IconTemplate,
  IconFileSpreadsheet,
  IconAlertTriangle,
  IconCloudCheck,
} from '@tabler/icons-react';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { hasModuleAccess } = usePermissions();
  const location = useLocation();

  // Estados de expansión de submenús
  const isDocActive = location.pathname.startsWith('/app/documentos');
  const isRepActive = location.pathname.startsWith('/app/reportes');
  const isAdminActive =
    location.pathname.startsWith('/app/administracion') ||
    location.pathname.startsWith('/app/roles') ||
    location.pathname.startsWith('/app/usuarios') ||
    location.pathname.startsWith('/app/empresa');

  const [docsOpened, setDocsOpened] = useState(isDocActive);
  const [reportsOpened, setReportsOpened] = useState(isRepActive);
  const [adminOpened, setAdminOpened] = useState(isAdminActive);

  // Submenús de Documentos Veterinarios
  const docSubItems = [
    { label: 'Todos los Expedientes', path: '/app/documentos/todos', icon: <IconFiles size={16} /> },
    { label: 'Historias Clínicas', path: '/app/documentos/historias', icon: <IconPaw size={16} /> },
    { label: 'Certificados & Altas', path: '/app/documentos/certificados', icon: <IconFileCertificate size={16} /> },
    { label: 'Plantillas Maestras', path: '/app/documentos/plantillas', icon: <IconTemplate size={16} /> },
  ];

  // Submenús con los CINCO Reportes Independientes
  const reportSubItems = [
    { label: 'R1: Resumen General', path: '/app/reportes/1', icon: <IconReportAnalytics size={16} /> },
    { label: 'R2: Por Tipo de Plantilla', path: '/app/reportes/2', icon: <IconFileSpreadsheet size={16} /> },
    { label: 'R3: Productividad Personal', path: '/app/reportes/3', icon: <IconUsers size={16} /> },
    { label: 'R4: Trazabilidad & Errores', path: '/app/reportes/4', icon: <IconAlertTriangle size={16} /> },
    { label: 'R5: Almacenamiento Drive', path: '/app/reportes/5', icon: <IconCloudCheck size={16} /> },
  ];

  // Submenús de Administración
  const adminSubItems = [
    { label: 'Información Empresa', path: '/app/administracion', icon: <IconBuildingStore size={16} /> },
    { label: 'Roles & Permisos', path: '/app/roles', icon: <IconShieldLock size={16} /> },
    { label: 'Usuarios', path: '/app/usuarios', icon: <IconUsers size={16} /> },
  ];

  return (
    <Box
      style={{
        width: collapsed ? 76 : 268,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 110,
        transition: 'width 0.22s ease-in-out',
        boxShadow: '1px 0 3px rgba(0,0,0,0.02)',
      }}
    >
      {/* Brand Header */}
      <Box p="md" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <Group gap="xs" wrap="nowrap">
            <Box
              style={{
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                borderRadius: 10,
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
              }}
            >
              <IconPaw size={22} color="#ffffff" />
            </Box>
            <div>
              <Text fw={900} size="sm" c="vetGreen.9" style={{ letterSpacing: '0.5px', lineHeight: 1.1 }}>
                EXPEDIX <span style={{ color: '#16a34a' }}>VET</span>
              </Text>
              <Text size="10px" c="dimmed" fw={700} style={{ letterSpacing: '0.6px' }}>
                SALUD & BIENESTAR ANIMAL
              </Text>
            </div>
          </Group>
        )}

        {collapsed && (
          <Box
            mx="auto"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              borderRadius: 10,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconPaw size={22} color="#ffffff" />
          </Box>
        )}
      </Box>

      <Divider color="gray.2" />

      {/* Independent Vertical Scroll Nav */}
      <ScrollArea
        style={{ flex: 1, width: '100%' }}
        p="xs"
        type="hover"
        styles={{
          viewport: { overflowX: 'hidden' },
        }}
      >
        <Stack gap={3} style={{ width: '100%', overflow: 'hidden' }}>
          {/* 1. Inicio */}
          {hasModuleAccess('inicio') && (
            <Tooltip label="Inicio" position="right" disabled={!collapsed} withArrow>
              <NavLink
                to="/app/inicio"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <IconHome size={20} className="sidebar-icon" />
                {!collapsed && <Text size="sm" ml="sm">Inicio</Text>}
              </NavLink>
            </Tooltip>
          )}

          {/* 2. Dashboard */}
          {hasModuleAccess('dashboard') && (
            <Tooltip label="Dashboard" position="right" disabled={!collapsed} withArrow>
              <NavLink
                to="/app/dashboard"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <IconLayoutDashboard size={20} className="sidebar-icon" />
                {!collapsed && <Text size="sm" ml="sm">Dashboard</Text>}
              </NavLink>
            </Tooltip>
          )}

          {/* 3. Documentos (Expandible) */}
          {hasModuleAccess('documentos') && (
            <Box>
              <Tooltip label="Documentos" position="right" disabled={!collapsed} withArrow>
                <UnstyledButton
                  onClick={() => {
                    if (collapsed && onToggleCollapse) onToggleCollapse();
                    setDocsOpened((o) => !o);
                  }}
                  className={`sidebar-link ${isDocActive ? 'active' : ''}`}
                  style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between' }}
                >
                  <Group gap={0}>
                    <IconStethoscope size={20} className="sidebar-icon" />
                    {!collapsed && <Text size="sm" ml="sm">Documentos</Text>}
                  </Group>
                  {!collapsed && (
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                      {docsOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </Box>
                  )}
                </UnstyledButton>
              </Tooltip>

              {/* Subopciones de Documentos */}
              {!collapsed && (
                <Collapse in={docsOpened}>
                  <Stack gap={2} pt={2} pb={4}>
                    {docSubItems.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                      >
                        <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden', maxWidth: '100%' }}>
                          <Box style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {sub.icon}
                          </Box>
                          <Text size="xs" truncate style={{ flex: 1 }}>{sub.label}</Text>
                        </Group>
                      </NavLink>
                    ))}
                  </Stack>
                </Collapse>
              )}
            </Box>
          )}

          {/* 4. Drives */}
          {hasModuleAccess('drives') && (
            <Tooltip label="Drives" position="right" disabled={!collapsed} withArrow>
              <NavLink
                to="/app/drives"
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <IconBrandGoogleDrive size={20} className="sidebar-icon" />
                {!collapsed && <Text size="sm" ml="sm">Drives</Text>}
              </NavLink>
            </Tooltip>
          )}

          {/* 5. Reportes (Expandible con los 5 Reportes!) */}
          {hasModuleAccess('reportes') && (
            <Box>
              <Tooltip label="Reportes" position="right" disabled={!collapsed} withArrow>
                <UnstyledButton
                  onClick={() => {
                    if (collapsed && onToggleCollapse) onToggleCollapse();
                    setReportsOpened((o) => !o);
                  }}
                  className={`sidebar-link ${isRepActive ? 'active' : ''}`}
                  style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between' }}
                >
                  <Group gap={0}>
                    <IconReportAnalytics size={20} className="sidebar-icon" />
                    {!collapsed && <Text size="sm" ml="sm">Reportes</Text>}
                  </Group>
                  {!collapsed && (
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                      {reportsOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </Box>
                  )}
                </UnstyledButton>
              </Tooltip>

              {/* Subopciones de los 5 Reportes */}
              {!collapsed && (
                <Collapse in={reportsOpened}>
                  <Stack gap={2} pt={2} pb={4}>
                    {reportSubItems.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                      >
                        <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden', maxWidth: '100%' }}>
                          <Box style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {sub.icon}
                          </Box>
                          <Text size="xs" truncate style={{ flex: 1 }}>{sub.label}</Text>
                        </Group>
                      </NavLink>
                    ))}
                  </Stack>
                </Collapse>
              )}
            </Box>
          )}

          {/* 6. Administración (Expandible con las 3 opciones exactas!) */}
          {(hasModuleAccess('administracion') || hasModuleAccess('roles') || hasModuleAccess('usuarios')) && (
            <Box>
              <Tooltip label="Administración" position="right" disabled={!collapsed} withArrow>
                <UnstyledButton
                  onClick={() => {
                    if (collapsed && onToggleCollapse) onToggleCollapse();
                    setAdminOpened((o) => !o);
                  }}
                  className={`sidebar-link ${isAdminActive ? 'active' : ''}`}
                  style={{ width: '100%', justifyContent: collapsed ? 'center' : 'space-between' }}
                >
                  <Group gap={0}>
                    <IconBuildingStore size={20} className="sidebar-icon" />
                    {!collapsed && <Text size="sm" ml="sm">Administración</Text>}
                  </Group>
                  {!collapsed && (
                    <Box style={{ display: 'flex', alignItems: 'center' }}>
                      {adminOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    </Box>
                  )}
                </UnstyledButton>
              </Tooltip>

              {/* Subopciones de Administración */}
              {!collapsed && (
                <Collapse in={adminOpened}>
                  <Stack gap={2} pt={2} pb={4}>
                    {adminSubItems.map((sub) => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}
                      >
                        <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden', maxWidth: '100%' }}>
                          <Box style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {sub.icon}
                          </Box>
                          <Text size="xs" truncate style={{ flex: 1 }}>{sub.label}</Text>
                        </Group>
                      </NavLink>
                    ))}
                  </Stack>
                </Collapse>
              )}
            </Box>
          )}
        </Stack>
      </ScrollArea>
    </Box>
  );
};
