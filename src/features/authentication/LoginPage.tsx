import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Title, Text, TextInput, PasswordInput, Button,
  Checkbox, Group, Stack, ThemeIcon, Badge, Container
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconPaw, IconStethoscope, IconShieldCheck, IconHeartbeat,
  IconLock, IconUser, IconArrowRight, IconHeartHandshake, IconFileText
} from '@tabler/icons-react';
import { useAuth } from '../../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      username: 'admin',
      password: '',
      remember: true,
    },
    validate: {
      username: (val) => (val.trim() ? null : 'Ingrese su usuario.'),
      password: (val) => (val ? null : 'Ingrese su contraseña.'),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      const ok = await login({
        username: values.username,
        password: values.password,
        remember: values.remember,
      });
      if (ok) {
        navigate('/app/inicio', { replace: true });
      }
    } catch (err: any) {
      // Discretely handled via toast notifications
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        width: '100%',
        height: '100vh',
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {/* ==================================================================== */}
      {/* SECCIÓN IZQUIERDA: Composición Visual Animalista y Veterinaria       */}
      {/* ==================================================================== */}
      <Box
        visibleFrom="lg"
        style={{
          flex: '0 0 50%',
          width: '50%',
          height: '100vh',
          position: 'relative',
          background: 'linear-gradient(145deg, #064e3b 0%, #065f46 45%, #047857 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '44px 56px',
          color: '#ffffff',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
          {/* Patrón de huellas y círculos sutiles en el fondo */}
          <Box
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: -40,
              left: -40,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Header Brand */}
          <Box style={{ zIndex: 2 }}>
            <Group gap="sm">
              <ThemeIcon size={46} radius="md" color="white" variant="filled">
                <IconPaw size={28} color="#065f46" />
              </ThemeIcon>
              <div>
                <Title order={3} fw={900} style={{ letterSpacing: '0.8px', color: '#ffffff', lineHeight: 1.1 }}>
                  EXPEDIX <span style={{ color: '#86efac' }}>VET</span>
                </Title>
                <Text size="xs" fw={600} style={{ color: '#a7f3d0', letterSpacing: '1px' }}>
                  GESTIÓN Y SALUD ANIMAL
                </Text>
              </div>
            </Group>
          </Box>

          {/* Centro de la ilustración y mensaje principal */}
          <Box my="auto" py="xl" style={{ zIndex: 2 }} className="anim-fade-in">
            <Badge
              size="lg"
              variant="outline"
              color="green"
              mb="md"
              leftSection={<IconHeartHandshake size={16} />}
              styles={{
                root: {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  borderColor: 'rgba(134, 239, 172, 0.4)',
                  color: '#dcfce7',
                  paddingLeft: 12,
                  paddingRight: 14,
                },
              }}
            >
              Compromiso con el Cuidado & Bienestar Animal
            </Badge>

            <Title order={1} fw={900} style={{ fontSize: '2.5rem', lineHeight: 1.15, color: '#ffffff', marginBottom: 16 }}>
              Bienestar, Cuidado y Salud Animal en Cada Registro
            </Title>

            <Text size="md" style={{ color: '#d1fae5', maxWidth: 520, lineHeight: 1.6, marginBottom: 32 }}>
              La plataforma veterinaria empresarial diseñada para administrar historias clínicas, consentimientos informados,
              certificados de salud y expedientes electrónicos con rigor médico y amor por los animales.
            </Text>

            {/* Ilustración Vectorial Veterinaria con siluetas y huellas */}
            <Box
              p="lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 16,
                maxWidth: 520,
              }}
              className="anim-float"
            >
              <Group justify="space-between" align="center">
                <Group gap="md">
                  <ThemeIcon size={50} radius="xl" color="white" variant="filled">
                    <IconStethoscope size={28} color="#047857" />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="sm" c="white">
                      Historias Clínicas & Atención Veterinaria
                    </Text>
                    <Text size="xs" style={{ color: '#a7f3d0' }}>
                      Generación automatizada de certificados y trazabilidad médica
                    </Text>
                  </div>
                </Group>
                <ThemeIcon size={36} radius="xl" color="green.3" variant="light">
                  <IconShieldCheck size={20} color="#86efac" />
                </ThemeIcon>
              </Group>

              {/* Badges de características */}
              <Group gap="xs" mt="md">
                <Badge
                  size="sm"
                  variant="light"
                  color="green"
                  leftSection={<IconPaw size={13} color="#86efac" />}
                  styles={{ root: { backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff' } }}
                >
                  Caninos & Felinos
                </Badge>
                <Badge
                  size="sm"
                  variant="light"
                  color="green"
                  leftSection={<IconFileText size={13} color="#86efac" />}
                  styles={{ root: { backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff' } }}
                >
                  Consentimientos
                </Badge>
                <Badge
                  size="sm"
                  variant="light"
                  color="green"
                  leftSection={<IconShieldCheck size={13} color="#86efac" />}
                  styles={{ root: { backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff' } }}
                >
                  Trazabilidad Médica
                </Badge>
              </Group>
            </Box>
          </Box>

          {/* Footer de la columna izquierda */}
          <Box style={{ zIndex: 2 }}>
            <Group justify="space-between" align="center">
              <Text size="xs" style={{ color: '#a7f3d0' }}>
                © {new Date().getFullYear()} Expedix Vet • Sistema Profesional de Expedientes
              </Text>
              <Group gap="xs">
                <ThemeIcon size={24} radius="xl" color="green.9" variant="filled">
                  <IconHeartbeat size={14} color="#86efac" />
                </ThemeIcon>
                <Text size="xs" fw={600} style={{ color: '#86efac' }}>
                  Protección Animal
                </Text>
              </Group>
            </Group>
          </Box>
        </Box>

        {/* ==================================================================== */}
        {/* SECCIÓN DERECHA: Formulario de Autenticación                        */}
        {/* ==================================================================== */}
        <Box
          style={{
            flex: 1,
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '32px 24px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          <Container size={440} p={0} style={{ width: '100%' }} className="anim-fade-in">
            {/* Header móvil con logo si no se ve la columna izquierda */}
            <Box mb="xl" ta={{ base: 'center', lg: 'left' }}>
              <Group gap="xs" justify="flex-start" mb="xs">
                <ThemeIcon size={40} radius="md" color="vetGreen" variant="filled">
                  <IconPaw size={24} color="#ffffff" />
                </ThemeIcon>
                <div>
                  <Title order={3} fw={900} c="vetGreen.9" style={{ lineHeight: 1 }}>
                    EXPEDIX <span style={{ color: '#16a34a' }}>VET</span>
                  </Title>
                  <Text size="10px" fw={700} c="dimmed" style={{ letterSpacing: '0.8px' }}>
                    SISTEMA DE EXPEDIENTES VETERINARIOS
                  </Text>
                </div>
              </Group>

              <Title order={2} fw={800} c="dark.8" mt="lg">
                Iniciar Sesión
              </Title>
              <Text c="dimmed" size="sm" mt={4}>
                Ingrese sus credenciales para acceder al centro clínico y documental.
              </Text>
            </Box>

            <form onSubmit={form.onSubmit(handleSubmit)} autoComplete="on" method="post">
              <Stack gap="md">
                <TextInput
                  label="Usuario"
                  placeholder="admin"
                  required
                  size="md"
                  radius="md"
                  id="username"
                  name="username"
                  autoComplete="username"
                  leftSection={<IconUser size={18} color="#16a34a" />}
                  {...form.getInputProps('username')}
                />

                <PasswordInput
                  label="Contraseña"
                  placeholder="••••••••"
                  required
                  size="md"
                  radius="md"
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  leftSection={<IconLock size={18} color="#16a34a" />}
                  {...form.getInputProps('password')}
                />

                <Group justify="space-between" mt="xs">
                  <Checkbox
                    label="Recordar sesión en este equipo"
                    color="vetGreen"
                    size="sm"
                    {...form.getInputProps('remember', { type: 'checkbox' })}
                  />
                  <Text size="xs" c="vetGreen.7" fw={600} style={{ cursor: 'pointer' }}>
                    ¿Olvidó su contraseña?
                  </Text>
                </Group>

                <Button
                  type="submit"
                  fullWidth
                  mt="md"
                  size="md"
                  radius="md"
                  color="vetGreen"
                  loading={loading}
                  rightSection={<IconArrowRight size={18} />}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                    },
                  }}
                >
                  Acceder a Expedix Vet
                </Button>
              </Stack>
            </form>

            {/* Credenciales de demostración para facilidad de prueba */}
            <Paper p="md" mt="xl" radius="md" withBorder bg="vetGreen.0" style={{ borderColor: '#bbf7d0' }}>
              <Group gap="xs" mb={4}>
                <IconPaw size={16} color="#15803d" />
                <Text size="xs" fw={700} c="vetGreen.9">
                  Credenciales Preconfiguradas del Sistema
                </Text>
              </Group>
              <Text size="12px" c="vetGreen.8">
                Usuario: <b>admin</b> &nbsp;•&nbsp; Contraseña: <b>admin123</b> &nbsp;(Rol: Superadministrador)
              </Text>
            </Paper>
          </Container>
        </Box>
    </Box>
  );
};
