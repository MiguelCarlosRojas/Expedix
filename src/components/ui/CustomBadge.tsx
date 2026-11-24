import React from 'react';
import { Badge, BadgeProps } from '@mantine/core';
import {
  IconClock,
  IconLoader2,
  IconCircleCheck,
  IconAlertCircle,
  IconAlertTriangle,
} from '@tabler/icons-react';

export interface CustomBadgeProps extends Omit<BadgeProps, 'color'> {
  status: 'PENDIENTE' | 'EN_PROCESO' | 'GENERADO' | 'ERROR' | 'OBSERVADO' | 'ACTIVO' | 'INACTIVO' | string;
  color?: string;
  showIcon?: boolean;
}

interface StatusStyleConfig {
  bg: string;
  color: string;
  border: string;
  label: string;
  icon: React.ReactNode;
}

const statusConfig: Record<string, StatusStyleConfig> = {
  PENDIENTE: {
    bg: '#fef3c7',
    color: '#92400e',
    border: '#fde68a',
    label: 'Pendiente',
    icon: <IconClock size={12} stroke={2.2} />,
  },
  EN_PROCESO: {
    bg: '#e0f2fe',
    color: '#0369a1',
    border: '#bae6fd',
    label: 'En Proceso',
    icon: <IconLoader2 size={12} stroke={2.2} />,
  },
  GENERADO: {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    label: 'Generado',
    icon: <IconCircleCheck size={12} stroke={2.2} />,
  },
  ERROR: {
    bg: '#fee2e2',
    color: '#b91c1c',
    border: '#fecaca',
    label: 'Error',
    icon: <IconAlertCircle size={12} stroke={2.2} />,
  },
  OBSERVADO: {
    bg: '#ffedd5',
    color: '#c2410c',
    border: '#fed7aa',
    label: 'Observado',
    icon: <IconAlertTriangle size={12} stroke={2.2} />,
  },
  ACTIVO: {
    bg: '#dcfce7',
    color: '#15803d',
    border: '#bbf7d0',
    label: 'Activo',
    icon: <IconCircleCheck size={12} stroke={2.2} />,
  },
  INACTIVO: {
    bg: '#f1f5f9',
    color: '#64748b',
    border: '#e2e8f0',
    label: 'Inactivo',
    icon: <IconAlertCircle size={12} stroke={2.2} />,
  },
};

export const CustomBadge: React.FC<CustomBadgeProps> = ({
  status,
  children,
  showIcon = true,
  style,
  ...props
}) => {
  const normalizedKey = (status || '').toUpperCase();
  const config = statusConfig[normalizedKey] || {
    bg: '#f1f5f9',
    color: '#475569',
    border: '#e2e8f0',
    label: status || 'Desconocido',
    icon: null,
  };

  return (
    <Badge
      variant="filled"
      radius="md"
      size="sm"
      leftSection={showIcon && config.icon ? config.icon : undefined}
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontWeight: 600,
        letterSpacing: '0.02em',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        textTransform: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        ...style,
      }}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
};
