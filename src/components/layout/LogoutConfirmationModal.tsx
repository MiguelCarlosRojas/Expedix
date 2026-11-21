import React, { useState } from 'react';
import { Modal, Text, Group, Button, Stack, ThemeIcon } from '@mantine/core';
import { IconLogout, IconAlertTriangle } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';

interface LogoutConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
}

export const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  opened,
  onClose,
}) => {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConfirmLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="red" variant="light" size="md">
            <IconLogout size={18} />
          </ThemeIcon>
          <Text fw={700} size="md">¿Cerrar sesión?</Text>
        </Group>
      }
      centered
      size="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que iniciar sesión nuevamente para acceder al sistema.
        </Text>

        <Group justify="flex-end" mt="md" gap="sm">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            color="red"
            onClick={handleConfirmLogout}
            loading={loading}
            leftSection={<IconLogout size={16} />}
          >
            Sí, cerrar sesión
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
