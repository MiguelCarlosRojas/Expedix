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
        userSelect: 'none',
        backgroundColor: isSorted ? '#ecfdf5' : undefined,
        borderBottom: isSorted ? '2px solid #16a34a' : undefined,
      }}
      title={`Ordenar por ${typeof children === 'string' ? children : columnKey}`}
    >
      <Group
        justify={align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'space-between'}
        gap="xs"
        wrap="nowrap"
      >
        <Text
          size="xs"
          fw={isSorted ? 800 : 700}
          c={isSorted ? 'vetGreen.8' : 'gray.7'}
          style={{ letterSpacing: '0.02em', textTransform: 'uppercase' }}
        >
          {children}
        </Text>
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 2,
            borderRadius: 4,
            backgroundColor: isSorted ? '#dcfce7' : 'transparent',
          }}
        >
          {isAsc && <IconSortAscending size={15} color="#15803d" stroke={2.2} />}
          {isDesc && <IconSortDescending size={15} color="#15803d" stroke={2.2} />}
          {!isSorted && <IconArrowsSort size={14} color="#94a3b8" style={{ opacity: 0.6 }} />}
        </Box>
      </Group>
    </Table.Th>
  );
};
