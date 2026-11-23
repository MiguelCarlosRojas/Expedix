import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SimpleGrid, Card, Text, Group, ThemeIcon, Title, Stack, Box, Skeleton, Alert, Badge,
  TextInput, Select, Paper, Button
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
  IconHeartbeat,
  IconSearch,
  IconFilterOff,
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { ShortcutCard } from '../../types';
import { CardSkeleton } from '../../components/ui/SkeletonLoaders';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { EmptyState } from '../../components/ui/EmptyState';

const iconMap: Record<string, React.ReactNode> = {
  IconFolderPlus: <IconFolderPlus size={26} />,
  IconFileSpark: <IconFileSpark size={26} />,
  IconFiles: <IconFiles size={26} />,
  IconTemplate: <IconTemplate size={26} />,
  IconBrandGoogleDrive: <IconBrandGoogleDrive size={26} />,
  IconReportAnalytics: <IconReportAnalytics size={26} />,
  IconBuildingSkyscraper: <IconBuildingStore size={26} />,
  IconBuildingStore: <IconBuildingStore size={26} />,
  IconUsers: <IconUsers size={26} />,
  IconShieldLock: <IconShieldLock size={26} />,
  IconPaw: <IconPaw size={26} />,
  IconStethoscope: <IconStethoscope size={26} />,
  IconFileCertificate: <IconFileCertificate size={26} />,
};

export const HomePage: React.FC = () => {
  const [shortcuts, setShortcuts] = useState<ShortcutCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { getFilter, setFilter, clearFilters } = useUrlFilters();
  const searchFilter = getFilter('search', '');
  const moduleFilter = getFilter('module', '');

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

  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter((s) => {
      const matchSearch =
        !searchFilter ||
        s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        s.description.toLowerCase().includes(searchFilter.toLowerCase());
      const matchModule = !moduleFilter || s.module === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [shortcuts, searchFilter, moduleFilter]);

  const hasActiveFilters = Boolean(searchFilter || moduleFilter);

  return (
    <Box className="anim-fade-in">
      {/* Header de Bienvenida con Identidad Veterinaria */}
      <Box mb="md">
        <Group gap="xs" mb={4}>
          <Badge color="vetGreen" variant="light" size="sm" leftSection={<IconPaw size={13} />}>
            Expedix Vet • Portal Clínico
          </Badge>
          <Badge color="gray" variant="outline" size="sm">
            Módulos Asignados por Rol
          </Badge>
        </Group>
        <Title order={2} fw={800} c="dark.8">
          Centro de Operaciones Veterinarias
        </Title>
        <Text c="dimmed" size="sm" mt={2}>
          Seleccione la operación que desea realizar. Se muestran únicamente las funciones habilitadas para su perfil profesional.
        </Text>
      </Box>

      {/* Barra de Filtros de Accesos Directos Sincronizada con URL */}
      <Paper p="sm" radius="md" withBorder bg="white" shadow="xs" mb="lg">
        <Group justify="space-between" wrap="wrap">
          <Group gap="sm" style={{ flex: 1, minWidth: 260 }}>
            <TextInput
              placeholder="Buscar acceso rápido o función clínica..."
              leftSection={<IconSearch size={16} color="#16a34a" />}
              value={searchFilter}
              onChange={(e) => setFilter('search', e.currentTarget.value)}
              style={{ flex: 1, minWidth: 220 }}
              size="xs"
              radius="md"
            />
            <Select
              placeholder="Todos los módulos"
              data={[
                { value: '', label: 'Todos los módulos' },
                { value: 'documentos', label: 'Documentos & Historias' },
                { value: 'drives', label: 'Google Drive & Univer' },
                { value: 'reportes', label: 'Centro de Reportes' },
                { value: 'administracion', label: 'Administración' },
              ]}
              value={moduleFilter}
              onChange={(val) => setFilter('module', val || '')}
              clearable
              size="xs"
              radius="md"
              style={{ width: 190 }}
            />
            {hasActiveFilters && (
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconFilterOff size={14} />}
                onClick={() => clearFilters()}
              >
                Limpiar
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Aviso" color="red" mb="lg" radius="md">
          {error}
        </Alert>
      )}

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton key={i} height={140} radius="md" />
          ))}
        </SimpleGrid>
      ) : filteredShortcuts.length === 0 ? (
        <EmptyState
          title="No se encontraron accesos directos"
          description="No existen operaciones que coincidan con los filtros seleccionados."
          actionText="Restablecer Filtros"
          onAction={() => clearFilters()}
        />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {filteredShortcuts.map((card) => {
            const iconNode = iconMap[card.icon] || <IconPaw size={26} />;
            return (
              <Card
                key={card.id}
                p="lg"
                radius="md"
                withBorder
                bg="white"
                className="interactive-card"
                style={{
                  cursor: 'pointer',
                  border: '1px solid #e2e8f0',
                }}
                onClick={() => navigate(card.path)}
              >
                <Group justify="space-between" align="flex-start" mb="sm">
                  <ThemeIcon
                    size={50}
                    radius="md"
                    color={card.color === 'blue' ? 'vetGreen' : card.color || 'vetGreen'}
                    variant="light"
                  >
                    {iconNode}
                  </ThemeIcon>
                  <ThemeIcon size={28} radius="xl" variant="subtle" color="gray">
                    <IconArrowRight size={16} />
                  </ThemeIcon>
                </Group>

                <Text fw={700} size="md" c="dark.8" mb={4}>
                  {card.title}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={2} style={{ minHeight: 32 }}>
                  {card.description}
                </Text>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
};
