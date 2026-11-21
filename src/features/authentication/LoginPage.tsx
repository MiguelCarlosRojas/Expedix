import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Paper, Title, Text, TextInput, PasswordInput, Button,
  Checkbox, Group, Stack, Alert, Box, ThemeIcon
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconFileCertificate, IconAlertCircle, IconLock, IconUser } from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      username: 'admin',
      password: '',
      remember: true,
    },
    validate: {
      username: (val) => (val.trim() ? null : 'Ingrese su usuario o correo.'),
      password: (val) => (val ? null : 'Ingrese su contraseña.'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const ok = await login({ username: values.username, password: values.password });
      if (ok) {
        navigate('/app/inicio', { replace: true });
      } else {
        setErrorMessage('Credenciales inválidas. Por favor verifique su usuario y contraseña.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0b7285 0%, #1864ab 100%)',
        padding: 20,
      }}
    >
      <Container size={420} my={40}>
        <Paper radius="md" p={32} withBorder shadow="xl" bg="white">
          <Stack align="center" gap="xs" mb="lg">
            <ThemeIcon size={54} radius="md" color="enterpriseBlue" variant="light">
              <IconFileCertificate size={32} color="#0b7285" />
            </ThemeIcon>
            <Title order={2} ta="center" fw={800} c="dark.8">
              EXPEDIENTES PRO
            </Title>
            <Text c="dimmed" size="xs" ta="center" fw={500}>
              Sistema Empresarial de Gestión y Automatización de Expedientes Electrónicos
            </Text>
          </Stack>

          {errorMessage && (
            <Alert icon={<IconAlertCircle size={16} />} title="Atención" color="red" mb="md" radius="md">
              {errorMessage}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Usuario o Correo Institucional"
                placeholder="admin"
                required
                leftSection={<IconUser size={16} />}
                {...form.getInputProps('username')}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="Tu contraseña de acceso"
                required
                leftSection={<IconLock size={16} />}
                {...form.getInputProps('password')}
              />

              <Group justify="space-between" mt="xs">
                <Checkbox
                  label="Recordar sesión"
                  size="xs"
                  {...form.getInputProps('remember', { type: 'checkbox' })}
                />
                <Text size="xs" c="enterpriseBlue.7" style={{ cursor: 'pointer' }}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </Group>

              <Button
                type="submit"
                fullWidth
                mt="md"
                size="md"
                color="enterpriseBlue"
                loading={loading}
              >
                Iniciar sesión
              </Button>
            </Stack>
          </form>

          <Box mt="xl" pt="md" style={{ borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <Text size="xs" c="dimmed">
              Acceso restringido a personal autorizado.
            </Text>
            <Text size="11px" c="dimmed" mt={4}>
              Credenciales iniciales: <b>admin</b> / <b>admin123</b>
            </Text>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
