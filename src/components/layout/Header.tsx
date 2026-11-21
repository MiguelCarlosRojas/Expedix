import React, { useState } from 'react';
import {
  Group, ActionIcon, Menu, Avatar, Text, Indicator, Popover, Stack, Badge, ScrollArea, Divider, UnstyledButton, Box
} from '@mantine/core';
import {
  IconBell, IconChevronDown, IconUser, IconLogout, IconCheck, IconChecks, IconFileCheck, IconAlertTriangle
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationsWebSocket } from '../../hooks/useNotificationsWebSocket';
import { ProfileModal } from './ProfileModal';
import { LogoutConfirmationModal } from './LogoutConfirmationModal';

interface HeaderProps {
  title: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const Header: React.FC<HeaderProps> = ({ title, breadcrumbs }) => {
  const { user } = useAuth();
  const { unreadCount, recentNotifications, markAsRead, markAllAsRead } = useNotificationsWebSocket();

  const [profileModalOpened, setProfileModalOpened] = useState(false);
  const [logoutModalOpened, setLogoutModalOpened] = useState(false);

  return (
    <>
      <header className="app-header" style={{ height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Title & Breadcrumbs */}
        <Box>
          <Text fw={700} size="lg" c="dark.8">
            {title}
          </Text>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Group gap={4}>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <Text size="xs" c={idx === breadcrumbs.length - 1 ? 'dark.5' : 'dimmed'} fw={idx === breadcrumbs.length - 1 ? 600 : 400}>
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

        {/* Right: Notifications Bell and User Profile Menu */}
        <Group gap="md">
          {/* Notifications Popover */}
          <Popover width={360} position="bottom-end" shadow="md" withArrow>
            <Popover.Target>
              <Indicator
                inline
                label={unreadCount > 0 ? unreadCount : undefined}
                size={16}
                color="red"
                disabled={unreadCount === 0}
              >
                <ActionIcon variant="light" color="gray" size="lg" radius="md">
                  <IconBell size={20} />
                </ActionIcon>
              </Indicator>
            </Popover.Target>
            <Popover.Dropdown p={0}>
              <Group justify="space-between" p="sm" bg="gray.0">
                <Text fw={700} size="sm">Notificaciones</Text>
                {unreadCount > 0 && (
                  <UnstyledButton onClick={markAllAsRead}>
                    <Group gap={4}>
                      <IconChecks size={14} color="#0b7285" />
                      <Text size="xs" c="enterpriseBlue.7" fw={600}>Marcar leídas</Text>
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
                          backgroundColor: notif.is_read ? 'transparent' : '#f0f9ff',
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
                              <IconFileCheck size={16} color="teal" />
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
                            <Badge size="xs" color="blue" variant="dot" />
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
                    color="enterpriseBlue"
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
