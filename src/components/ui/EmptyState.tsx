import React from 'react';
import { Paper, Stack, ThemeIcon, Title, Text, Button, Group } from '@mantine/core';
import { IconPaw, IconFileSearch, IconFilterOff, IconFolderPlus } from '@tabler/icons-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  isFilterEmpty?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No se encontraron registros',
  description = 'No hay datos disponibles para mostrar con los filtros seleccionados.',
  icon,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  isFilterEmpty = false,
}) => {
  return (
    <Paper
      p={{ base: 'xl', md: 44 }}
      radius="lg"
      withBorder
      bg="#ffffff"
      style={{
        textAlign: 'center',
        borderColor: '#e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
      className="anim-fade-in"
    >
      <Stack align="center" gap="xs" my="sm">
        <ThemeIcon
          size={74}
          radius="xl"
          color="vetGreen"
          variant="light"
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}
        >
          {icon || (isFilterEmpty ? <IconFileSearch size={38} color="#15803d" /> : <IconPaw size={38} color="#15803d" />)}
        </ThemeIcon>

        <Title order={3} fw={800} c="dark.8" mt="xs">
          {title}
        </Title>

        <Text size="sm" c="dimmed" maw={520} style={{ lineHeight: 1.6 }}>
          {description}
        </Text>

        <Group gap="sm" mt="md" wrap="wrap" justify="center">
          {isFilterEmpty && onSecondaryAction && (
            <Button
              variant="light"
              color="gray"
              size="sm"
              radius="md"
              onClick={onSecondaryAction}
              leftSection={<IconFilterOff size={16} />}
            >
              {secondaryActionText || 'Limpiar filtros'}
            </Button>
          )}

          {actionText && onAction && (
            <Button
              color="vetGreen"
              size="sm"
              radius="md"
              onClick={onAction}
              leftSection={<IconFolderPlus size={16} stroke={2} />}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                  fontWeight: 600,
                },
              }}
            >
              {actionText}
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
};
