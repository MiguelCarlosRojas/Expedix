import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SimpleGrid, Card, Text, Group, ThemeIcon, Title, Stack, Box, Skeleton, Alert
} from '@mantine/core';
import {
  IconFolderPlus,
  IconFileSpark,
  IconFiles,
  IconTemplate,
  IconBrandGoogleDrive,
  IconReportAnalytics,
  IconBuildingSkyscraper,
  IconUsers,
  IconShieldLock,
  IconArrowRight,
  IconAlertCircle,
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { ShortcutCard } from '../../types';

const iconMap: Record<string, React.ReactNode> = {
  IconFolderPlus: <IconFolderPlus size={28} />,
  IconFileSpark: <IconFileSpark size={28} />,
  IconFiles: <IconFiles size={28} />,
  IconTemplate: <IconTemplate size={28} />,
  IconBrandGoogleDrive: <IconBrandGoogleDrive size={28} />,
  IconReportAnalytics: <IconReportAnalytics size={28} />,
  IconBuildingSkyscraper: <IconBuildingSkyscraper size={28} />,
  IconUsers: <IconUsers size={28} />,
  IconShieldLock: <IconShieldLock size={28} />,
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
        setError('Error al cargar los accesos directos disponibles.');
      } finally {
        setLoading(false);
      }
    };
    fetchShortcuts();
  }, []);

  return (
    <Box>
      {/* Page Title & Context */}
      <Box mb="xl">
        <Title order={2} fw={800} c="dark.8">
          Centro de Operaciones y Accesos Directos
        </Title>
        <Text c="dimmed" size="sm">
          Seleccione la operación que desea realizar. Se muestran únicamente las acciones permitidas según su perfil.
        </Text>
      </Box>

      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Aviso" color="red" mb="lg">
          {error}
        </Alert>
      )}

      {loading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <Skeleton key={i} height={140} radius="md" />
          ))}
        </SimpleGrid>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {shortcuts.map((card) => (
            <Card
              key={card.id}
              p="lg"
              radius="md"
              withBorder
              bg="white"
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid #e2e8f0',
              }}
              className="shortcut-card"
              onClick={() => navigate(card.path)}
            >
              <Group justify="space-between" align="flex-start" mb="sm">
                <ThemeIcon
                  size={52}
                  radius="md"
                  color={card.color || 'blue'}
                  variant="light"
                >
                  {iconMap[card.icon] || <IconFiles size={28} />}
                </ThemeIcon>
                <ThemeIcon size={28} radius="xl" variant="subtle" color="gray">
                  <IconArrowRight size={16} />
                </ThemeIcon>
              </Group>

              <Text fw={700} size="md" c="dark.8" mb={4}>
                {card.title}
              </Text>

              <Text size="xs" c="dimmed" lineClamp={2} style={{ lineHeight: 1.5 }}>
                {card.description}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};
