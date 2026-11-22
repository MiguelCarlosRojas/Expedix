import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

/**
 * Hook reutilizable para ordenamiento universal de tablas (alfabético, numérico, fechas y estados)
 */
export function useSortableData<T extends Record<string, any>>(
  items: T[],
  defaultKey: string = '',
  defaultDir: SortDirection = null
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: defaultKey,
    direction: defaultDir,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return items;
    }

    const sortableItems = [...items];
    return sortableItems.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === null || aVal === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortConfig.direction === 'asc' ? -1 : 1;

      // 1. Comparación numérica
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum) && typeof aVal !== 'boolean' && typeof bVal !== 'boolean') {
        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // 2. Comparación de fechas
      const aDate = Date.parse(aVal);
      const bDate = Date.parse(bVal);
      if (!isNaN(aDate) && !isNaN(bDate) && typeof aVal === 'string' && (aVal.includes('-') || aVal.includes('/'))) {
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      // 3. Comparación de texto / alfabética (A-Z / Z-A)
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const res = aStr.localeCompare(bStr, 'es', { numeric: true, sensitivity: 'base' });
      return sortConfig.direction === 'asc' ? res : -res;
    });
  }, [items, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: '', direction: null };
        return { key, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const resetSort = () => {
    setSortConfig({ key: '', direction: null });
  };

  return { sortedData, sortConfig, requestSort, resetSort };
}
