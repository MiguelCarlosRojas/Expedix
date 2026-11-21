import React from 'react';
import { Card, CardProps, Text, Group, Divider } from '@mantine/core';

export interface CustomCardProps extends CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const CustomCard: React.FC<CustomCardProps> = ({
  title,
  subtitle,
  action,
  children,
  ...props
}) => {
  return (
    <Card bg="white" {...props}>
      {(title || action) && (
        <>
          <Group justify="space-between" mb="xs">
            <div>
              {typeof title === 'string' ? (
                <Text fw={600} size="md" c="dark.7">
                  {title}
                </Text>
              ) : (
                title
              )}
              {subtitle && (
                <Text size="xs" c="dimmed">
                  {subtitle}
                </Text>
              )}
            </div>
            {action && <div>{action}</div>}
          </Group>
          <Divider mb="sm" color="gray.2" />
        </>
      )}
      {children}
    </Card>
  );
};
