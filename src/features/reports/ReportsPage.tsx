import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Paper, Text, Group, Button, Table, Card, SimpleGrid,
  Title, Badge, ActionIcon, Stack, Tooltip, Alert
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconReportAnalytics, IconFileSpreadsheet, IconFileTypePdf, IconFileText,
  IconRefresh, IconPaw, IconStethoscope, IconUsers, IconAlertTriangle,
  IconCloudCheck, IconFilterOff, IconCalendar
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { ReportData } from '../../types';
import { notifications } from '@mantine/notifications';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useSortableData } from '../../hooks/useSortableData';
import { SortableTh } from '../../components/ui/SortableTh';
import { ReportSkeleton } from '../../components/ui/SkeletonLoaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

const REPORT_INFO: Record<string, { title: string; subtitle: string; icon: React.ReactNode; badge: string }> = {
  '1': {
    title: 'Reporte 1: Resumen General de Pacientes y Expedientes',
    subtitle: 'Consolidado analítico de expedientes clínicos emitidos, tasas de éxito y evolución temporal.',
    icon: <IconReportAnalytics size={26} color="#16a34a" />,
    badge: 'Métricas Globales',
  },
  '2': {
    title: 'Reporte 2: Documentos por Tipo de Plantilla Veterinaria',
    subtitle: 'Distribución y tiempos promedio de generación para historias clínicas, recetas y consentimientos.',
    icon: <IconFileSpreadsheet size={26} color="#16a34a" />,
    badge: 'Plantillas Clínicas',
  },
  '3': {
    title: 'Reporte 3: Productividad del Personal Veterinario',
    subtitle: 'Métricas de expedientes procesados, operaciones auditadas y última actividad de veterinarios y auxiliares.',
    icon: <IconUsers size={26} color="#16a34a" />,
    badge: 'Equipo Médico',
  },
  '4': {
    title: 'Reporte 4: Trazabilidad, Observaciones y Errores',
    subtitle: 'Auditoría exhaustiva de reintentos, tiempos de ejecución y observaciones en el flujo documental.',
    icon: <IconAlertTriangle size={26} color="#d97706" />,
    badge: 'Control de Calidad',
  },
  '5': {
    title: 'Reporte 5: Almacenamiento en Google Drive',
    subtitle: 'Capacidad utilizada, conteo de PDFs clínicos generados y distribución por carpetas en la nube.',
    icon: <IconCloudCheck size={26} color="#0f766e" />,
    badge: 'Almacenamiento Cloud',
  },
};

