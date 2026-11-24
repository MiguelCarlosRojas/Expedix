import React, { useState, useEffect } from 'react';
import {
  Modal, TextInput, Button, Group, Stack, Avatar, Text, Badge, Alert, LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconPaw } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';

interface ProfileModalProps {
  opened: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ opened, onClose }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      phone: '',
      avatar_url: '',
    },
    validate: {
      username: (val) => (val.trim().length < 3 ? 'El nombre de usuario debe tener al menos 3 caracteres.' : null),
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Correo electrónico no válido.'),
    },
  });

  useEffect(() => {
    if (user && opened) {
      form.setValues({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      });
      setErrorMsg(null);
    }
  }, [user, opened]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.put('/auth/profile/', values);
      if (res.data?.user) {
        updateUser(res.data.user);
        notifications.show({
          title: 'Perfil actualizado',
          message: 'Tus datos han sido actualizados en la base de datos.',
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
        onClose();
      }
    } catch (err: any) {
      const message = err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        'Error al guardar los cambios en el perfil.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPaw size={22} color="#16a34a" />
          <Text fw={700} size="lg">Mi Perfil Veterinario</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {errorMsg && (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
              {errorMsg}
            </Alert>
          )}

          {/* Header Info Banner */}
          <Group align="center" gap="md" p="sm" bg="vetGreen.0" style={{ borderRadius: 10, border: '1px solid #dcfce7' }}>
            <Avatar
              src={form.values.avatar_url || user?.avatar_display}
              size={64}
              radius="xl"
              color="vetGreen"
              style={{ border: '2px solid #bbf7d0' }}
            >
              {user?.username?.slice(0, 2).toUpperCase()}
            </Avatar>
            <Stack gap={2}>
              <Text fw={700} size="md" c="dark.8">{user?.full_name}</Text>
              <Group gap="xs">
                <Badge color="vetGreen" size="sm" variant="filled">
                  {user?.role_details?.name || (user?.is_superuser ? 'Superadministrador' : 'Personal Clínico')}
                </Badge>
                <Badge color={user?.is_active ? 'teal' : 'red'} size="sm" variant="light">
                  {user?.is_active ? 'Cuenta Activa' : 'Inactiva'}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                El rol y estado de la cuenta son gestionados por la administración clínica.
              </Text>
            </Stack>
          </Group>

          {/* Editable Fields */}
          <Group grow>
            <TextInput
              label="Nombres"
              placeholder="Nombres"
              {...form.getInputProps('first_name')}
            />
            <TextInput
              label="Apellidos"
              placeholder="Apellidos"
              {...form.getInputProps('last_name')}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Nombre de usuario"
              placeholder="username"
              required
              {...form.getInputProps('username')}
            />
            <TextInput
              label="Correo electrónico"
              placeholder="usuario@expedixvet.com"
              required
              {...form.getInputProps('email')}
            />
          </Group>

          <TextInput
            label="Teléfono de contacto"
            placeholder="+51 987 654 321"
            {...form.getInputProps('phone')}
          />

          <TextInput
            label="URL de Fotografía / Avatar"
            placeholder="https://..."
            {...form.getInputProps('avatar_url')}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="vetGreen"
              leftSection={<IconDeviceFloppy size={18} />}
              loading={loading}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                },
              }}
            >
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
