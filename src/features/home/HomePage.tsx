import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SimpleGrid, Card, Text, Group, ThemeIcon, Title, Box, Skeleton, Alert, Badge, Paper
} from '@mantine/core';
import {
  IconFolderPlus,
  IconFileSpark,
  IconFiles,
  IconTemplate,
  IconBrandGoogleDrive,
  IconReportAnalytics,
  IconBuildingStore,
  IconUsers,
  IconShieldLock,
  IconArrowRight,
  IconAlertCircle,
  IconPaw,
  IconStethoscope,
  IconFileCertificate,
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { ShortcutCard } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';

const iconMap: Record<string, React.ReactNode> = {
  IconFolderPlus: <IconFolderPlus size={24} color="#15803d" stroke={1.8} />,
  IconFileSpark: <IconFileSpark size={24} color="#15803d" stroke={1.8} />,
  IconFiles: <IconFiles size={24} color="#15803d" stroke={1.8} />,
  IconTemplate: <IconTemplate size={24} color="#15803d" stroke={1.8} />,
  IconBrandGoogleDrive: <IconBrandGoogleDrive size={24} color="#15803d" stroke={1.8} />,
  IconReportAnalytics: <IconReportAnalytics size={24} color="#15803d" stroke={1.8} />,
  IconBuildingSkyscraper: <IconBuildingStore size={24} color="#15803d" stroke={1.8} />,
  IconBuildingStore: <IconBuildingStore size={24} color="#15803d" stroke={1.8} />,
  IconUsers: <IconUsers size={24} color="#15803d" stroke={1.8} />,
  IconShieldLock: <IconShieldLock size={24} color="#15803d" stroke={1.8} />,
  IconPaw: <IconPaw size={24} color="#15803d" stroke={1.8} />,
  IconStethoscope: <IconStethoscope size={24} color="#15803d" stroke={1.8} />,
  IconFileCertificate: <IconFileCertificate size={24} color="#15803d" stroke={1.8} />,
};

export const HomePage: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<ShortcutCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShortcuts = async () => {
      try {
        const res = await api.get<{ shortcuts: ShortcutCard[] }>('/home/shortcuts/');
        setShortcuts(res.data.shortcuts || []);
      } catch (err: any) {
        setError('Error al consultar los accesos directos autorizados.');
      } finally {
        setLoading(false);
      }
    };
    fetchShortcuts();
  }, []);

  return (
    <Box className="anim-fade-in">
      {/* Encabezado Principal de Bienvenida con Identidad Expedix Vet */}
      <Paper
        p={{ base: 'lg', md: 'xl' }}
        radius="lg"
        mb="xl"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #0d9488 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -4px rgba(6, 95, 70, 0.22)',
        }}
      >
        {/* Decoraciones vectoriales sutiles de fondo */}
        <Box
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(134, 239, 172, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: -30,
            right: 120,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(94, 234, 212, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Group justify="space-between" align="center" wrap="nowrap" style={{ position: 'relative', zIndex: 1 }}>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Badge
              size="sm"
              variant="light"
              color="green"
              mb="xs"
              leftSection={<IconPaw size={13} color="#86efac" />}
              styles={{
                root: {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                },
              }}
            >
              Expedix Vet • Portal Clínico
            </Badge>
            <Title order={1} fw={900} style={{ fontSize: '2.1rem', lineHeight: 1.18, color: '#ffffff', marginBottom: 8 }}>
              Bienvenido a Expedix Vet
            </Title>
            <Text
              size="md"
              style={{
                color: '#d1fae5',
                lineHeight: 1.5,
                width: '100%',
              }}
            >
              Todo lo que necesitas para gestionar la atención y el bienestar animal desde un solo lugar.
            </Text>
          </Box>

          <Box visibleFrom="sm" style={{ opacity: 0.9, flexShrink: 0, marginLeft: 24 }}>
            <ThemeIcon
              size={76}
              radius="xl"
              variant="light"
              color="green"
              styles={{ root: { backgroundColor: 'rgba(255, 255, 255, 0.12)' } }}
            >
              <IconPaw size={44} color="#86efac" />
            </ThemeIcon>
          </Box>
        </Group>
      </Paper>

      {/* Manejo de Error */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Aviso" color="red" mb="lg" radius="md">
          {error}
        </Alert>
      )}

      {/* Cuadrícula Responsive de los Nueve Accesos Directos */}
      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton key={i} height={148} radius="md" />
          ))}
        </SimpleGrid>
      ) : shortcuts.length === 0 ? (
        <EmptyState
          title="No se encontraron accesos directos"
          description="No existen operaciones habilitadas para su perfil profesional."
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {shortcuts.map((card) => {
            const iconNode = iconMap[card.icon] || <IconPaw size={24} color="#15803d" stroke={1.8} />;
            return (
              <Card
                key={card.id}
                p="lg"
                radius="md"
                withBorder
                bg="white"
                className="interactive-card"
                onClick={() => navigate(card.path)}
                tabIndex={0}
                role="button"
                aria-label={card.title}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(card.path);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  minHeight: 154,
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <Group justify="space-between" align="center" mb="sm">
                    <ThemeIcon
                      size={46}
                      radius="md"
                      variant="light"
                      color="vetGreen"
                      style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #dcfce7',
                      }}
                    >
                      {iconNode}
                    </ThemeIcon>
                    <Box
                      className="card-arrow"
                      style={{
                        transition: 'transform 0.2s ease, color 0.2s ease',
                        color: '#94a3b8',
                      }}
                    >
                      <IconArrowRight size={18} />
                    </Box>
                  </Group>

                  <Text fw={700} size="md" c="dark.8" mb={4} style={{ lineHeight: 1.3 }}>
                    {card.title}
                  </Text>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.5, color: '#64748b' }}>
                    {card.description}
                  </Text>
                </div>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};
