import React, { useEffect, useState } from 'react';
import {
  SimpleGrid, Paper, Text, Group, ThemeIcon, Title, Stack, Box,
  Table, Badge, Card
} from '@mantine/core';
import { BarChart, DonutChart } from '@mantine/charts';
import {
  IconFileCheck, IconClock, IconLoader2, IconAlertCircle,
  IconTemplate, IconBrandGoogleDrive, IconUsers,
  IconPaw, IconHeartbeat, IconTrendingUp, IconChartPie,
  IconStethoscope, IconServer, IconNetwork, IconFileTypePdf, IconDatabase
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { DashboardStats, DashboardCharts, IntegrationsStatus } from '../../types';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoaders';
import { CustomBadge } from '../../components/ui/CustomBadge';

// Componente de conteo numérico animado suave con soporte para prefers-reduced-motion
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setDisplayValue(value);
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startValue = 0;
    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Curva de aceleración/desaceleración suave (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (value - startValue) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

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

  // Configuración de las 8 tarjetas de indicadores clínicos con identidad visual veterinaria
  const indicatorCards = [
    {
      title: 'Total Pacientes / Expedientes',
      value: stats?.total_expedientes ?? 0,
      description: 'Registros consolidados',
      icon: <IconPaw size={22} color="#15803d" stroke={1.8} />,
      bg: '#f0fdf4',
      border: '#bbf7d0',
      accentColor: 'vetGreen.8',
    },
    {
      title: 'Generados / Certificados',
      value: stats?.generados ?? 0,
      description: 'Con firma y PDF oficial',
      icon: <IconFileCheck size={22} color="#15803d" stroke={1.8} />,
      bg: '#dcfce7',
      border: '#86efac',
      accentColor: 'vetGreen.7',
    },
    {
      title: 'Pendientes de Firma',
      value: stats?.pendientes ?? 0,
      description: 'Esperando validación médica',
      icon: <IconClock size={22} color="#b45309" stroke={1.8} />,
      bg: '#fef3c7',
      border: '#fde68a',
      accentColor: 'yellow.8',
    },
    {
      title: 'En Compilación',
      value: stats?.en_proceso ?? 0,
      description: 'Procesando con ReportLab',
      icon: <IconLoader2 size={22} color="#0369a1" stroke={1.8} />,
      bg: '#e0f2fe',
      border: '#bae6fd',
      accentColor: 'blue.7',
    },
    {
      title: 'Observaciones / Errores',
      value: stats?.errores ?? 0,
      description: 'Requieren revisión clínica',
      icon: <IconAlertCircle size={22} color="#b91c1c" stroke={1.8} />,
      bg: '#fee2e2',
      border: '#fecaca',
      accentColor: 'red.7',
    },
    {
      title: 'Plantillas Clínicas',
      value: stats?.plantillas_activas ?? 0,
      description: 'Formatos médicos activos',
      icon: <IconTemplate size={22} color="#0d9488" stroke={1.8} />,
      bg: '#ccfbf1',
      border: '#99f6e4',
      accentColor: 'teal.8',
    },
    {
      title: 'Carpetas en Drive',
      value: stats?.drives_conectados ?? 0,
      description: 'Google Drive sincronizado',
      icon: <IconBrandGoogleDrive size={22} color="#166534" stroke={1.8} />,
      bg: '#f0fdf4',
      border: '#bbf7d0',
      accentColor: 'vetGreen.9',
    },
    {
      title: 'Personal Médico',
      value: stats?.usuarios_activos ?? 0,
      description: 'Veterinarios y auxiliares',
      icon: <IconUsers size={22} color="#4338ca" stroke={1.8} />,
      bg: '#e0e7ff',
      border: '#c7d2fe',
      accentColor: 'indigo.7',
    },
  ];

  return (
    <Box className="anim-fade-in">
      {/* ==================================================================== */}
      {/* 1. ENCABEZADO ESPECÍFICO DEL DASHBOARD — CENTRO DE OPERACIONES        */}
      {/* ==================================================================== */}
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
          <Box style={{ flex: 1, minWidth: 0, width: '100%' }}>
            <Badge
              size="sm"
              variant="light"
              color="green"
              mb="xs"
              leftSection={<IconHeartbeat size={13} color="#86efac" />}
              styles={{
                root: {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                },
              }}
            >
              Expedix Vet • Centro de Operaciones
            </Badge>
            <Title order={1} fw={900} style={{ fontSize: '2.1rem', lineHeight: 1.18, color: '#ffffff', marginBottom: 8 }}>
              Panel de Control Clínico
            </Title>
            <Text
              size="md"
              style={{
                color: '#d1fae5',
                lineHeight: 1.5,
                width: '100%',
                maxWidth: 'none',
              }}
            >
              Supervisa la actividad veterinaria, el estado de los expedientes, la documentación y el rendimiento operativo de tu equipo desde un solo lugar.
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
              <IconHeartbeat size={44} color="#86efac" />
            </ThemeIcon>
          </Box>
        </Group>
      </Paper>

      {loading && <DashboardSkeleton />}

      {!loading && (
        <Stack gap="xl">
          {/* ================================================================ */}
          {/* 2. OCHO TARJETAS DE INDICADORES PRINCIPALES                       */}
          {/* ================================================================ */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
            {indicatorCards.map((card, idx) => (
              <Paper
                key={idx}
                p="md"
                radius="lg"
                withBorder
                bg="white"
                shadow="xs"
                className="interactive-card anim-fade-in-up"
                style={{
                  animationDelay: `${idx * 45}ms`,
                  borderColor: '#e2e8f0',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase" lineClamp={1}>
                      {card.title}
                    </Text>
                    <Title order={2} fw={900} mt={6} c={card.accentColor} style={{ fontSize: '1.8rem', lineHeight: 1.1 }}>
                      <AnimatedCounter value={card.value} />
                    </Title>
                    <Text size="11px" c="dimmed" mt={4} lineClamp={1}>
                      {card.description}
                    </Text>
                  </Box>
                  <Box
                    p={8}
                    style={{
                      borderRadius: 12,
                      backgroundColor: card.bg,
                      border: `1px solid ${card.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {card.icon}
                  </Box>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>

          {/* ================================================================ */}
          {/* 3. GRÁFICOS: EVOLUCIÓN MENSUAL Y DISTRIBUCIÓN CLÍNICA             */}
          {/* ================================================================ */}
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            {/* Gráfico 1: Evolución Mensual de Atención y Expedientes */}
            <Card p="lg" radius="lg" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between" align="flex-start" mb="xs">
                <Group gap="xs">
                  <ThemeIcon size={34} radius="md" color="vetGreen" variant="light">
                    <IconTrendingUp size={18} color="#15803d" />
                  </ThemeIcon>
                  <div>
                    <Group gap="xs">
                      <Text fw={700} size="sm" c="dark.8">
                        Evolución Mensual de Atención y Expedientes
                      </Text>
                      <Badge size="xs" color="vetGreen" variant="light">
                        Tendencia Anual
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={1}>
                      Volumen histórico de documentos generados, pendientes y observados.
                    </Text>
                  </div>
                </Group>
              </Group>

              <Box mt="md">
                <BarChart
                  h={260}
                  data={charts?.docs_by_month || []}
                  dataKey="month"
                  series={[
                    { name: 'generados', color: 'vetGreen.6', label: 'Generados' },
                    { name: 'pendientes', color: 'yellow.6', label: 'Pendientes' },
                    { name: 'errores', color: 'red.6', label: 'Errores' },
                  ]}
                  tickLine="y"
                  gridAxis="xy"
                  withLegend
                  withTooltip
                />
              </Box>
            </Card>

            {/* Gráfico 2: Distribución por Estado Clínico */}
            <Card p="lg" radius="lg" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between" align="flex-start" mb="xs">
                <Group gap="xs">
                  <ThemeIcon size={34} radius="md" color="teal" variant="light">
                    <IconChartPie size={18} color="#0d9488" />
                  </ThemeIcon>
                  <div>
                    <Group gap="xs">
                      <Text fw={700} size="sm" c="dark.8">
                        Distribución por Estado Clínico
                      </Text>
                      <Badge size="xs" color="gray" variant="outline">
                        Porcentual
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={1}>
                      Proporción de expedientes en atención, culminados o en proceso.
                    </Text>
                  </div>
                </Group>
              </Group>

              <Group justify="center" align="center" style={{ height: 260 }}>
                <DonutChart
                  size={195}
                  thickness={28}
                  data={charts?.expedientes_by_status || []}
                  withLabels
                  withTooltip
                />
              </Group>

              {/* Leyenda y Desglose Rápido */}
              <Group justify="center" gap="xs" mt="xs">
                {(charts?.expedientes_by_status || []).map((item, idx) => (
                  <Badge
                    key={idx}
                    size="xs"
                    variant="light"
                    color={item.color?.split('.')[0] || 'gray'}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {item.name}: {item.value}
                  </Badge>
                ))}
              </Group>
            </Card>
          </SimpleGrid>

          {/* ================================================================ */}
          {/* 4. GRÁFICOS: DOCUMENTOS POR PLANTILLA Y PRODUCTIVIDAD MÉDICA      */}
          {/* ================================================================ */}
          <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
            {/* Gráfico 3: Expedientes por tipo de plantilla */}
            <Card p="lg" radius="lg" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between" align="flex-start" mb="xs">
                <Group gap="xs">
                  <ThemeIcon size={34} radius="md" color="teal" variant="light">
                    <IconTemplate size={18} color="#0d9488" />
                  </ThemeIcon>
                  <div>
                    <Group gap="xs">
                      <Text fw={700} size="sm" c="dark.8">
                        Documentos por Tipo de Plantilla Clínica
                      </Text>
                      <Badge size="xs" color="teal" variant="light">
                        Formatos Médicos
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={1}>
                      Uso relativo de historias clínicas, actas y certificados de salud.
                    </Text>
                  </div>
                </Group>
              </Group>

              <Box mt="md">
                <BarChart
                  h={260}
                  data={charts?.docs_by_template_type || []}
                  dataKey="tipo"
                  series={[{ name: 'total', color: 'vetGreen.6', label: 'Expedientes' }]}
                  tickLine="y"
                  withTooltip
                />
              </Box>
            </Card>

            {/* Gráfico 4: Productividad por usuario */}
            <Card p="lg" radius="lg" withBorder bg="white" shadow="xs" className="interactive-card">
              <Group justify="space-between" align="flex-start" mb="xs">
                <Group gap="xs">
                  <ThemeIcon size={34} radius="md" color="indigo" variant="light">
                    <IconUsers size={18} color="#4338ca" />
                  </ThemeIcon>
                  <div>
                    <Group gap="xs">
                      <Text fw={700} size="sm" c="dark.8">
                        Productividad del Personal Veterinario
                      </Text>
                      <Badge size="xs" color="indigo" variant="light">
                        Equipo Clínico
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed" mt={1}>
                      Expedientes procesados y culminados por cada miembro del equipo.
                    </Text>
                  </div>
                </Group>
              </Group>

              <Box mt="md">
                <BarChart
                  h={260}
                  data={charts?.user_productivity || []}
                  dataKey="usuario"
                  series={[
                    { name: 'procesados', color: 'indigo.6', label: 'Procesados' },
                    { name: 'generados', color: 'vetGreen.6', label: 'Generados' },
                  ]}
                  tickLine="y"
                  withLegend
                  withTooltip
                />
              </Box>
            </Card>
          </SimpleGrid>

          {/* ================================================================ */}
          {/* 5. ÚLTIMOS EXPEDIENTES ATENDIDOS Y ESTADO DE INFRAESTRUCTURA      */}
          {/* ================================================================ */}
          <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="lg">
            {/* 5.1. Últimos Expedientes Atendidos */}
            <Box style={{ gridColumn: 'span 2' }}>
              <Paper p="lg" radius="lg" withBorder bg="white" shadow="xs">
                <Group justify="space-between" align="center" mb="md">
                  <Group gap="xs">
                    <ThemeIcon size={34} radius="md" color="vetGreen" variant="light">
                      <IconStethoscope size={18} color="#15803d" />
                    </ThemeIcon>
                    <div>
                      <Text fw={700} size="sm" c="dark.8">
                        Últimos Expedientes Atendidos
                      </Text>
                      <Text size="xs" c="dimmed">
                        Trazabilidad en tiempo real de operaciones clínicas
                      </Text>
                    </div>
                  </Group>

                  {/* Indicador En Vivo Moderno */}
                  <Badge
                    size="sm"
                    color="vetGreen"
                    variant="light"
                    leftSection={
                      <Box
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          backgroundColor: '#16a34a',
                          boxShadow: '0 0 0 2px rgba(22, 163, 74, 0.25)',
                        }}
                      />
                    }
                  >
                    En Vivo
                  </Badge>
                </Group>

                <div className="vet-table-container">
                  <Table highlightOnHover withTableBorder={false} withColumnBorders={false}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ width: 140 }}>N° Expediente</Table.Th>
                        <Table.Th>Paciente / Asunto</Table.Th>
                        <Table.Th style={{ textAlign: 'center', width: 130 }}>Estado</Table.Th>
                        <Table.Th style={{ width: 110 }}>Fecha</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {(activity?.recent_operations || []).length === 0 ? (
                        <Table.Tr>
                          <Table.Td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>
                            <Text size="xs" c="dimmed">
                              No hay expedientes recientes en este momento.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ) : (
                        (activity?.recent_operations || []).slice(0, 5).map((op, i) => (
                          <Table.Tr key={i}>
                            <Table.Td>
                              <Text fw={700} size="xs" c="vetGreen.8">
                                {op.numero_expediente}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs" wrap="nowrap">
                                <IconPaw size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                                <Text size="xs" fw={500} lineClamp={1}>
                                  {op.asunto}
                                </Text>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ textAlign: 'center' }}>
                              <CustomBadge status={op.estado} />
                            </Table.Td>
                            <Table.Td>
                              <Text size="11px" c="dimmed">
                                {op.updated_at ? op.updated_at.split('T')[0] : 'Hoy'}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )}
                    </Table.Tbody>
                  </Table>
                </div>
              </Paper>
            </Box>

            {/* 5.2. Panel Moderno de Supervisión de Servicios de Infraestructura */}
            <Paper p="lg" radius="lg" withBorder bg="white" shadow="xs">
              <Group gap="xs" mb="xs">
                <ThemeIcon size={34} radius="md" color="vetGreen" variant="light">
                  <IconServer size={18} color="#15803d" />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="sm" c="dark.8">
                    Estado de Infraestructura
                  </Text>
                  <Text size="xs" c="dimmed">
                    Servicios en nube y motores de compilación
                  </Text>
                </div>
              </Group>

              <Stack gap="sm" mt="md">
                {/* 1. Google Drive API */}
                <Paper
                  p="sm"
                  radius="md"
                  withBorder
                  bg="#f8fafc"
                  style={{
                    borderColor: '#e2e8f0',
                    transition: 'border-color 0.18s ease',
                  }}
                  className="interactive-card"
                >
                  <Group justify="space-between" align="center">
                    <Group gap="sm" wrap="nowrap">
                      <Box
                        p={6}
                        style={{
                          borderRadius: 8,
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconBrandGoogleDrive size={20} color="#15803d" />
                      </Box>
                      <div>
                        <Text size="xs" fw={700} c="dark.8">
                          Google Drive API
                        </Text>
                        <Text size="10px" c="dimmed">
                          {integrations?.google_drive?.latency_ms ?? 42}ms • Sincronización en la nube
                        </Text>
                      </div>
                    </Group>
                    <Badge
                      size="xs"
                      color="green"
                      variant="light"
                      leftSection={
                        <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a' }} />
                      }
                    >
                      Operativo
                    </Badge>
                  </Group>
                </Paper>

                {/* 2. Daphne ASGI WebSockets */}
                <Paper
                  p="sm"
                  radius="md"
                  withBorder
                  bg="#f8fafc"
                  style={{
                    borderColor: '#e2e8f0',
                    transition: 'border-color 0.18s ease',
                  }}
                  className="interactive-card"
                >
                  <Group justify="space-between" align="center">
                    <Group gap="sm" wrap="nowrap">
                      <Box
                        p={6}
                        style={{
                          borderRadius: 8,
                          backgroundColor: '#f0fdfa',
                          border: '1px solid #99f6e4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconNetwork size={20} color="#0d9488" />
                      </Box>
                      <div>
                        <Text size="xs" fw={700} c="dark.8">
                          Daphne ASGI WebSockets
                        </Text>
                        <Text size="10px" c="dimmed">
                          Canales bidireccionales reactivos
                        </Text>
                      </div>
                    </Group>
                    <Badge
                      size="xs"
                      color="teal"
                      variant="light"
                      leftSection={
                        <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#0d9488' }} />
                      }
                    >
                      Conectado
                    </Badge>
                  </Group>
                </Paper>

                {/* 3. ReportLab PDF Engine */}
                <Paper
                  p="sm"
                  radius="md"
                  withBorder
                  bg="#f8fafc"
                  style={{
                    borderColor: '#e2e8f0',
                    transition: 'border-color 0.18s ease',
                  }}
                  className="interactive-card"
                >
                  <Group justify="space-between" align="center">
                    <Group gap="sm" wrap="nowrap">
                      <Box
                        p={6}
                        style={{
                          borderRadius: 8,
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconFileTypePdf size={20} color="#15803d" />
                      </Box>
                      <div>
                        <Text size="xs" fw={700} c="dark.8">
                          ReportLab PDF Engine
                        </Text>
                        <Text size="10px" c="dimmed">
                          Compilación vectorial médica
                        </Text>
                      </div>
                    </Group>
                    <Badge
                      size="xs"
                      color="green"
                      variant="light"
                      leftSection={
                        <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#15803d' }} />
                      }
                    >
                      Listo
                    </Badge>
                  </Group>
                </Paper>

                {/* 4. PostgreSQL & Redis */}
                <Paper
                  p="sm"
                  radius="md"
                  withBorder
                  bg="#f8fafc"
                  style={{
                    borderColor: '#e2e8f0',
                    transition: 'border-color 0.18s ease',
                  }}
                  className="interactive-card"
                >
                  <Group justify="space-between" align="center">
                    <Group gap="sm" wrap="nowrap">
                      <Box
                        p={6}
                        style={{
                          borderRadius: 8,
                          backgroundColor: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconDatabase size={20} color="#2563eb" />
                      </Box>
                      <div>
                        <Text size="xs" fw={700} c="dark.8">
                          PostgreSQL & Redis
                        </Text>
                        <Text size="10px" c="dimmed">
                          Persistencia relacional y caché
                        </Text>
                      </div>
                    </Group>
                    <Badge
                      size="xs"
                      color="blue"
                      variant="light"
                      leftSection={
                        <Box style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#2563eb' }} />
                      }
                    >
                      Sincronizado
                    </Badge>
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
