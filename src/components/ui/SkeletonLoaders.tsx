import React from 'react';
import { Table, Skeleton, Paper, SimpleGrid, Group, Stack, Box } from '@mantine/core';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 6 }) => {
  return (
    <Table highlightOnHover withTableBorder withColumnBorders style={{ backgroundColor: '#ffffff' }}>
      <Table.Thead bg="gray.0">
        <Table.Tr>
          {Array.from({ length: columns }).map((_, i) => (
            <Table.Th key={i} p="sm">
              <Skeleton height={14} width="70%" radius="sm" />
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <Table.Tr key={r}>
            {Array.from({ length: columns }).map((_, c) => (
              <Table.Td key={c} p="sm">
                <Skeleton height={14} width={c === 0 ? '45%' : c === 1 ? '85%' : '65%'} radius="sm" />
              </Table.Td>
            ))}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: count }} spacing="md">
      {Array.from({ length: count }).map((_, i) => (
        <Paper key={i} p="lg" radius="md" withBorder bg="white">
          <Group justify="space-between" mb="xs">
            <Skeleton height={12} width="50%" radius="sm" />
            <Skeleton height={38} width={38} radius="md" />
          </Group>
          <Skeleton height={28} width="35%" radius="sm" mt="sm" />
          <Skeleton height={10} width="70%" radius="sm" mt="xs" />
        </Paper>
      ))}
    </SimpleGrid>
  );
};

export const ReportSkeleton: React.FC = () => {
  return (
    <Stack gap="md">
      <Paper p="md" radius="md" withBorder bg="white">
        <Group justify="space-between">
          <Group>
            <Skeleton height={36} width={160} radius="md" />
            <Skeleton height={36} width={160} radius="md" />
            <Skeleton height={36} width={40} radius="md" />
          </Group>
          <Group>
            <Skeleton height={32} width={80} radius="md" />
            <Skeleton height={32} width={80} radius="md" />
            <Skeleton height={32} width={80} radius="md" />
          </Group>
        </Group>
      </Paper>
      <CardSkeleton count={4} />
      <Paper p="md" radius="md" withBorder bg="white">
        <TableSkeleton rows={6} columns={5} />
      </Paper>
    </Stack>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <Stack gap="lg">
      <CardSkeleton count={4} />
      <CardSkeleton count={4} />
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        <Paper p="lg" radius="md" withBorder bg="white">
          <Skeleton height={20} width="40%" radius="sm" mb="md" />
          <Skeleton height={240} radius="md" />
        </Paper>
        <Paper p="lg" radius="md" withBorder bg="white">
          <Skeleton height={20} width="40%" radius="sm" mb="md" />
          <Skeleton height={240} radius="md" />
        </Paper>
      </SimpleGrid>
      <Paper p="md" radius="md" withBorder bg="white">
        <Skeleton height={20} width="30%" radius="sm" mb="md" />
        <TableSkeleton rows={4} columns={5} />
      </Paper>
    </Stack>
  );
};
