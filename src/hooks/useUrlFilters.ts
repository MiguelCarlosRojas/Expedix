import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

/**
 * Hook empresarial para gestión de filtros bidireccionales sincronizados con la URL
 * Permite agregar, remover, limpiar y persistir filtros sin recargar la página.
 */
export function useUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Obtener un filtro específico
  const getFilter = useCallback(
    (key: string, defaultValue = ''): string => {
      return searchParams.get(key) || defaultValue;
    },
    [searchParams]
  );

  // Modificar o agregar un filtro sin perder los parámetros existentes
  const setFilter = useCallback(
    (key: string, value: string | null | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === null || value === undefined || value.trim() === '') {
            next.delete(key);
          } else {
            next.set(key, value.trim());
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Modificar múltiples filtros a la vez
  const setFilters = useCallback(
    (filters: Record<string, string | null | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(filters).forEach(([key, value]) => {
            if (value === null || value === undefined || String(value).trim() === '') {
              next.delete(key);
            } else {
              next.set(key, String(value).trim());
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Limpiar todos los filtros (opcionalmente conservando algunos como tab)
  const clearFilters = useCallback(
    (preserveKeys: string[] = ['tab']) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams();
          preserveKeys.forEach((key) => {
            const val = prev.get(key);
            if (val) next.set(key, val);
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Diccionario con todos los filtros actuales
  const allFilters = useMemo(() => {
    const obj: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      obj[key] = val;
    });
    return obj;
  }, [searchParams]);

  return {
    getFilter,
    setFilter,
    setFilters,
    clearFilters,
    allFilters,
    searchParams,
  };
}
