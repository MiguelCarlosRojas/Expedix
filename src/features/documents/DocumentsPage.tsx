import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Table, Text, Group, Button, TextInput, Select, Badge,
  ActionIcon, Modal, Stepper, Stack, Paper, Title, Divider,
  ThemeIcon, Menu
} from '@mantine/core';
import {
  IconPlus, IconSearch, IconFilter, IconFileSpark, IconDownload,
  IconEye, IconTrash, IconTemplate, IconRefresh, IconCheck, IconAlertTriangle,
  IconExternalLink, IconCopy, IconTool, IconFiles,
  IconPaw, IconStethoscope, IconFileCertificate, IconFilterOff,
  IconDotsVertical, IconToggleLeft, IconToggleRight, IconFolderPlus, IconX
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { Expediente, DocumentTemplate } from '../../types';
import { CustomBadge } from '../../components/ui/CustomBadge';
import { DynamicForm } from '../../components/forms/DynamicForm';
import { FormBuilder } from '../../components/forms/FormBuilder';
import { notifications } from '@mantine/notifications';
import { useUrlFilters } from '../../hooks/useUrlFilters';
import { useSortableData } from '../../hooks/useSortableData';
import { SortableTh } from '../../components/ui/SortableTh';
import { TableSkeleton } from '../../components/ui/SkeletonLoaders';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

interface CategoryHeaderConfig {
  identifier: string;
  badgeIcon: React.ReactNode;
  title: string;
  description: string;
  heroIcon: React.ReactNode;
}

const CATEGORY_HEADERS: Record<string, CategoryHeaderConfig> = {
  todos: {
    identifier: 'Expedix Vet • Gestión Documental',
    badgeIcon: <IconFiles size={13} color="#86efac" />,
    title: 'Todos los Expedientes Veterinarios',
    description: 'Consulta, organiza y administra los expedientes clínicos, certificados y documentos institucionales desde un solo lugar.',
    heroIcon: <IconFiles size={44} color="#86efac" />,
  },
  historias: {
    identifier: 'Expedix Vet • Atención Clínica',
    badgeIcon: <IconStethoscope size={13} color="#86efac" />,
    title: 'Historias Clínicas y Fichas Médicas',
    description: 'Gestiona la información clínica de los pacientes, sus diagnósticos, evoluciones médicas y tratamientos prescritos.',
    heroIcon: <IconStethoscope size={44} color="#86efac" />,
  },
  certificados: {
    identifier: 'Expedix Vet • Certificación Veterinaria',
    badgeIcon: <IconFileCertificate size={13} color="#86efac" />,
    title: 'Certificados de Salud y Consentimientos',
    description: 'Consulta y administra certificados sanitarios, altas hospitalarias, autorizaciones quirúrgicas y documentos médicos oficiales.',
    heroIcon: <IconFileCertificate size={44} color="#86efac" />,
  },
  plantillas: {
    identifier: 'Expedix Vet • Gestión de Plantillas',
    badgeIcon: <IconTemplate size={13} color="#86efac" />,
    title: 'Plantillas Clínicas y Formularios',
    description: 'Administra las plantillas maestras, sus versiones y los campos dinámicos utilizados para generar documentos veterinarios.',
    heroIcon: <IconTemplate size={44} color="#86efac" />,
  },
};

export const DocumentsPage: React.FC = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { getFilter, setFilter, clearFilters } = useUrlFilters();

  // Mapeo de categoría desde ruta URL o parámetro query
  const activeCategory = category || getFilter('categoria', 'todos');
  const activeTab = activeCategory === 'plantillas' ? 'templates' : 'expedientes';

  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de expedientes sincronizados con Query Parameters
  const search = getFilter('search', '');
  const statusFilter = getFilter('estado', '');
  const templateFilter = getFilter('template', '');

  // Filtros locales para la sección de plantillas
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateTypeFilter, setTemplateTypeFilter] = useState('');
  const [templateStatusFilter, setTemplateStatusFilter] = useState('');

  // Modals state
  const [wizardOpened, setWizardOpened] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [asunto, setAsunto] = useState('');
  const [solicitante, setSolicitante] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<Expediente | null>(null);

  // Builder Modal
  const [builderOpened, setBuilderOpened] = useState(false);
  const [templateForBuilder, setTemplateForBuilder] = useState<DocumentTemplate | null>(null);

  // Preview Modal
  const [previewOpened, setPreviewOpened] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);

  // Delete Expediente Modal
  const [expedienteToDelete, setExpedienteToDelete] = useState<Expediente | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteExpediente = async () => {
    if (!expedienteToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${expedienteToDelete.id}/`);
      notifications.show({
        title: 'Expediente Eliminado',
        message: `El expediente ${expedienteToDelete.numero_expediente} fue eliminado correctamente.`,
        color: 'teal',
        icon: <IconCheck size={18} />,
      });
      setDeleteModalOpened(false);
      setExpedienteToDelete(null);
      fetchExpedientes();
    } catch (e: any) {
      notifications.show({
        title: 'Error al eliminar',
        message: e.response?.data?.detail || 'No se pudo eliminar el expediente.',
        color: 'red',
        icon: <IconAlertTriangle size={18} />,
      });
    } finally {
      setDeleting(false);
    }
  };

  const fetchExpedientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('estado', statusFilter);
      if (templateFilter) params.append('template', templateFilter);

      const res = await api.get<{ results: Expediente[] } | Expediente[]>(`/documents/?${params.toString()}`);
      const items = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setExpedientes(items);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'No se pudieron consultar los expedientes.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await api.get<{ results: DocumentTemplate[] } | DocumentTemplate[]>('/templates/');
      const items = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setTemplates(items);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchExpedientes();
    fetchTemplates();
  }, [search, statusFilter, templateFilter, activeCategory]);

  // Filtrado por categoría especializada
  const filteredExpedientes = useMemo(() => {
    if (activeCategory === 'historias') {
      return expedientes.filter(
        (e) => e.asunto.toLowerCase().includes('historia') ||
               e.asunto.toLowerCase().includes('clínica') ||
               e.template_details?.nombre.toLowerCase().includes('historia') ||
               e.template_details?.tipo === 'INFORME'
      );
    }
    if (activeCategory === 'certificados') {
      return expedientes.filter(
        (e) => e.asunto.toLowerCase().includes('certificado') ||
               e.asunto.toLowerCase().includes('alta') ||
               e.asunto.toLowerCase().includes('consentimiento') ||
               e.template_details?.tipo === 'CONSTANCIA' ||
               e.template_details?.tipo === 'ACTA'
      );
    }
    return expedientes;
  }, [expedientes, activeCategory]);

  // Filtrado específico de plantillas maestras
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = !templateSearch ||
        t.nombre.toLowerCase().includes(templateSearch.toLowerCase()) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(templateSearch.toLowerCase()));
      const matchesType = !templateTypeFilter || t.tipo === templateTypeFilter;
      const matchesStatus = !templateStatusFilter || String(t.is_active) === templateStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [templates, templateSearch, templateTypeFilter, templateStatusFilter]);

  // Hook de ordenamiento universal para tabla de expedientes
  const { sortedData: sortedExpedientes, sortConfig, requestSort } = useSortableData(filteredExpedientes, 'created_at', 'desc');

  // Hook de ordenamiento para tabla de plantillas
  const { sortedData: sortedFilteredTemplates, sortConfig: templateSortConfig, requestSort: requestTemplateSort } = useSortableData(filteredTemplates, 'nombre', 'asc');

  const handleOpenWizard = () => {
    setWizardStep(0);
    setSelectedTemplate(templates[0] || null);
    setDynamicValues({});
    setAsunto('');
    setSolicitante('');
    setGenerationResult(null);
    setWizardOpened(true);
  };

  const handleExecuteGeneration = async () => {
    if (!selectedTemplate) return;
    setGenerating(true);
    try {
      const createRes = await api.post('/documents/', {
        asunto: asunto || `Expediente de ${selectedTemplate.nombre}`,
        solicitante: solicitante || 'Beneficiario / Paciente General',
        template: selectedTemplate.id,
        dynamic_values: dynamicValues,
      });

      const newExp = createRes.data;

      const genRes = await api.post(`/documents/${newExp.id}/generate_document/`, {
        dynamic_values: dynamicValues,
      });

      setGenerationResult(genRes.data.expediente);
      setWizardStep(3);
      fetchExpedientes();
      notifications.show({
        title: 'Documento Veterinario Generado',
        message: `El expediente ${genRes.data.expediente.numero_expediente} fue compilado y certificado con éxito.`,
        color: 'teal',
        icon: <IconCheck size={18} />,
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Fallo durante el proceso de generación.';
      notifications.show({
        title: 'Error de compilación',
        message: detail,
        color: 'red',
        icon: <IconAlertTriangle size={18} />,
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDuplicateTemplate = async (templateId: number) => {
    try {
      await api.post(`/templates/${templateId}/duplicate/`);
      notifications.show({ title: 'Plantilla duplicada', message: 'Copia veterinaria creada exitosamente.', color: 'teal' });
      fetchTemplates();
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo duplicar la plantilla.', color: 'red' });
    }
  };

  const handleToggleTemplateActive = async (templateId: number) => {
    try {
      await api.post(`/templates/${templateId}/toggle_active/`);
      fetchTemplates();
    } catch (e) {
      // ignore
    }
  };

  const currentHeader = CATEGORY_HEADERS[activeCategory] || CATEGORY_HEADERS.todos;
  const hasActiveFilters = Boolean(search || statusFilter || templateFilter);
  const hasActiveTemplateFilters = Boolean(templateSearch || templateTypeFilter || templateStatusFilter);

  return (
    <Box className="anim-fade-in">
      {/* ==================================================================== */}
      {/* 1. ENCABEZADO ESPECÍFICO CON IDENTIDAD EXPEDIX VET                    */}
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
              leftSection={currentHeader.badgeIcon}
              styles={{
                root: {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontWeight: 600,
                  backdropFilter: 'blur(4px)',
                },
              }}
            >
              {currentHeader.identifier}
            </Badge>
            <Title order={1} fw={900} style={{ fontSize: '2.1rem', lineHeight: 1.18, color: '#ffffff', marginBottom: 8 }}>
              {currentHeader.title}
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
              {currentHeader.description}
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
              {currentHeader.heroIcon}
            </ThemeIcon>
          </Box>
        </Group>
      </Paper>

      {/* ==================================================================== */}
      {/* 2. PESTAÑAS 1, 2 Y 3: LISTADO DE EXPEDIENTES CLÍNICOS                */}
      {/* ==================================================================== */}
      {activeTab === 'expedientes' && (
        <Stack gap="lg">
          {/* Barra de Filtros, Buscador y Acción Principal */}
          <Paper p="md" radius="lg" withBorder bg="white" shadow="xs">
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              {/* Buscador y Filtros Desplegables */}
              <Group gap="sm" style={{ flex: 1, minWidth: 280 }} wrap="wrap">
                <TextInput
                  placeholder="Buscar por N° expediente, paciente o diagnóstico..."
                  leftSection={<IconSearch size={18} color="#15803d" />}
                  value={search}
                  onChange={(e) => setFilter('search', e.currentTarget.value)}
                  rightSection={
                    search ? (
                      <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setFilter('search', '')} aria-label="Limpiar búsqueda">
                        <IconX size={13} />
                      </ActionIcon>
                    ) : null
                  }
                  style={{ flex: 1, minWidth: 260 }}
                  size="sm"
                  radius="md"
                />

                <Select
                  placeholder="Estado clínico"
                  leftSection={<IconFilter size={16} color="#15803d" />}
                  data={[
                    { value: '', label: 'Todos los estados' },
                    { value: 'PENDIENTE', label: 'Pendiente' },
                    { value: 'EN_PROCESO', label: 'En Proceso' },
                    { value: 'GENERADO', label: 'Generado' },
                    { value: 'ERROR', label: 'Error' },
                    { value: 'OBSERVADO', label: 'Observado' },
                  ]}
                  value={statusFilter}
                  onChange={(val) => setFilter('estado', val || '')}
                  clearable
                  style={{ width: 175 }}
                  size="sm"
                  radius="md"
                />

                <Select
                  placeholder="Plantilla clínica"
                  leftSection={<IconTemplate size={16} color="#15803d" />}
                  data={[
                    { value: '', label: 'Todas las plantillas' },
                    ...templates.map((t) => ({ value: String(t.id), label: t.nombre })),
                  ]}
                  value={templateFilter}
                  onChange={(val) => setFilter('template', val || '')}
                  clearable
                  style={{ width: 220 }}
                  size="sm"
                  radius="md"
                />

                <ActionIcon
                  variant="light"
                  color="vetGreen"
                  size="lg"
                  radius="md"
                  onClick={fetchExpedientes}
                  title="Refrescar datos"
                  aria-label="Refrescar expedientes"
                >
                  <IconRefresh size={18} color="#15803d" />
                </ActionIcon>

                {hasActiveFilters && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    radius="md"
                    leftSection={<IconFilterOff size={14} />}
                    onClick={() => clearFilters(['categoria'])}
                  >
                    Limpiar
                  </Button>
                )}
              </Group>

              {/* Contador Resumido de Resultados y Botón Principal */}
              <Group gap="sm" wrap="wrap">
                <Box
                  px="sm"
                  py={6}
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <IconFiles size={16} color="#15803d" />
                  <Text size="xs" fw={700} c="vetGreen.9">
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>{sortedExpedientes.length}</span>{' '}
                    {sortedExpedientes.length === 1 ? 'expediente encontrado' : 'expedientes encontrados'}
                  </Text>
                </Box>

                <Button
                  color="vetGreen"
                  size="sm"
                  radius="md"
                  leftSection={<IconFolderPlus size={18} stroke={2} />}
                  onClick={handleOpenWizard}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                      fontWeight: 600,
                    },
                  }}
                >
                  Nuevo Expediente Veterinario
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* Estado de Error o Skeleton */}
          {error && <ErrorState message={error} onRetry={fetchExpedientes} />}

          {loading && !error && <TableSkeleton rows={6} columns={6} />}

          {/* Tabla de Expedientes con Ordenamiento en TODAS las Columnas */}
          {!loading && !error && (
            <>
              {sortedExpedientes.length === 0 ? (
                hasActiveFilters ? (
                  <EmptyState
                    isFilterEmpty={true}
                    icon={<IconSearch size={38} color="#15803d" />}
                    title="No se encontraron coincidencias"
                    description="No hay expedientes que coincidan con los criterios de búsqueda o filtros aplicados."
                    secondaryActionText="Limpiar filtros"
                    onSecondaryAction={() => clearFilters(['categoria'])}
                    actionText="Nuevo Expediente Veterinario"
                    onAction={handleOpenWizard}
                  />
                ) : (
                  <EmptyState
                    isFilterEmpty={false}
                    icon={<IconPaw size={38} color="#15803d" />}
                    title="Sin expedientes registrados"
                    description="Aún no se han generado documentos clínicos en esta categoría de atención."
                    actionText="Nuevo Expediente Veterinario"
                    onAction={handleOpenWizard}
                  />
                )
              ) : (
                <div className="vet-table-container">
                  <Table highlightOnHover withTableBorder={false} withColumnBorders={false}>
                    <Table.Thead>
                      <Table.Tr>
                        <SortableTh columnKey="numero_expediente" sortConfig={sortConfig} onSort={requestSort} width={150}>
                          N° Expediente
                        </SortableTh>
                        <SortableTh columnKey="solicitante" sortConfig={sortConfig} onSort={requestSort}>
                          Paciente / Solicitante
                        </SortableTh>
                        <SortableTh columnKey="asunto" sortConfig={sortConfig} onSort={requestSort}>
                          Asunto / Diagnóstico
                        </SortableTh>
                        <SortableTh columnKey="template_details" sortConfig={sortConfig} onSort={requestSort}>
                          Plantilla Clínica
                        </SortableTh>
                        <SortableTh columnKey="estado" sortConfig={sortConfig} onSort={requestSort} align="center" width={130}>
                          Estado
                        </SortableTh>
                        <SortableTh columnKey="created_at" sortConfig={sortConfig} onSort={requestSort} width={140}>
                          Fecha Creación
                        </SortableTh>
                        <Table.Th style={{ textAlign: 'center', width: 120 }}>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {sortedExpedientes.map((exp) => (
                        <Table.Tr key={exp.id}>
                          <Table.Td p="sm">
                            <Text fw={700} size="xs" c="vetGreen.8">
                              {exp.numero_expediente}
                            </Text>
                          </Table.Td>
                          <Table.Td p="sm">
                            <Group gap="xs">
                              <IconPaw size={14} color="#16a34a" />
                              <Text size="sm" fw={600} c="dark.8">
                                {exp.solicitante}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td p="sm">
                            <Text size="sm" lineClamp={1}>
                              {exp.asunto}
                            </Text>
                          </Table.Td>
                          <Table.Td p="sm">
                            <Badge size="sm" variant="light" color="gray">
                              {exp.template_details?.nombre || 'General'}
                            </Badge>
                          </Table.Td>
                          <Table.Td p="sm" style={{ textAlign: 'center' }}>
                            <CustomBadge status={exp.estado} />
                          </Table.Td>
                          <Table.Td p="sm">
                            <Text size="xs" c="dimmed">
                              {exp.created_at ? exp.created_at.split('T')[0] : 'N/A'}
                            </Text>
                          </Table.Td>
                          <Table.Td p="sm" style={{ textAlign: 'center' }}>
                            <Menu shadow="md" width={220} position="bottom-end" withinPortal>
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="sm" radius="md" title="Opciones del expediente">
                                  <IconDotsVertical size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Label>Expediente: {exp.numero_expediente}</Menu.Label>
                                {exp.pdf_url && (
                                  <Menu.Item
                                    leftSection={<IconDownload size={15} color="#16a34a" />}
                                    component="a"
                                    href={exp.pdf_url}
                                    target="_blank"
                                  >
                                    Descargar PDF Oficial
                                  </Menu.Item>
                                )}
                                {exp.estado === 'PENDIENTE' && (
                                  <Menu.Item
                                    leftSection={<IconFileSpark size={15} color="#d97706" />}
                                    onClick={async () => {
                                      try {
                                        await api.post(`/documents/${exp.id}/generate_document/`);
                                        notifications.show({ title: 'Compilación Iniciada', message: 'El PDF fue procesado con éxito.', color: 'teal' });
                                        fetchExpedientes();
                                      } catch (e) {
                                        // ignore
                                      }
                                    }}
                                  >
                                    Compilar Documento
                                  </Menu.Item>
                                )}
                                {exp.google_doc_url && (
                                  <Menu.Item
                                    leftSection={<IconExternalLink size={15} color="#2563eb" />}
                                    component="a"
                                    href={exp.google_doc_url}
                                    target="_blank"
                                  >
                                    Abrir en Google Docs
                                  </Menu.Item>
                                )}
                                <Divider />
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={15} />}
                                  onClick={() => {
                                    setExpedienteToDelete(exp);
                                    setDeleteModalOpened(true);
                                  }}
                                >
                                  Eliminar Expediente
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Stack>
      )}

      {/* ==================================================================== */}
      {/* 3. PESTAÑA 4: GESTOR DE PLANTILLAS MAESTRAS & FORM BUILDER           */}
      {/* ==================================================================== */}
      {activeTab === 'templates' && (
        <Stack gap="lg">
          {/* Barra de Filtros, Buscador y Acción de Plantillas */}
          <Paper p="md" radius="lg" withBorder bg="white" shadow="xs">
            <Group justify="space-between" align="center" wrap="wrap" gap="md">
              {/* Buscador y Filtros de Plantillas */}
              <Group gap="sm" style={{ flex: 1, minWidth: 280 }} wrap="wrap">
                <TextInput
                  placeholder="Buscar por nombre o descripción de plantilla..."
                  leftSection={<IconSearch size={18} color="#15803d" />}
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.currentTarget.value)}
                  rightSection={
                    templateSearch ? (
                      <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setTemplateSearch('')} aria-label="Limpiar búsqueda">
                        <IconX size={13} />
                      </ActionIcon>
                    ) : null
                  }
                  style={{ flex: 1, minWidth: 260 }}
                  size="sm"
                  radius="md"
                />

                <Select
                  placeholder="Tipo documental"
                  leftSection={<IconFilter size={16} color="#15803d" />}
                  data={[
                    { value: '', label: 'Todos los tipos' },
                    { value: 'INFORME', label: 'Informe / Historia' },
                    { value: 'CONSTANCIA', label: 'Constancia / Certificado' },
                    { value: 'ACTA', label: 'Acta / Consentimiento' },
                    { value: 'RESOLUCION', label: 'Resolución' },
                  ]}
                  value={templateTypeFilter}
                  onChange={(val) => setTemplateTypeFilter(val || '')}
                  clearable
                  style={{ width: 210 }}
                  size="sm"
                  radius="md"
                />

                <Select
                  placeholder="Estado"
                  leftSection={<IconCheck size={16} color="#15803d" />}
                  data={[
                    { value: '', label: 'Todos los estados' },
                    { value: 'true', label: 'Activas' },
                    { value: 'false', label: 'Inactivas' },
                  ]}
                  value={templateStatusFilter}
                  onChange={(val) => setTemplateStatusFilter(val || '')}
                  clearable
                  style={{ width: 160 }}
                  size="sm"
                  radius="md"
                />

                <ActionIcon
                  variant="light"
                  color="vetGreen"
                  size="lg"
                  radius="md"
                  onClick={fetchTemplates}
                  title="Refrescar plantillas"
                  aria-label="Refrescar plantillas"
                >
                  <IconRefresh size={18} color="#15803d" />
                </ActionIcon>

                {hasActiveTemplateFilters && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    radius="md"
                    leftSection={<IconFilterOff size={14} />}
                    onClick={() => {
                      setTemplateSearch('');
                      setTemplateTypeFilter('');
                      setTemplateStatusFilter('');
                    }}
                  >
                    Limpiar
                  </Button>
                )}
              </Group>

              {/* Contador de Plantillas y Botón */}
              <Group gap="sm" wrap="wrap">
                <Box
                  px="sm"
                  py={6}
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 10,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <IconTemplate size={16} color="#15803d" />
                  <Text size="xs" fw={700} c="vetGreen.9">
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>{sortedFilteredTemplates.length}</span>{' '}
                    {sortedFilteredTemplates.length === 1 ? 'plantilla configurada' : 'plantillas configuradas'}
                  </Text>
                </Box>

                <Button
                  color="vetGreen"
                  size="sm"
                  radius="md"
                  leftSection={<IconPlus size={18} stroke={2} />}
                  onClick={() => {
                    if (templates.length > 0) {
                      setTemplateForBuilder(templates[0]);
                      setBuilderOpened(true);
                    }
                  }}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                      fontWeight: 600,
                    },
                  }}
                >
                  Constructor de Campos
                </Button>
              </Group>
            </Group>
          </Paper>

          {/* Tabla de Plantillas con Ordenamiento */}
          {sortedFilteredTemplates.length === 0 ? (
            hasActiveTemplateFilters ? (
              <EmptyState
                isFilterEmpty={true}
                icon={<IconSearch size={38} color="#15803d" />}
                title="No se encontraron plantillas"
                description="No existen formatos maestros que coincidan con los criterios de búsqueda seleccionados."
                secondaryActionText="Limpiar filtros"
                onSecondaryAction={() => {
                  setTemplateSearch('');
                  setTemplateTypeFilter('');
                  setTemplateStatusFilter('');
                }}
              />
            ) : (
              <EmptyState
                isFilterEmpty={false}
                icon={<IconTemplate size={38} color="#15803d" />}
                title="Sin plantillas configuradas"
                description="Aún no se han registrado plantillas maestras en el sistema clínico."
              />
            )
          ) : (
            <div className="vet-table-container">
              <Table highlightOnHover withTableBorder={false} withColumnBorders={false}>
                <Table.Thead>
                  <Table.Tr>
                    <SortableTh columnKey="nombre" sortConfig={templateSortConfig} onSort={requestTemplateSort}>
                      Nombre de Plantilla
                    </SortableTh>
                    <SortableTh columnKey="tipo" sortConfig={templateSortConfig} onSort={requestTemplateSort} width={180}>
                      Tipo Documental
                    </SortableTh>
                    <SortableTh columnKey="version" sortConfig={templateSortConfig} onSort={requestTemplateSort} align="center" width={110}>
                      Versión
                    </SortableTh>
                    <SortableTh columnKey="is_active" sortConfig={templateSortConfig} onSort={requestTemplateSort} align="center" width={120}>
                      Estado
                    </SortableTh>
                    <Table.Th style={{ textAlign: 'center', width: 180 }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedFilteredTemplates.map((t) => (
                    <Table.Tr key={t.id}>
                      <Table.Td p="sm">
                        <Group gap="xs">
                          <ThemeIcon size={32} radius="md" color="vetGreen" variant="light">
                            <IconTemplate size={18} color="#15803d" />
                          </ThemeIcon>
                          <div>
                            <Text size="sm" fw={700} c="dark.8">
                              {t.nombre}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {t.descripcion || 'Plantilla oficial estandarizada'}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td p="sm">
                        <Badge size="sm" variant="light" color="vetGreen">
                          {t.tipo}
                        </Badge>
                      </Table.Td>
                      <Table.Td p="sm" style={{ textAlign: 'center' }}>
                        <Badge size="xs" variant="filled" color="gray">
                          v{t.version}
                        </Badge>
                      </Table.Td>
                      <Table.Td p="sm" style={{ textAlign: 'center' }}>
                        <Badge size="sm" color={t.is_active ? 'green' : 'gray'} variant="light">
                          {t.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </Table.Td>
                      <Table.Td p="sm" style={{ textAlign: 'center' }}>
                        <Menu shadow="md" width={220} position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="sm" radius="md" title="Opciones de plantilla">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Label>Plantilla: {t.nombre}</Menu.Label>
                            <Menu.Item
                              leftSection={<IconTool size={15} color="#16a34a" />}
                              onClick={() => {
                                setTemplateForBuilder(t);
                                setBuilderOpened(true);
                              }}
                            >
                              Constructor de Campos
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconEye size={15} color="#2563eb" />}
                              onClick={() => {
                                setPreviewTemplate(t);
                                setPreviewOpened(true);
                              }}
                            >
                              Previsualizar
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconCopy size={15} color="#64748b" />}
                              onClick={() => handleDuplicateTemplate(t.id)}
                            >
                              Clonar Plantilla
                            </Menu.Item>
                            <Menu.Item
                              leftSection={t.is_active ? <IconToggleRight size={15} color="#16a34a" /> : <IconToggleLeft size={15} color="#94a3b8" />}
                              onClick={() => handleToggleTemplateActive(t.id)}
                            >
                              {t.is_active ? 'Desactivar Plantilla' : 'Activar Plantilla'}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          )}
        </Stack>
      )}

      {/* ==================================================================== */}
      {/* 4. MODAL WIZARD DE GENERACIÓN DE EXPEDIENTE                          */}
      {/* ==================================================================== */}
      <Modal
        opened={wizardOpened}
        onClose={() => setWizardOpened(false)}
        title="Generador Automatizado de Expedientes Veterinarios"
        size="xl"
        radius="lg"
      >
        <Stepper active={wizardStep} onStepClick={setWizardStep} mb="lg" color="vetGreen">
          <Stepper.Step label="Plantilla" description="Seleccionar formato">
            <Stack gap="md" mt="md">
              <Select
                label="Plantilla Veterinaria"
                placeholder="Elija la plantilla clínica a utilizar"
                data={templates.filter((t) => t.is_active).map((t) => ({ value: String(t.id), label: `${t.nombre} (v${t.version})` }))}
                value={selectedTemplate ? String(selectedTemplate.id) : null}
                onChange={(val) => {
                  const found = templates.find((t) => String(t.id) === val);
                  setSelectedTemplate(found || null);
                }}
                required
                radius="md"
              />
              <TextInput
                label="Asunto / Diagnóstico Clínico"
                placeholder="Ej: Certificado de Vacunación Canina"
                value={asunto}
                onChange={(e) => setAsunto(e.currentTarget.value)}
                required
                radius="md"
              />
              <TextInput
                label="Paciente / Solicitante"
                placeholder="Ej: Max (Golden Retriever) - Dueño: Carlos Gómez"
                value={solicitante}
                onChange={(e) => setSolicitante(e.currentTarget.value)}
                required
                radius="md"
              />
              <Group justify="flex-end" mt="md">
                <Button color="vetGreen" onClick={() => setWizardStep(1)} disabled={!selectedTemplate} radius="md">
                  Siguiente: Completar Datos
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Campos Dinámicos" description="Llenar variables">
            <Box mt="md">
              {selectedTemplate ? (
                <DynamicForm
                  fields={selectedTemplate.fields || []}
                  values={dynamicValues}
                  onChange={(identifier, val) => setDynamicValues((prev) => ({ ...prev, [identifier]: val }))}
                />
              ) : (
                <Text size="sm" c="dimmed">Seleccione una plantilla primero.</Text>
              )}
              <Group justify="space-between" mt="xl">
                <Button variant="default" onClick={() => setWizardStep(0)} radius="md">
                  Atrás
                </Button>
                <Button color="vetGreen" onClick={() => setWizardStep(2)} radius="md">
                  Siguiente: Resumen
                </Button>
              </Group>
            </Box>
          </Stepper.Step>

          <Stepper.Step label="Confirmación" description="Revisar y compilar">
            <Stack gap="md" mt="md">
              <Paper p="md" withBorder radius="md" bg="gray.0">
                <Text size="sm"><b>Plantilla:</b> {selectedTemplate?.nombre}</Text>
                <Text size="sm"><b>Asunto:</b> {asunto || 'Sin asunto'}</Text>
                <Text size="sm"><b>Paciente:</b> {solicitante || 'Sin solicitante'}</Text>
                <Text size="sm"><b>Variables completadas:</b> {Object.keys(dynamicValues).length}</Text>
              </Paper>
              <Group justify="space-between" mt="md">
                <Button variant="default" onClick={() => setWizardStep(1)} radius="md">
                  Atrás
                </Button>
                <Button
                  color="vetGreen"
                  loading={generating}
                  leftSection={<IconFileSpark size={18} />}
                  onClick={handleExecuteGeneration}
                  radius="md"
                >
                  Compilar y Generar Documento
                </Button>
              </Group>
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Stack align="center" gap="md" mt="xl">
              <ThemeIcon size={64} radius="xl" color="teal">
                <IconCheck size={36} />
              </ThemeIcon>
              <Title order={3} ta="center">¡Expediente Generado con Éxito!</Title>
              <Text size="sm" c="dimmed" ta="center">
                El documento N° <b>{generationResult?.numero_expediente}</b> fue generado, almacenado y registrado.
              </Text>
              <Group mt="md">
                {generationResult?.pdf_url && (
                  <Button
                    color="red"
                    leftSection={<IconDownload size={18} />}
                    component="a"
                    href={generationResult.pdf_url}
                    target="_blank"
                    radius="md"
                  >
                    Descargar PDF Oficial
                  </Button>
                )}
                <Button variant="outline" color="gray" onClick={() => setWizardOpened(false)} radius="md">
                  Cerrar
                </Button>
              </Group>
            </Stack>
          </Stepper.Completed>
        </Stepper>
      </Modal>

      {/* Constructor de Campos Dinámicos */}
      <Modal
        opened={builderOpened}
        onClose={() => setBuilderOpened(false)}
        title={`Constructor de Formulario: ${templateForBuilder?.nombre}`}
        size="90%"
        radius="lg"
      >
        {templateForBuilder && (
          <FormBuilder
            template={templateForBuilder}
            onUpdateTemplate={() => {
              fetchTemplates();
              setBuilderOpened(false);
            }}
          />
        )}
      </Modal>

      {/* Previsualización de Plantilla */}
      <Modal
        opened={previewOpened}
        onClose={() => setPreviewOpened(false)}
        title={`Previsualización: ${previewTemplate?.nombre}`}
        size="lg"
        radius="lg"
      >
        <Paper p="lg" withBorder radius="md" bg="gray.0">
          <div dangerouslySetInnerHTML={{ __html: previewTemplate?.content_preview || '<p>Contenido oficial estructurado.</p>' }} />
        </Paper>
      </Modal>

      {/* Modal de Confirmación para Eliminar Expediente */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Confirmar Eliminación de Expediente"
        centered
        radius="md"
      >
        <Stack gap="md">
          <Text size="sm">
            ¿Está seguro de que desea eliminar el expediente{' '}
            <b>{expedienteToDelete?.numero_expediente}</b>? Esta acción eliminará el registro documental de la base de datos.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setDeleteModalOpened(false)} radius="md">
              Cancelar
            </Button>
            <Button
              color="red"
              loading={deleting}
              leftSection={<IconTrash size={16} />}
              onClick={confirmDeleteExpediente}
              radius="md"
            >
              Confirmar Eliminación
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
