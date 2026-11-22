import React from 'react';
import { Paper, Stack, ThemeIcon, Title, Text, Button } from '@mantine/core';
import { IconPaw, IconFileSearch } from '@tabler/icons-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No se encontraron registros',
  description = 'No hay datos disponibles para mostrar con los filtros seleccionados.',
  icon,
  actionText,
  onAction,
}) => {
  return (
    <Paper p="xl" radius="md" withBorder bg="white" style={{ textAlign: 'center' }}>
      <Stack align="center" gap="xs" my="md">
        <ThemeIcon size={64} radius="xl" color="vetGreen" variant="light">
          {icon || <IconPaw size={34} color="#16a34a" />}
        </ThemeIcon>
        <Title order={4} fw={700} c="dark.8" mt="xs">
          {title}
        </Title>
        <Text size="sm" c="dimmed" maw={440}>
          {description}
        </Text>
        {actionText && onAction && (
          <Button
            variant="light"
            color="vetGreen"
            size="sm"
            mt="md"
            onClick={onAction}
            leftSection={<IconFileSearch size={16} />}
          >
            {actionText}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};
