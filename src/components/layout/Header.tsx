import React, { useState } from 'react';
import {
  Group, ActionIcon, Menu, Avatar, Text, Indicator, Popover, Stack, Badge, ScrollArea, Divider, UnstyledButton, Box, Tooltip
} from '@mantine/core';
import {
  IconBell, IconChevronDown, IconUser, IconLogout, IconCheck, IconChecks, IconFileCheck, IconAlertTriangle,
  IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconShieldCheck
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationsWebSocket } from '../../hooks/useNotificationsWebSocket';
import { ProfileModal } from './ProfileModal';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';

interface HeaderProps {
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, breadcrumbs, collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const { unreadCount, recentNotifications, markAsRead, markAllAsRead } = useNotificationsWebSocket();

  const [profileModalOpened, setProfileModalOpened] = useState(false);
  const [logoutModalOpened, setLogoutModalOpened] = useState(false);

  return (
    <>
      <header className="app-header" style={{ height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        {/* Left: Sidebar Toggle Button + Navigation Context & Breadcrumbs */}
        <Group gap="md" align="center">
          {onToggleCollapse && (
            <Tooltip
              label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              withArrow
              position="bottom"
            >
              <ActionIcon
                variant="light"
                color="vetGreen"
                size="lg"
                radius="md"
                onClick={onToggleCollapse}
                aria-label="Alternar barra lateral"
                style={{
                  border: '1px solid #bbf7d0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {collapsed ? (
                  <IconLayoutSidebarLeftExpand size={20} color="#15803d" />
                ) : (
                  <IconLayoutSidebarLeftCollapse size={20} color="#15803d" />
                )}
              </ActionIcon>
            </Tooltip>
          )}

          <Box>
            <Group gap="xs" align="center">
              <Text fw={700} size="md" c="dark.8">
                {title}
              </Text>
              <Badge size="xs" variant="light" color="vetGreen" radius="sm">
                {user?.role_details?.name || (user?.is_superuser ? 'Superadministrador' : 'Personal Veterinario')}
              </Badge>
            </Group>

            {breadcrumbs && breadcrumbs.length > 0 && (
              <Group gap={4} mt={2}>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    <Text size="xs" c={idx === breadcrumbs.length - 1 ? 'vetGreen.8' : 'dimmed'} fw={idx === breadcrumbs.length - 1 ? 600 : 400}>
                      {crumb.label}
                    </Text>
                    {idx < breadcrumbs.length - 1 && (
                      <Text size="xs" c="dimmed">/</Text>
                    )}
                  </React.Fragment>
                ))}
              </Group>
            )}
          </Box>
        </Group>

        {/* Right: Notifications Bell and User Profile Menu */}
        <Group gap="md">
          {/* Notifications Popover */}
          <Popover width={360} position="bottom-end" shadow="md" withArrow>
            <Popover.Target>
              <Indicator
                inline
                label={unreadCount > 0 ? unreadCount : undefined}
                size={16}
                color="vetGreen"
                disabled={unreadCount === 0}
              >
                <ActionIcon variant="light" color="gray" size="lg" radius="md">
                  <IconBell size={20} />
                </ActionIcon>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown p={0}>
              <Group justify="space-between" p="sm" bg="vetGreen.0">
                <Text fw={700} size="sm" c="vetGreen.9">Notificaciones</Text>
                {unreadCount > 0 && (
                  <UnstyledButton onClick={markAllAsRead}>
                    <Group gap={4}>
                      <IconChecks size={14} color="#16a34a" />
                      <Text size="xs" c="vetGreen.7" fw={600}>Marcar leídas</Text>
                    </Group>
                  </UnstyledButton>
                )}
              </Group>
              <Divider />
              <ScrollArea.Autosize mah={300} type="scroll">
                {recentNotifications.length === 0 ? (
                  <Box p="md" style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">No hay notificaciones recientes.</Text>
                  </Box>
                ) : (
                  <Stack gap={0}>
                    {recentNotifications.map((notif) => (
                      <Box
                        key={notif.id}
                        p="xs"
                        style={{
                          backgroundColor: notif.is_read ? 'transparent' : '#f0fdf4',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                        }}
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                      >
                        <Group align="flex-start" justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            {notif.notification_type === 'ERROR' ? (
                              <IconAlertTriangle size={16} color="red" />
                            ) : (
                              <IconFileCheck size={16} color="#16a34a" />
                            )}
                            <div>
                              <Text size="xs" fw={notif.is_read ? 500 : 700}>
                                {notif.title}
                              </Text>
                              <Text size="xs" c="dimmed" lineClamp={2}>
                                {notif.message}
                              </Text>
                              <Text size="10px" c="dimmed" mt={2}>
                                {notif.created_at}
                              </Text>
                            </div>
                          </Group>
                          {!notif.is_read && (
                            <Badge size="xs" color="vetGreen" variant="dot" />
                          )}
                        </Group>
                      </Box>
                    ))}
                  </Stack>
                )}
              </ScrollArea.Autosize>
            </Popover.Dropdown>
          </Popover>

          {/* User Profile Menu with exactly "Mi perfil" and "Cerrar sesión" */}
          <Menu shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton p={4} style={{ borderRadius: 8 }}>
                <Group gap="xs">
                  <Avatar
                    src={user?.avatar_display}
                    alt={user?.full_name}
                    radius="xl"
                    size="md"
                    color="vetGreen"
                  >
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Box visibleFrom="sm">
                    <Text size="sm" fw={600} lineClamp={1}>
                      {user?.full_name}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {user?.role_details?.name || (user?.is_superuser ? 'Superadministrador' : 'Usuario')}
                    </Text>
                  </Box>
                  <IconChevronDown size={14} color="#64748b" />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconUser size={16} />}
                onClick={() => setProfileModalOpened(true)}
              >
                Mi perfil
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={16} />}
                onClick={() => setLogoutModalOpened(true)}
              >
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </header>

      {/* Modals triggered directly from user menu */}
      <ProfileModal
        opened={profileModalOpened}
        onClose={() => setProfileModalOpened(false)}
      />

      <LogoutConfirmationModal
        opened={logoutModalOpened}
        onClose={() => setLogoutModalOpened(false)}
      />
    </>
  );
};
