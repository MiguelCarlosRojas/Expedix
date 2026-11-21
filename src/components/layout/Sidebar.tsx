import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box, Stack, Group, Text, Tooltip, ActionIcon, ScrollArea, Divider
} from '@mantine/core';
import {
  IconHome,
  IconLayoutDashboard,
  IconFiles,
  IconBrandGoogleDrive,
  IconReportAnalytics,
  IconBuildingSkyscraper,
  IconShieldLock,
  IconUsers,
  IconChevronLeft,
  IconChevronRight,
  IconFileCertificate,
} from '@tabler/icons-react';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { hasModuleAccess } = usePermissions();

  // EXACT ORDER 1 to 8 REQUIRED
  const navItems = [
    {
      id: 'inicio',
      label: 'Inicio',
      path: '/app/inicio',
      icon: <IconHome size={20} className="sidebar-icon" />,
      module: 'inicio',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/app/dashboard',
      icon: <IconLayoutDashboard size={20} className="sidebar-icon" />,
      module: 'dashboard',
    },
    {
      id: 'documentos',
      label: 'Documentos',
      path: '/app/documentos',
      icon: <IconFiles size={20} className="sidebar-icon" />,
      module: 'documentos',
    },
    {
      id: 'drives',
      label: 'Drives',
      path: '/app/drives',
      icon: <IconBrandGoogleDrive size={20} className="sidebar-icon" />,
      module: 'drives',
    },
    {
      id: 'reportes',
      label: 'Reportes',
      path: '/app/reportes',
      icon: <IconReportAnalytics size={20} className="sidebar-icon" />,
      module: 'reportes',
    },
    {
      id: 'administracion',
      label: 'Administración',
      path: '/app/administracion',
      icon: <IconBuildingSkyscraper size={20} className="sidebar-icon" />,
      module: 'administracion',
    },
    {
      id: 'roles',
      label: 'Roles y Permisos',
      path: '/app/roles',
      icon: <IconShieldLock size={20} className="sidebar-icon" />,
      module: 'roles',
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      path: '/app/usuarios',
      icon: <IconUsers size={20} className="sidebar-icon" />,
      module: 'usuarios',
    },
  ];

  return (
    <Box
      style={{
        width: collapsed ? 76 : 260,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 110,
        transition: 'width 0.25s ease',
      }}
    >
      {/* Brand Header */}
      <Box p="md" style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!collapsed && (
          <Group gap="xs" wrap="nowrap">
            <Box
              style={{
                background: 'linear-gradient(135deg, #0b7285, #1971c2)',
                borderRadius: 8,
                padding: '6px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconFileCertificate size={22} color="#ffffff" />
            </Box>
            <div>
              <Text fw={800} size="sm" c="dark.8" style={{ letterSpacing: '0.3px', lineHeight: 1.2 }}>
                EXPEDIENTES PRO
              </Text>
              <Text size="10px" c="dimmed" fw={600}>
                SISTEMA EMPRESARIAL
              </Text>
            </div>
          </Group>
        )}

        {collapsed && (
          <Box
            mx="auto"
            style={{
              background: 'linear-gradient(135deg, #0b7285, #1971c2)',
              borderRadius: 8,
              padding: '6px 8px',
            }}
          >
            <IconFileCertificate size={22} color="#ffffff" />
          </Box>
        )}
      </Box>

      <Divider color="gray.2" />

      {/* Independent Vertical Scroll Nav */}
      <ScrollArea style={{ flex: 1 }} p="xs">
        <Stack gap={4}>
          {navItems.map((item, index) => {
            // Permission check: hide if user lacks access to module
            if (!hasModuleAccess(item.module)) {
              return null;
            }

            const linkContent = (
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '12px 0' : '10px 14px',
                }}
              >
                {item.icon}
                {!collapsed && (
                  <Text size="sm" ml="sm" style={{ flex: 1 }}>
                    {item.label}
                  </Text>
                )}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip label={item.label} position="right" withArrow key={item.id}>
                  <div>{linkContent}</div>
                </Tooltip>
              );
            }

            return <React.Fragment key={item.id}>{linkContent}</React.Fragment>;
          })}
        </Stack>
      </ScrollArea>

      <Divider color="gray.2" />

      {/* Collapse / Expand Toggle Button */}
      <Box p="xs" style={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
          size="lg"
        >
          {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
        </ActionIcon>
      </Box>
    </Box>
  );
};
