import React, { useState, useEffect } from 'react';
import {
  Modal, TextInput, Button, Group, Stack, Avatar, Text, Badge, Alert, LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconCheck, IconDeviceFloppy, IconUserCircle } from '@tabler/icons-react';
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
      job_title: '',
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
        job_title: user.job_title || '',
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
          <IconUserCircle size={22} color="#0b7285" />
          <Text fw={700} size="lg">Mi Perfil</Text>
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
          <Group align="center" gap="md" p="sm" bg="gray.0" style={{ borderRadius: 8 }}>
            <Avatar
              src={form.values.avatar_url || user?.avatar_display}
              size={64}
              radius="xl"
              color="enterpriseBlue"
            >
              {user?.username?.slice(0, 2).toUpperCase()}
            </Avatar>
            <Stack gap={2}>
              <Text fw={700} size="md">{user?.full_name}</Text>
              <Group gap="xs">
                <Badge color="enterpriseBlue" size="sm" variant="filled">
                  {user?.role_details?.name || (user?.is_superuser ? 'Superadministrador' : 'Usuario')}
                </Badge>
                <Badge color={user?.is_active ? 'teal' : 'red'} size="sm" variant="light">
                  {user?.is_active ? 'Cuenta Activa' : 'Inactiva'}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                El rol y estado de la cuenta solo pueden ser modificados por un administrador.
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
              placeholder="usuario@empresa.com"
              required
              {...form.getInputProps('email')}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Teléfono"
              placeholder="+51 987 654 321"
              {...form.getInputProps('phone')}
            />
            <TextInput
              label="Cargo / Posición"
              placeholder="Ej. Especialista en Operaciones"
              {...form.getInputProps('job_title')}
            />
          </Group>

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
              color="enterpriseBlue"
              leftSection={<IconDeviceFloppy size={18} />}
              loading={loading}
            >
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
