import React, { useEffect, useState } from 'react';
import {
  SimpleGrid, Paper, Text, Group, ThemeIcon, Title, Stack, Box,
  Table, Badge, Card
} from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import {
  IconFileCheck, IconClock, IconLoader2, IconAlertCircle,
  IconTemplate, IconBrandGoogleDrive, IconUsers, IconCircleCheck,
  IconPaw
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { DashboardStats, DashboardCharts, IntegrationsStatus } from '../../types';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoaders';
import { CustomBadge } from '../../components/ui/CustomBadge';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationsStatus | null>(null);
  const [activity, setActivity] = useState<{ recent_operations: any[]; recent_audit: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, chartsRes, intRes, actRes] = await Promise.all([
        api.get<DashboardStats>('/dashboard/stats/'),
        api.get<DashboardCharts>('/dashboard/charts/'),
        api.get<IntegrationsStatus>('/dashboard/integrations/'),
        api.get<any>('/dashboard/activity/'),
      ]);
      setStats(statsRes.data);
      setCharts(chartsRes.data);
      setIntegrations(intRes.data);
      setActivity(actRes.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <Box className="anim-fade-in">
      {/* Encabezado Principal de Bienvenida con Identidad Expedix Vet */}
      <Paper
        p={{ base: 'lg', md: 'xl' }}
        radius="lg"
        mb="xl"
        style={{
          background: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #0d9488 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -4px rgba(6, 95, 70, 0.22)',
        }}
      >
        {/* Decoraciones vectoriales sutiles de fondo */}
        <Box
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(134, 239, 172, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          style={{
            position: 'absolute',
            bottom: -30,
            right: 120,
            width: 160,
            height: 160,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(94, 234, 212, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Group justify="space-between" align="center" wrap="nowrap" style={{ position: 'relative', zIndex: 1 }}>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Badge
              size="sm"
              variant="light"
              color="green"
              mb="xs"
              leftSection={<IconPaw size={13} color="#86efac" />}
              styles={{
                root: {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                },
              }}
            >
              Expedix Vet • Portal Clínico
            </Badge>
            <Title order={1} fw={900} style={{ fontSize: '2.1rem', lineHeight: 1.18, color: '#ffffff', marginBottom: 8 }}>
              Bienvenido a Expedix Vet
            </Title>
            <Text
              size="md"
              style={{
                color: '#d1fae5',
                lineHeight: 1.5,
                width: '100%',
              }}
            >
              Todo lo que necesitas para gestionar la atención y el bienestar animal desde un solo lugar.
            </Text>
          </Box>

          <Box visibleFrom="sm" style={{ opacity: 0.9, flexShrink: 0, marginLeft: 24 }}>
            <ThemeIcon
              size={76}
              radius="xl"
              variant="light"
              color="green"
              styles={{ root: { backgroundColor: 'rgba(255, 255, 255, 0.12)' } }}
            >
              <IconPaw size={44} color="#86efac" />
            </ThemeIcon>
          </Box>
        </Group>
      </Paper>

      {loading && <DashboardSkeleton />}

      {!loading && (
        <Stack gap="lg">
          {/* ================================================================ */}
          {/* 1. LAS 8 TARJETAS KPI PRINCIPALES                                 */}
          {/* ================================================================ */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Pacientes / Expedientes</Text>
                  <Text fw={800} size="xl" mt={4} c="dark.8">{stats?.total_expedientes ?? 0}</Text>
                  <Text size="11px" c="dimmed">Registros consolidados</Text>
                </div>
                <ThemeIcon color="vetGreen" size={46} radius="md" variant="light">
                  <IconPaw size={24} color="#16a34a" />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Generados / Certificados</Text>
                  <Text fw={800} size="xl" mt={4} c="vetGreen.7">{stats?.generados ?? 0}</Text>
                  <Text size="11px" c="dimmed">Con firma y PDF oficial</Text>
                </div>
                <ThemeIcon color="vetGreen" size={46} radius="md" variant="light">
                  <IconFileCheck size={24} color="#16a34a" />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Pendientes de Firma</Text>
                  <Text fw={800} size="xl" mt={4} c="yellow.8">{stats?.pendientes ?? 0}</Text>
                  <Text size="11px" c="dimmed">Esperando validación médica</Text>
                </div>
                <ThemeIcon color="yellow" size={46} radius="md" variant="light">
                  <IconClock size={24} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">En Compilación</Text>
                  <Text fw={800} size="xl" mt={4} c="blue.7">{stats?.en_proceso ?? 0}</Text>
                  <Text size="11px" c="dimmed">Procesando con ReportLab</Text>
                </div>
                <ThemeIcon color="cyan" size={46} radius="md" variant="light">
                  <IconLoader2 size={24} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Observaciones / Errores</Text>
                  <Text fw={800} size="xl" mt={4} c="red.7">{stats?.errores ?? 0}</Text>
                  <Text size="11px" c="dimmed">Requieren revisión clínica</Text>
                </div>
                <ThemeIcon color="red" size={46} radius="md" variant="light">
                  <IconAlertCircle size={24} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Plantillas Clínicas</Text>
                  <Text fw={800} size="xl" mt={4}>{stats?.plantillas_activas ?? 0}</Text>
                  <Text size="11px" c="dimmed">Formatos médicos activos</Text>
                </div>
                <ThemeIcon color="grape" size={46} radius="md" variant="light">
                  <IconTemplate size={24} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Carpetas en Drive</Text>
                  <Text fw={800} size="xl" mt={4}>{stats?.drives_conectados ?? 0}</Text>
                  <Text size="11px" c="dimmed">Google Drive sincronizado</Text>
                </div>
                <ThemeIcon color="green" size={46} radius="md" variant="light">
                  <IconBrandGoogleDrive size={24} />
                </ThemeIcon>
              </Group>
            </Paper>

            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={700} tt="uppercase">Personal Médico</Text>
                  <Text fw={800} size="xl" mt={4}>{stats?.usuarios_activos ?? 0}</Text>
                  <Text size="11px" c="dimmed">Veterinarios y auxiliares</Text>
                </div>
                <ThemeIcon color="teal" size={46} radius="md" variant="light">
                  <IconUsers size={24} />
                </ThemeIcon>
              </Group>
            </Paper>
          </SimpleGrid>

          {/* ================================================================ */}
          {/* 2. SECCIÓN DE GRÁFICOS ANALÍTICOS (MANTINE CHARTS)                */}
          {/* ================================================================ */}
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            {/* Gráfico 1: Documentos por mes */}
            <Card p="lg" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="sm">Evolución Mensual de Atención y Expedientes</Text>
                <Badge size="xs" color="vetGreen" variant="light">Tendencia Anual</Badge>
              </Group>
              <Text size="xs" c="dimmed" mb="md">Volumen histórico de documentos generados, pendientes y observados.</Text>
              <BarChart
                h={240}
                data={charts?.docs_by_month || []}
                dataKey="month"
                series={[
                  { name: 'generados', color: 'vetGreen.6', label: 'Generados' },
                  { name: 'pendientes', color: 'yellow.6', label: 'Pendientes' },
                  { name: 'errores', color: 'red.6', label: 'Errores' },
                ]}
                tickLine="y"
              />
            </Card>

            {/* Gráfico 2: Distribución de expedientes por estado */}
            <Card p="lg" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="sm">Distribución por Estado Clínico</Text>
                <Badge size="xs" color="gray" variant="outline">Porcentual</Badge>
              </Group>
              <Text size="xs" c="dimmed" mb="md">Proporción de expedientes en atención, culminados o en proceso.</Text>
              <Group justify="center" align="center" style={{ height: 240 }}>
                <DonutChart
                  size={190}
                  thickness={26}
                  data={charts?.expedientes_by_status || []}
                  withLabels
                  withTooltip
                />
              </Group>
            </Card>

            {/* Gráfico 3: Expedientes por tipo de plantilla */}
            <Card p="lg" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="sm">Documentos por Tipo de Plantilla Clínica</Text>
                <Badge size="xs" color="teal" variant="light">Formatos Médicos</Badge>
              </Group>
              <Text size="xs" c="dimmed" mb="md">Uso relativo de historias clínicas, actas y certificados de salud.</Text>
              <BarChart
                h={240}
                data={charts?.docs_by_template_type || []}
                dataKey="tipo"
                series={[{ name: 'total', color: 'vetGreen.6', label: 'Expedientes' }]}
              />
            </Card>

            {/* Gráfico 4: Productividad por usuario */}
            <Card p="lg" radius="md" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between" mb="xs">
                <Text fw={700} size="sm">Productividad del Personal Veterinario</Text>
                <Badge size="xs" color="indigo" variant="light">Equipo Clínico</Badge>
              </Group>
              <Text size="xs" c="dimmed" mb="md">Expedientes procesados y culminados por cada miembro del equipo.</Text>
              <BarChart
                h={240}
                data={charts?.user_productivity || []}
                dataKey="usuario"
                series={[
                  { name: 'procesados', color: 'indigo.6', label: 'Procesados' },
                  { name: 'generados', color: 'vetGreen.6', label: 'Generados' },
                ]}
              />
            </Card>
          </SimpleGrid>

          {/* ================================================================ */}
          {/* 3. ACTIVIDAD RECIENTE Y ESTADO DE INTEGRACIONES                   */}
          {/* ================================================================ */}
          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
            {/* Actividad Reciente */}
            <Box style={{ gridColumn: 'span 2' }}>
              <Paper p="lg" radius="md" withBorder bg="white" shadow="xs">
                <Group justify="space-between" mb="md">
                  <div>
                    <Text fw={700} size="sm">Últimos Expedientes Atendidos</Text>
                    <Text size="xs" c="dimmed">Trazabilidad en tiempo real de operaciones clínicas</Text>
                  </div>
                  <Badge size="sm" color="vetGreen" variant="light">En Vivo</Badge>
                </Group>

                <div className="vet-table-container">
                  <Table highlightOnHover withTableBorder={false}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>N° Expediente</Table.Th>
                        <Table.Th>Paciente / Asunto</Table.Th>
                        <Table.Th style={{ textAlign: 'center' }}>Estado</Table.Th>
                        <Table.Th>Fecha</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {(activity?.recent_operations || []).slice(0, 5).map((op, i) => (
                        <Table.Tr key={i}>
                          <Table.Td>
                            <Text fw={700} size="xs" c="vetGreen.8">{op.numero_expediente}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={500} lineClamp={1}>{op.asunto}</Text>
                          </Table.Td>
                          <Table.Td style={{ textAlign: 'center' }}>
                            <CustomBadge status={op.estado} />
                          </Table.Td>
                          <Table.Td>
                            <Text size="11px" c="dimmed">{op.updated_at ? op.updated_at.split('T')[0] : 'Hoy'}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </Paper>
            </Box>

            {/* Integraciones & Servicios */}
            <Paper p="lg" radius="md" withBorder bg="white" shadow="xs">
              <Text fw={700} size="sm" mb="xs">Estado de Infraestructura</Text>
              <Text size="xs" c="dimmed" mb="md">Servicios en nube y motores de compilación</Text>

              <Stack gap="md">
                <Paper p="sm" radius="md" withBorder bg="vetGreen.0" style={{ borderColor: '#bbf7d0' }}>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconCircleCheck size={18} color="#16a34a" />
                      <Text size="xs" fw={700} c="vetGreen.9">Google Drive API</Text>
                    </Group>
                    <Badge size="xs" color="green">Operativo</Badge>
                  </Group>
                </Paper>

                <Paper p="sm" radius="md" withBorder bg="vetGreen.0" style={{ borderColor: '#bbf7d0' }}>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconCircleCheck size={18} color="#16a34a" />
                      <Text size="xs" fw={700} c="vetGreen.9">Daphne ASGI WebSockets</Text>
                    </Group>
                    <Badge size="xs" color="green">Conectado</Badge>
                  </Group>
                </Paper>

                <Paper p="sm" radius="md" withBorder bg="vetGreen.0" style={{ borderColor: '#bbf7d0' }}>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconCircleCheck size={18} color="#16a34a" />
                      <Text size="xs" fw={700} c="vetGreen.9">ReportLab PDF Engine</Text>
                    </Group>
                    <Badge size="xs" color="green">Listo</Badge>
                  </Group>
                </Paper>

                <Paper p="sm" radius="md" withBorder bg="vetGreen.0" style={{ borderColor: '#bbf7d0' }}>
                  <Group justify="space-between">
                    <Group gap="xs">
                      <IconCircleCheck size={18} color="#16a34a" />
                      <Text size="xs" fw={700} c="vetGreen.9">PostgreSQL & Redis</Text>
                    </Group>
                    <Badge size="xs" color="green">Sincronizado</Badge>
                  </Group>
                </Paper>
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      )}
    </Box>
  );
};
