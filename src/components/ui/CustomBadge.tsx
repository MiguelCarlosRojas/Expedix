import React from 'react';
import { Badge, BadgeProps } from '@mantine/core';

export interface CustomBadgeProps extends BadgeProps {
  status: 'PENDIENTE' | 'EN_PROCESO' | 'GENERADO' | 'ERROR' | 'OBSERVADO' | string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  PENDIENTE: { color: 'yellow', label: 'Pendiente' },
  EN_PROCESO: { color: 'blue', label: 'En Proceso' },
  GENERADO: { color: 'teal', label: 'Generado' },
  ERROR: { color: 'red', label: 'Error' },
  OBSERVADO: { color: 'orange', label: 'Observado' },
};

export const CustomBadge: React.FC<CustomBadgeProps> = ({ status, children, ...props }) => {
  const config = statusConfig[status] || { color: 'gray', label: status };
  return (
    <Badge
      color={config.color}
      variant="light"
      radius="sm"
      size="sm"
      {...props}
    >
      {children || config.label}
    </Badge>
  );
};