export const ReportsPage: React.FC = () => {
  const { reportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();
  const { getFilter, setFilter, setFilters, clearFilters } = useUrlFilters();

  const activeReport = reportId || getFilter('tipo', '1');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros sincronizados con URL Query Parameters
  const startDateStr = getFilter('start_date', '');
  const endDateStr = getFilter('end_date', '');

  const startDate = startDateStr ? new Date(startDateStr) : null;
  const endDate = endDateStr ? new Date(endDateStr) : null;

  // Carga del reporte específico desde el backend
  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (startDateStr) params.append('start_date', startDateStr);
      if (endDateStr) params.append('end_date', endDateStr);

      const res = await api.get<ReportData>(`/reports/${activeReport}/?${params.toString()}`);
      setReportData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'No se pudo cargar la información del reporte seleccionado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDateStr, endDateStr]);

  const handleTabChange = (val: string | null) => {
    const nextReport = val || '1';
    navigate(`/app/reportes/${nextReport}`);
    setFilter('tipo', nextReport);
  };

  const handleDateChange = (field: 'start_date' | 'end_date', date: Date | null) => {
    const formatted = date ? date.toISOString().split('T')[0] : '';
    setFilter(field, formatted);
  };

  const handleClearFilters = () => {
    clearFilters(['tipo']);
  };

  // Exportaciones hacia el backend oficial
  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const params = new URLSearchParams();
    params.append('format', format);
    if (startDateStr) params.append('start_date', startDateStr);
    if (endDateStr) params.append('end_date', endDateStr);

    window.open(`/api/v1/reports/${activeReport}/export/?${params.toString()}`, '_blank');
  };

  // Ordenamiento universal de todas las columnas mediante useSortableData
  const rawTableData = (reportData?.table_data || []) as Record<string, any>[];
  const { sortedData, sortConfig, requestSort } = useSortableData(rawTableData);

  const reportMeta = REPORT_INFO[activeReport] || REPORT_INFO['1'];

  return (
    <Box className="anim-fade-in">
      {/* Header Contextual del Centro de Reportes */}
      <Box mb="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs" mb={4}>
              <Badge color="vetGreen" variant="light" size="sm">
                Auditoría Veterinaria Certificada
              </Badge>
              <Badge color="gray" variant="outline" size="sm">
                {reportMeta.badge}
              </Badge>
            </Group>
            <Title order={2} fw={800} c="dark.8">
              {reportMeta.title}
            </Title>
            <Text c="dimmed" size="sm" mt={2}>
              {reportMeta.subtitle}
            </Text>
          </div>

          <Group gap="xs">
            <Button
              size="xs"
              variant="outline"
              color="red"
              leftSection={<IconFileTypePdf size={16} />}
              onClick={() => handleExport('pdf')}
              title="Descargar versión PDF certificada"
            >
              PDF
            </Button>
            <Button
              size="xs"
              variant="outline"
              color="vetGreen"
              leftSection={<IconFileSpreadsheet size={16} />}
              onClick={() => handleExport('excel')}
              title="Descargar libro Excel profesional"
            >
              Excel
            </Button>
            <Button
              size="xs"
              variant="outline"
              color="blue"
              leftSection={<IconFileText size={16} />}
              onClick={() => handleExport('csv')}
              title="Descargar archivo plano CSV"
            >
              CSV
            </Button>
          </Group>
        </Group>
      </Box>

      {/* Tabs para los CINCO Reportes Independientes */}
      <Tabs value={activeReport} onChange={handleTabChange} mb="md">
        <Tabs.List>
          <Tabs.Tab value="1" leftSection={<IconReportAnalytics size={16} />}>
            R1: Resumen General
          </Tabs.Tab>
          <Tabs.Tab value="2" leftSection={<IconFileSpreadsheet size={16} />}>
            R2: Por Tipo de Plantilla
          </Tabs.Tab>
          <Tabs.Tab value="3" leftSection={<IconUsers size={16} />}>
            R3: Productividad Médica
          </Tabs.Tab>
          <Tabs.Tab value="4" leftSection={<IconAlertTriangle size={16} />}>
            R4: Trazabilidad & Errores
          </Tabs.Tab>
          <Tabs.Tab value="5" leftSection={<IconCloudCheck size={16} />}>
            R5: Almacenamiento Drive
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* Barra de Filtros Sincronizada con Query Params de la URL */}
      <Paper p="md" mb="md" withBorder radius="md" bg="white" shadow="xs">
        <Group justify="space-between" wrap="wrap">
          <Group gap="sm">
            <DateInput
              placeholder="Fecha inicial (desde)"
              size="sm"
              value={startDate}
              onChange={(d) => handleDateChange('start_date', d)}
              clearable
              leftSection={<IconCalendar size={16} color="#16a34a" />}
            />
            <DateInput
              placeholder="Fecha final (hasta)"
              size="sm"
              value={endDate}
              onChange={(d) => handleDateChange('end_date', d)}
              clearable
              leftSection={<IconCalendar size={16} color="#16a34a" />}
            />
            <ActionIcon
              variant="light"
              color="vetGreen"
              size="lg"
              onClick={fetchReport}
              title="Actualizar datos"
            >
              <IconRefresh size={18} />
            </ActionIcon>
            {(startDateStr || endDateStr) && (
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                leftSection={<IconFilterOff size={14} />}
                onClick={handleClearFilters}
              >
                Limpiar filtros
              </Button>
            )}
          </Group>

          <Text size="xs" c="dimmed">
            {reportData?.table_data?.length || 0} registros analizados
          </Text>
        </Group>
      </Paper>

      {/* Vista de Estado: Error, Skeleton o Contenido Real */}
      {error && <ErrorState message={error} onRetry={fetchReport} />}

      {loading && !error && <ReportSkeleton />}

      {!loading && !error && reportData && (
        <Stack gap="lg">
          {/* Tarjetas KPI si el reporte las incluye */}
          {reportData.kpis && (
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
              {Object.entries(reportData.kpis).map(([key, val]) => (
                <Paper key={key} p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                    {key.replace(/_/g, ' ')}
                  </Text>
                  <Text fw={800} size="xl" mt={4} c={key.includes('error') ? 'red.7' : 'vetGreen.8'}>
                    {typeof val === 'number' && key.includes('porcentaje') ? `${val}%` : val}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
          )}

          {/* Tabla de Resultados con Ordenamiento en TODAS las Columnas */}
          <Paper p="md" radius="md" withBorder bg="white" shadow="xs" style={{ overflowX: 'auto' }}>
            {sortedData.length === 0 ? (
              <EmptyState
                title="Sin datos para el período"
                description="No se registraron movimientos en el rango de fechas seleccionado."
                actionText="Restablecer fechas"
                onAction={handleClearFilters}
              />
            ) : (
              <Table highlightOnHover withTableBorder withColumnBorders>
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    {reportData.headers.map((header, idx) => {
                      const sampleRow = sortedData[0] || {};
                      const rowKeys = Object.keys(sampleRow);
                      const columnKey = rowKeys[idx] || String(idx);

                      return (
                        <SortableTh
                          key={columnKey}
                          columnKey={columnKey}
                          sortConfig={sortConfig}
                          onSort={requestSort}
                        >
                          {header}
                        </SortableTh>
                      );
                    })}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedData.map((row, rIdx) => (
                    <Table.Tr key={rIdx}>
                      {Object.values(row).map((val: any, cIdx) => (
                        <Table.Td key={cIdx} p="sm">
                          <Text size="sm" c="dark.7">
                            {typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val ?? '')}
                          </Text>
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
};
