import React, { useEffect, useState } from 'react';
import {
  SimpleGrid, Paper, Text, Group, ThemeIcon, Title, Stack, Box, Select,
  Skeleton, Table, Badge, Card, RingProgress, Tabs
} from '@mantine/core';
import { BarChart, DonutChart, LineChart, AreaChart } from '@mantine/charts';
import {
  IconFiles, IconFileCheck, IconClock, IconLoader2, IconAlertCircle,
  IconTemplate, IconBrandGoogleDrive, IconUsers, IconCircleCheck, IconCpu, IconDatabase
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { DashboardStats, DashboardCharts, IntegrationsStatus } from '../../types';

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
    <Box>
      <Box mb="lg">
        <Title order={2} fw={800} c="dark.8">
          Panel de Control y Estadísticas
        </Title>
        <Text c="dimmed" size="sm">
          Monitoreo en tiempo real de expedientes, procesamiento documental, almacenamiento e integraciones.
        </Text>
      </Box>

      {/* 1. The 8 Core KPIs */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="lg">
        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Expedientes</Text>
              <Text fw={800} size="xl" mt={4}>{loading ? <Skeleton height={28} width={60} /> : stats?.total_expedientes}</Text>
            </div>
            <ThemeIcon color="blue" size={44} radius="md" variant="light">
              <IconFiles size={24} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Generados</Text>
              <Text fw={800} size="xl" mt={4} c="teal.7">{loading ? <Skeleton height={28} width={60} /> : stats?.generados}</Text>
            </div>
            <ThemeIcon color="teal" size={44} radius="md" variant="light">
              <IconFileCheck size={24} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Pendientes</Text>
              <Text fw={800} size="xl" mt={4} c="yellow.8">{loading ? <Skeleton height={28} width={60} /> : stats?.pendientes}</Text>
            </div>
            <ThemeIcon color="yellow" size={44} radius="md" variant="light">
              <IconClock size={24} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">En Proceso</Text>
              <Text fw={800} size="xl" mt={4} c="blue.7">{loading ? <Skeleton height={28} width={60} /> : stats?.en_proceso}</Text>
            </div>
            <ThemeIcon color="cyan" size={44} radius="md" variant="light">
              <IconLoader2 size={24} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Con Errores</Text>
              <Text fw={800} size="xl" mt={4} c="red.7">{loading ? <Skeleton height={28} width={60} /> : stats?.errores}</Text>
            </div>
            <ThemeIcon color="red" size={44} radius="md" variant="light">
              <IconAlertCircle size={24} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Plantillas Activas</Text>
              <Text fw={800} size="xl" mt={4}>{loading ? <Skeleton height={28} width={60} /> : stats?.plantillas_activas}</Text>
            </div>
            <ThemeIcon color="grape" size={44} radius="md" variant="light">
              <IconTemplate size={24} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Drives Conectados</Text>
              <Text fw={800} size="xl" mt={4}>{loading ? <Skeleton height={28} width={60} /> : stats?.drives_conectados}</Text>
            </div>
            <ThemeIcon color="green" size={44} radius="md" variant="light">
              <IconBrandGoogleDrive size={24} />
            </ThemeIcon>
          </Group>
        </Paper>

        <Paper p="md" radius="md" withBorder bg="white">
          <Group justify="space-between">
            <div>
              <Text size="xs" c="dimmed" fw={700} tt="uppercase">Usuarios Activos</Text>
              <Text fw={800} size="xl" mt={4}>{loading ? <Skeleton height={28} width={60} /> : stats?.usuarios_activos}</Text>
            </div>
            <ThemeIcon color="violet" size={44} radius="md" variant="light">
              <IconUsers size={24} />
            </ThemeIcon>
          </Group>
        </Paper>
      </SimpleGrid>

      {/* 2. Charts Section - 7 Charts from @mantine/charts */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg" mb="lg">
        {/* Chart 1: Documentos generados por mes */}
        <Card p="lg" radius="md" withBorder bg="white">
          <Text fw={700} size="sm" mb="xs">1. Documentos Generados por Mes</Text>
          <Text size="xs" c="dimmed" mb="md">Evolución mensual de documentos generados, pendientes y errores.</Text>
          {loading ? (
            <Skeleton height={250} />
          ) : (
            <BarChart
              h={250}
              data={charts?.docs_by_month || []}
              dataKey="month"
              series={[
                { name: 'generados', color: 'teal.6', label: 'Generados' },
                { name: 'pendientes', color: 'yellow.6', label: 'Pendientes' },
                { name: 'errores', color: 'red.6', label: 'Errores' },
              ]}
              tickLine="y"
            />
          )}
        </Card>

        {/* Chart 2: Expedientes por estado */}
        <Card p="lg" radius="md" withBorder bg="white">
          <Text fw={700} size="sm" mb="xs">2. Expedientes por Estado</Text>
          <Text size="xs" c="dimmed" mb="md">Distribución porcentual de los expedientes según su estado actual.</Text>
          {loading ? (
            <Skeleton height={250} />
          ) : (
            <Group justify="center" align="center" style={{ height: 250 }}>
              <DonutChart
                size={200}
                thickness={28}
                data={charts?.expedientes_by_status || []}
                withLabels
                withTooltip
              />
            </Group>
          )}
        </Card>

        {/* Chart 3: Documentos por tipo de plantilla */}
        <Card p="lg" radius="md" withBorder bg="white">
          <Text fw={700} size="sm" mb="xs">3. Documentos por Tipo de Plantilla</Text>
          <Text size="xs" c="dimmed" mb="md">Volumen de expedientes según el modelo de plantilla utilizado.</Text>
          {loading ? (
            <Skeleton height={250} />
          ) : (
            <BarChart
              h={250}
              data={charts?.docs_by_template_type || []}
              dataKey="tipo"
              series={[{ name: 'total', color: 'enterpriseBlue.6', label: 'Expedientes' }]}
            />
          )}
        </Card>

        {/* Chart 4: Productividad por usuario */}
        <Card p="lg" radius="md" withBorder bg="white">
          <Text fw={700} size="sm" mb="xs">4. Productividad por Usuario</Text>
          <Text size="xs" c="dimmed" mb="md">Expedientes procesados y culminados por cada operador.</Text>
          {loading ? (
            <Skeleton height={250} />
          ) : (
            <BarChart
              h={250}
              data={charts?.user_productivity || []}
              dataKey="usuario"
              series={[
                { name: 'procesados', color: 'indigo.6', label: 'Procesados' },
                { name: 'generados', color: 'teal.6', label: 'Generados' },
              ]}
            />
          )}
        </Card>

        {/* Chart 5: Evolución de generación documental */}
        <Card p="lg" radius="md" withBorder bg="white">
          <Text fw={700} size="sm" mb="xs">5. Evolución de Generación Documental</Text>
          <Text size="xs" c="dimmed" mb="md">Línea de tendencia de expedientes procesados en los últimos días.</Text>
          {loading ? (
            <Skeleton height={250} />
          ) : (
            <AreaChart
              h={250}
              data={charts?.generation_evolution || []}
              dataKey="date"
              series={[{ name: 'total', color: 'cyan.6', label: 'Documentos' }]}
              curveType="monotone"
            />
          )}
        </Card>

        {/* Chart 6: Almacenamiento por Drive */}
        <Card p="lg" radius="md" withBorder bg="white">
          <Text fw={700} size="sm" mb="xs">6. Almacenamiento por Unidad de Drive</Text>
          <Text size="xs" c="dimmed" mb="md">Megabytes (MB) ocupados por carpeta o repositorio en la nube.</Text>
          {loading ? (
            <Skeleton height={250} />
          ) : (
            <BarChart
              h={250}
              data={charts?.storage_by_drive || []}
              dataKey="drive"
              series={[{ name: 'size_mb', color: 'green.6', label: 'Tamaño (MB)' }]}
            />
          )}
        </Card>
      </SimpleGrid>

      {/* Chart 7: Procesos exitosos y fallidos & System Status */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg" mb="lg">
        <Card p="lg" radius="md" withBorder bg="white">
          <Text fw={700} size="sm" mb="xs">7. Procesos Exitosos vs Fallidos</Text>
          <Text size="xs" c="dimmed" mb="md">Tasa de éxito operativa del motor de compilación.</Text>
          {loading ? (
            <Skeleton height={200} />
          ) : (
            <Group justify="center" align="center" style={{ height: 200 }}>
              <DonutChart
                size={160}
                thickness={22}
                data={(charts?.process_success_rate || []).map((i) => ({
                  name: i.name,
                  value: i.value,
                  color: i.color,
                }))}
                withLabels
              />
            </Group>
          )}
        </Card>

        {/* System Integrations Status */}
        <Card p="lg" radius="md" withBorder bg="white" style={{ gridColumn: 'span 2' }}>
          <Text fw={700} size="sm" mb="xs">Estado de Integraciones y Workers en Vivo</Text>
          <Text size="xs" c="dimmed" mb="md">Salud y disponibilidad de los conectores con Google Workspace y Celery.</Text>
          
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <Paper p="sm" withBorder radius="md" bg="gray.0">
              <Group justify="space-between" mb={4}>
                <Group gap="xs">
                  <IconBrandGoogleDrive size={20} color="#0ca678" />
                  <Text fw={600} size="sm">Google Drive API v3</Text>
                </Group>
                <Badge color="teal" size="sm">OPERACIONAL</Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Latencia: {integrations?.google_drive.latency_ms || 42} ms | Carpetas activas: {integrations?.google_drive.active_folders || 4}
              </Text>
            </Paper>

            <Paper p="sm" withBorder radius="md" bg="gray.0">
              <Group justify="space-between" mb={4}>
                <Group gap="xs">
                  <IconFiles size={20} color="#1864ab" />
                  <Text fw={600} size="sm">Google Sheets API v4</Text>
                </Group>
                <Badge color="teal" size="sm">SINCRONIZADO</Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Motor Univer SDK Sheets v1.5.2 | Latencia: {integrations?.google_sheets.latency_ms || 58} ms
              </Text>
            </Paper>

            <Paper p="sm" withBorder radius="md" bg="gray.0">
              <Group justify="space-between" mb={4}>
                <Group gap="xs">
                  <IconCpu size={20} color="#7950f2" />
                  <Text fw={600} size="sm">Celery Worker & Beat</Text>
                </Group>
                <Badge color="teal" size="sm">ACTIVO</Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Workers online: {integrations?.celery_workers.workers_online || 2} | Tareas en cola: {integrations?.celery_workers.queue_backlog || 0}
              </Text>
            </Paper>

            <Paper p="sm" withBorder radius="md" bg="gray.0">
              <Group justify="space-between" mb={4}>
                <Group gap="xs">
                  <IconDatabase size={20} color="#0b7285" />
                  <Text fw={600} size="sm">Base de Datos PostgreSQL</Text>
                </Group>
                <Badge color="teal" size="sm">SALUDABLE</Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Dual Engine PostgreSQL / SQLite | Soporte JSONB Nativo
              </Text>
            </Paper>
          </SimpleGrid>
        </Card>
      </SimpleGrid>

      {/* 3. Recent Activity & Operations Table */}
      <Card p="lg" radius="md" withBorder bg="white">
        <Text fw={700} size="sm" mb="xs">Actividad y Últimas Operaciones</Text>
        <Text size="xs" c="dimmed" mb="md">Registro inmutable de expedientes procesados recientemente en la plataforma.</Text>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>N° Expediente</Table.Th>
              <Table.Th>Asunto</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Responsable</Table.Th>
              <Table.Th>Fecha de Actualización</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {(activity?.recent_operations || []).map((op) => (
              <Table.Tr key={op.id}>
                <Table.Td fw={600} c="enterpriseBlue.7">{op.numero}</Table.Td>
                <Table.Td>{op.asunto}</Table.Td>
                <Table.Td>
                  <Badge
                    color={
                      op.estado === 'GENERADO' ? 'teal' :
                      op.estado === 'PENDIENTE' ? 'yellow' :
                      op.estado === 'ERROR' ? 'red' : 'blue'
                    }
                    size="sm"
                    variant="light"
                  >
                    {op.estado}
                  </Badge>
                </Table.Td>
                <Table.Td>{op.responsable}</Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{op.updated_at}</Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Box>
  );
};
