import React from 'react';
import { Alert, Button, Group, Text, Stack } from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error de conexión',
  message = 'Ocurrió un problema al consultar la información del servidor.',
  onRetry,
}) => {
  return (
    <Alert
      icon={<IconAlertTriangle size={20} />}
      title={title}
      color="red"
      radius="md"
      variant="light"
      my="md"
    >
      <Stack gap="xs">
        <Text size="sm">{message}</Text>
        {onRetry && (
          <Group mt="xs">
            <Button
              size="xs"
              variant="outline"
              color="red"
              leftSection={<IconRefresh size={14} />}
              onClick={onRetry}
            >
              Reintentar consulta
            </Button>
          </Group>
        )}
      </Stack>
    </Alert>
  );
};
