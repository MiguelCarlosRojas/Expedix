import React from 'react';
import { Table, Group, Text, Box } from '@mantine/core';
import { IconArrowsSort, IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { SortConfig } from '../../hooks/useSortableData';

interface SortableThProps {
  children: React.ReactNode;
  columnKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
}

export const SortableTh: React.FC<SortableThProps> = ({
  children,
  columnKey,
  sortConfig,
  onSort,
  align = 'left',
  width,
}) => {
  const isSorted = sortConfig.key === columnKey && sortConfig.direction !== null;
  const isAsc = isSorted && sortConfig.direction === 'asc';
  const isDesc = isSorted && sortConfig.direction === 'desc';

  return (
    <Table.Th
      className={`sortable-th ${isSorted ? 'sortable-th-active' : ''}`}
      onClick={() => onSort(columnKey)}
      style={{
        textAlign: align,
        width: width,
        cursor: 'pointer',
      }}
      title={`Ordenar por ${typeof children === 'string' ? children : columnKey}`}
    >
      <Group
        justify={align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'space-between'}
        gap="xs"
        wrap="nowrap"
      >
        <Text size="xs" fw={700} c={isSorted ? 'vetGreen.8' : 'gray.7'} style={{ userSelect: 'none' }}>
          {children}
        </Text>
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          {isAsc && <IconSortAscending size={15} color="#16a34a" />}
          {isDesc && <IconSortDescending size={15} color="#16a34a" />}
          {!isSorted && <IconArrowsSort size={14} color="#94a3b8" style={{ opacity: 0.7 }} />}
        </Box>
      </Group>
    </Table.Th>
  );
};
