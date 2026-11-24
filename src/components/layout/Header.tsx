import React, { useState } from 'react';
import {
  Group, ActionIcon, Menu, Avatar, Text, Indicator, Popover, Stack, Badge,
  ScrollArea, Divider, UnstyledButton, Box, Tooltip, ThemeIcon
} from '@mantine/core';
import {
  IconBell, IconChevronDown, IconUser, IconLogout, IconChecks, IconFileCheck,
  IconAlertTriangle, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand,
  IconShieldCheck, IconPaw
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationsWebSocket } from '../../hooks/useNotificationsWebSocket';
import { ProfileModal } from './ProfileModal';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';

interface HeaderProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggleCollapse }) => {
  const { user } = useAuth();
  const { unreadCount, recentNotifications, markAsRead, markAllAsRead } = useNotificationsWebSocket();

  const [profileModalOpened, setProfileModalOpened] = useState(false);
  const [logoutModalOpened, setLogoutModalOpened] = useState(false);

  const roleDisplayName = user?.role_details?.name || (user?.is_superuser ? 'Superadministrador' : 'Personal Clínico');

  return (
    <>
      <header
        className="app-header"
        style={{
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {/* Left: Sidebar Toggle Button ONLY */}
        <Group gap="sm" align="center">
          {onToggleCollapse && (
            <Tooltip
              label={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              withArrow
              position="bottom"
              withinPortal
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
        </Group>

        {/* Right: Notifications Bell and User Profile Menu */}
        <Group gap="sm">
          {/* Notifications Popover */}
          <Popover width={360} position="bottom-end" shadow="md" radius="md" withArrow withinPortal>
            <Popover.Target>
              <Indicator
                inline
                label={unreadCount > 0 ? unreadCount : undefined}
                size={16}
                color="vetGreen"
                disabled={unreadCount === 0}
                offset={4}
              >
                <ActionIcon
                  variant="light"
                  size="lg"
                  radius="md"
                  aria-label="Notificaciones"
                  style={{
                    backgroundColor: unreadCount > 0 ? '#f0fdf4' : '#f8fafc',
                    border: unreadCount > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                    color: unreadCount > 0 ? '#15803d' : '#64748b',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <IconBell size={19} />
                </ActionIcon>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown p={0} style={{ overflow: 'hidden' }}>
              <Group justify="space-between" p="sm" bg="vetGreen.0" style={{ borderBottom: '1px solid #dcfce7' }}>
                <Group gap="xs">
                  <IconPaw size={16} color="#15803d" />
                  <Text fw={700} size="sm" c="vetGreen.9">Notificaciones</Text>
                  {unreadCount > 0 && (
                    <Badge size="xs" color="vetGreen" variant="filled">
                      {unreadCount} nuevas
                    </Badge>
                  )}
                </Group>
                {unreadCount > 0 && (
                  <UnstyledButton onClick={markAllAsRead}>
                    <Group gap={4}>
                      <IconChecks size={14} color="#16a34a" />
                      <Text size="xs" c="vetGreen.8" fw={700}>Marcar leídas</Text>
                    </Group>
                  </UnstyledButton>
                )}
              </Group>

              <ScrollArea.Autosize mah={320} type="scroll">
                {recentNotifications.length === 0 ? (
                  <Box p="xl" style={{ textAlign: 'center' }}>
                    <ThemeIcon size={44} radius="xl" variant="light" color="vetGreen" mx="auto" mb="xs">
                      <IconBell size={22} color="#15803d" />
                    </ThemeIcon>
                    <Text fw={600} size="xs" c="dark.7">Bandeja al día</Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      No tienes notificaciones pendientes de atención clínica.
                    </Text>
                  </Box>
                ) : (
                  <Stack gap={0}>
                    {recentNotifications.map((notif) => (
                      <Box
                        key={notif.id}
                        p="xs"
                        style={{
                          backgroundColor: notif.is_read ? '#ffffff' : '#f0fdf4',
                          borderLeft: notif.is_read ? '3px solid transparent' : '3px solid #16a34a',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                      >
                        <Group align="flex-start" justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <Box mt={2}>
                              {notif.notification_type === 'ERROR' ? (
                                <IconAlertTriangle size={16} color="#dc2626" />
                              ) : (
                                <IconFileCheck size={16} color="#15803d" />
                              )}
                            </Box>
                            <div>
                              <Text size="xs" fw={notif.is_read ? 500 : 700} c="dark.8">
                                {notif.title}
                              </Text>
                              <Text size="xs" c="dimmed" lineClamp={2} mt={1}>
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

          {/* User Profile Menu */}
          <Menu shadow="md" width={240} position="bottom-end" radius="md" withinPortal>
            <Menu.Target>
              <UnstyledButton
                p="xs"
                style={{
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
              >
                <Group gap="xs" wrap="nowrap">
                  <Indicator
                    inline
                    size={9}
                    offset={2}
                    position="bottom-end"
                    color="#16a34a"
                    withBorder
                  >
                    <Avatar
                      src={user?.avatar_display}
                      alt={user?.full_name}
                      radius="xl"
                      size="sm"
                      color="vetGreen"
                      style={{ border: '1px solid #bbf7d0' }}
                    >
                      {user?.username?.slice(0, 2).toUpperCase()}
                    </Avatar>
                  </Indicator>

                  <Box visibleFrom="sm" style={{ textAlign: 'left', minWidth: 0 }}>
                    <Text size="xs" fw={700} c="dark.8" lineClamp={1}>
                      {user?.full_name}
                    </Text>
                    <Text size="11px" c="vetGreen.8" fw={600} lineClamp={1}>
                      {roleDisplayName}
                    </Text>
                  </Box>

                  <IconChevronDown size={14} color="#64748b" style={{ flexShrink: 0 }} />
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown p={0}>
              <Box p="sm" bg="gray.0" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <Group gap="xs">
                  <Avatar
                    src={user?.avatar_display}
                    alt={user?.full_name}
                    radius="xl"
                    size="md"
                    color="vetGreen"
                    style={{ border: '1px solid #bbf7d0' }}
                  >
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={700} size="xs" c="dark.8" lineClamp={1}>
                      {user?.full_name}
                    </Text>
                    <Text size="11px" c="dimmed" lineClamp={1}>
                      {user?.email || `@${user?.username}`}
                    </Text>
                    <Group gap={4} mt={2}>
                      <IconShieldCheck size={12} color="#15803d" />
                      <Text size="10px" fw={700} c="vetGreen.8">
                        {roleDisplayName}
                      </Text>
                    </Group>
                  </Box>
                </Group>
              </Box>

              <Box p={4}>
                <Menu.Item
                  leftSection={<IconUser size={16} color="#15803d" />}
                  onClick={() => setProfileModalOpened(true)}
                  style={{ fontWeight: 500 }}
                >
                  Mi perfil
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={() => setLogoutModalOpened(true)}
                  style={{ fontWeight: 500 }}
                >
                  Cerrar sesión
                </Menu.Item>
              </Box>
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
