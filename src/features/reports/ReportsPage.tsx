import React, { useState, useEffect } from 'react';
import {
  Box, Tabs, Paper, Text, Group, Button, Table, Card, SimpleGrid,
  Title, Badge, ActionIcon, Loader, Divider, Stack
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
  IconReportAnalytics, IconFileSpreadsheet, IconFileTypePdf, IconFileText,
  IconRefresh, IconFilter
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { ReportData } from '../../types';
import { notifications } from '@mantine/notifications';

export const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string>('1');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);

      const res = await api.get<ReportData>(`/reports/${activeReport}/?${params.toString()}`);
      setReportData(res.data);
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo cargar el reporte.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, startDate, endDate]);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const params = new URLSearchParams();
    params.append('format', format);
    if (startDate) params.append('start_date', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('end_date', endDate.toISOString().split('T')[0]);

    window.open(`/api/v1/reports/${activeReport}/export/?${params.toString()}`, '_blank');
  };

  return (
    <Box>
      <Box mb="lg">
        <Title order={2} fw={800} c="dark.8">
          Centro de Reportes Ejecutivos
        </Title>
        <Text c="dimmed" size="sm">
          Auditoría analítica, rendimiento operativo y almacenamiento con exportación certificada.
        </Text>
      </Box>

      {/* Tabs for the EXACT 5 Reports */}
      <Tabs value={activeReport} onChange={(val) => setActiveReport(val || '1')}>
        <Tabs.List mb="md">
          <Tabs.Tab value="1">R1: Resumen General</Tabs.Tab>
          <Tabs.Tab value="2">R2: Documentos por Tipo</Tabs.Tab>
          <Tabs.Tab value="3">R3: Productividad de Usuarios</Tabs.Tab>
          <Tabs.Tab value="4">R4: Errores y Procesamiento</Tabs.Tab>
          <Tabs.Tab value="5">R5: Almacenamiento en Drive</Tabs.Tab>
        </Tabs.List>

        {/* Filter & Export Bar */}
        <Paper p="md" mb="md" withBorder radius="md" bg="white">
          <Group justify="space-between">
            <Group>
              <DateInput
                placeholder="Fecha inicial"
                size="sm"
                value={startDate}
                onChange={setStartDate}
                clearable
              />
              <DateInput
                placeholder="Fecha final"
                size="sm"
                value={endDate}
                onChange={setEndDate}
                clearable
              />
              <ActionIcon variant="light" color="gray" size="lg" onClick={fetchReport} title="Refrescar">
                <IconRefresh size={18} />
              </ActionIcon>
            </Group>

            <Group gap="xs">
              <Button
                size="xs"
                color="red"
                variant="light"
                leftSection={<IconFileTypePdf size={16} />}
                onClick={() => handleExport('pdf')}
              >
                Exportar PDF
              </Button>
              <Button
                size="xs"
                color="green"
                variant="light"
                leftSection={<IconFileSpreadsheet size={16} />}
                onClick={() => handleExport('excel')}
              >
                Exportar Excel (.xlsx)
              </Button>
              <Button
                size="xs"
                color="blue"
                variant="light"
                leftSection={<IconFileText size={16} />}
                onClick={() => handleExport('csv')}
              >
                Exportar CSV
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* Report Content */}
        {loading ? (
          <Paper p="xl" withBorder radius="md" bg="white" style={{ textAlign: 'center' }}>
            <Loader size="md" color="enterpriseBlue" />
            <Text size="sm" c="dimmed" mt="md">Compilando datos de PostgreSQL...</Text>
          </Paper>
        ) : (
          <Stack gap="md">
            {/* KPI Summary Cards if present */}
            {reportData?.kpis && (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }} spacing="sm">
                {Object.entries(reportData.kpis).map(([k, v]) => (
                  <Paper key={k} p="sm" withBorder radius="md" bg="white">
                    <Text size="10px" fw={700} c="dimmed" tt="uppercase">
                      {k.replace('_', ' ')}
                    </Text>
                    <Text size="lg" fw={800} mt={2} c="enterpriseBlue.8">
                      {typeof v === 'number' && k.includes('porcentaje') ? `${v}%` : String(v)}
                    </Text>
                  </Paper>
                ))}
              </SimpleGrid>
            )}

            {/* Main TanStack-like Report Table */}
            <Card p={0} radius="md" withBorder bg="white">
              <Box p="md" bg="gray.0" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <Text fw={700} size="sm" c="dark.8">
                  {reportData?.title}
                </Text>
              </Box>

              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead bg="gray.0">
                  <Table.Tr>
                    {(reportData?.headers || []).map((header, idx) => (
                      <Table.Th key={idx}>{header}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(!reportData?.table_data || reportData.table_data.length === 0) ? (
                    <Table.Tr>
                      <Table.Td colSpan={reportData?.headers.length || 1} style={{ textAlign: 'center', padding: 30 }}>
                        <Text size="sm" c="dimmed">No hay registros para el período seleccionado.</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    reportData.table_data.map((row, rIdx) => (
                      <Table.Tr key={rIdx}>
                        {Object.values(row).map((val: any, cIdx) => (
                          <Table.Td key={cIdx}>
                            <Text size="sm">{String(val)}</Text>
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Card>
          </Stack>
        )}
      </Tabs>
    </Box>
  );
};
