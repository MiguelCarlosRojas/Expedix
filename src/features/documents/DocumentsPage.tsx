import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Table, Text, Group, Button, TextInput, Select, Badge,
  ActionIcon, Card, Modal, Stepper, Stack, Paper, Title, Divider,
  Tooltip, Alert, SimpleGrid, ThemeIcon, ScrollArea, Menu
} from '@mantine/core';
import {
  IconPlus, IconSearch, IconFilter, IconFileSpark, IconDownload,
  IconEye, IconTrash, IconTemplate, IconRefresh, IconCheck, IconAlertTriangle,
  IconExternalLink, IconCopy, IconTool, IconFiles, IconBrandGoogleDrive,
  IconPaw, IconStethoscope, IconFileCertificate, IconFilterOff,
  IconDotsVertical, IconToggleLeft, IconToggleRight
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { Expediente, DocumentTemplate, DynamicField } from '../../types';
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

export const DocumentsPage: React.FC = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { getFilter, setFilter, setFilters, clearFilters } = useUrlFilters();

  // Mapeo de categoría desde ruta URL o parámetro query
  const activeCategory = category || getFilter('categoria', 'todos');
  const activeTab = activeCategory === 'plantillas' ? 'templates' : 'expedientes';

  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros sincronizados con Query Parameters
  const search = getFilter('search', '');
  const statusFilter = getFilter('estado', '');
  const templateFilter = getFilter('template', '');

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

  // Hook de ordenamiento universal para tabla de expedientes
  const { sortedData: sortedExpedientes, sortConfig, requestSort } = useSortableData(filteredExpedientes, 'created_at', 'desc');

  // Hook de ordenamiento para tabla de plantillas
  const { sortedData: sortedTemplates, sortConfig: templateSortConfig, requestSort: requestTemplateSort } = useSortableData(templates, 'nombre', 'asc');

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

  const categoryTitles: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
    todos: {
      title: 'Todos los Expedientes Veterinarios',
      desc: 'Registro integral de expedientes clínicos, certificaciones médicas y trámites institucionales.',
      icon: <IconFiles size={24} color="#16a34a" />,
    },
    historias: {
      title: 'Historias Clínicas & Fichas Médicas',
      desc: 'Atención médica de pacientes animales, diagnósticos, evolución clínica y tratamientos prescritos.',
      icon: <IconPaw size={24} color="#16a34a" />,
    },
    certificados: {
      title: 'Certificados de Salud & Consentimientos',
      desc: 'Certificaciones sanitarias oficiales, actas de alta hospitalaria y autorizaciones quirúrgicas.',
      icon: <IconFileCertificate size={24} color="#16a34a" />,
    },
    plantillas: {
      title: 'Plantillas Maestras & Form Builder',
      desc: 'Diseño y versionado de plantillas documentales con 14 tipos de campos dinámicos.',
      icon: <IconTemplate size={24} color="#16a34a" />,
    },
  };

  const currentCatInfo = categoryTitles[activeCategory] || categoryTitles.todos;

  return (
    <Box className="anim-fade-in">
      {/* Título de la Sección con Identidad Veterinaria */}
      <Box mb="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Group gap="xs" mb={4}>
              <Badge color="vetGreen" variant="light" size="sm">
                Gestión Clínica & Documental
              </Badge>
            </Group>
            <Title order={2} fw={800} c="dark.8">
              {currentCatInfo.title}
            </Title>
            <Text c="dimmed" size="sm" mt={2}>
              {currentCatInfo.desc}
            </Text>
          </div>

          <Group gap="sm">
            {activeTab === 'expedientes' ? (
              <Button
                color="vetGreen"
                leftSection={<IconFileSpark size={18} />}
                onClick={handleOpenWizard}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                  },
                }}
              >
                Generar Expediente
              </Button>
            ) : (
              <Button
                color="vetGreen"
                leftSection={<IconPlus size={18} />}
                onClick={() => {
                  if (templates.length > 0) {
                    setTemplateForBuilder(templates[0]);
                    setBuilderOpened(true);
                  }
                }}
              >
                Nuevo Campo Dinámico
              </Button>
            )}
          </Group>
        </Group>
      </Box>

      {/* Tabs Principales de Navegación */}
      <Tabs
        value={activeTab}
        onChange={(val) => {
          if (val === 'templates') {
            navigate('/app/documentos/plantillas');
          } else {
            navigate('/app/documentos/todos');
          }
        }}
        mb="md"
      >
        <Tabs.List>
          <Tabs.Tab value="expedientes" leftSection={<IconFiles size={16} />}>
            Expedientes
          </Tabs.Tab>
          <Tabs.Tab value="templates" leftSection={<IconTemplate size={16} />}>
            Plantillas Maestras
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* ==================================================================== */}
      {/* PESTAÑA 1: LISTADO DE EXPEDIENTES                                    */}
      {/* ==================================================================== */}
      {activeTab === 'expedientes' && (
        <Stack gap="md">
          {/* Barra de Filtros Sincronizada con la URL */}
          <Paper p="md" radius="md" withBorder bg="white" shadow="xs">
            <Group justify="space-between" wrap="wrap">
              <Group gap="sm" style={{ flex: 1, minWidth: 260 }}>
                <TextInput
                  placeholder="Buscar por N° expediente, paciente o diagnóstico..."
                  leftSection={<IconSearch size={16} color="#16a34a" />}
                  value={search}
                  onChange={(e) => setFilter('search', e.currentTarget.value)}
                  style={{ flex: 1, minWidth: 240 }}
                  size="sm"
                  radius="md"
                />
                <Select
                  placeholder="Estado"
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
                  style={{ width: 170 }}
                  size="sm"
                  radius="md"
                />
                <Select
                  placeholder="Plantilla"
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
                  onClick={fetchExpedientes}
                  title="Refrescar expedientes"
                >
                  <IconRefresh size={18} />
                </ActionIcon>
                {(search || statusFilter || templateFilter) && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    leftSection={<IconFilterOff size={14} />}
                    onClick={() => clearFilters(['categoria'])}
                  >
                    Limpiar
                  </Button>
                )}
              </Group>

              <Text size="xs" c="dimmed">
                {sortedExpedientes.length} expedientes encontrados
              </Text>
            </Group>
          </Paper>

          {/* Estado de Error o Skeleton */}
          {error && <ErrorState message={error} onRetry={fetchExpedientes} />}

          {loading && !error && <TableSkeleton rows={6} columns={6} />}

          {/* Tabla de Expedientes con Ordenamiento en TODAS las Columnas */}
          {!loading && !error && (
            <Paper p="md" radius="md" withBorder bg="white" shadow="xs" style={{ overflowX: 'auto' }}>
              {sortedExpedientes.length === 0 ? (
                <EmptyState
                  title="No se encontraron expedientes"
                  description="No hay registros que coincidan con los filtros aplicados o aún no se han generado documentos en esta categoría."
                  actionText="Nuevo Expediente Veterinario"
                  onAction={handleOpenWizard}
                />
              ) : (
                <Table highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead bg="gray.0">
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
                            <Text size="sm" fw={600} c="dark.7">
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
                              <Menu.Label>Expediente {exp.numero_expediente}</Menu.Label>
                              {exp.pdf_url && (
                                <Menu.Item
                                  leftSection={<IconDownload size={15} color="#ef4444" />}
                                  component="a"
                                  href={exp.pdf_url}
                                  target="_blank"
                                >
                                  Descargar PDF Oficial
                                </Menu.Item>
                              )}
                              {!exp.pdf_url && (
                                <Menu.Item
                                  leftSection={<IconFileSpark size={15} color="#16a34a" />}
                                  onClick={async () => {
                                    try {
                                      await api.post(`/documents/${exp.id}/generate_document/`);
                                      notifications.show({ title: 'Generando', message: 'Iniciando compilación...', color: 'teal' });
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
              )}
            </Paper>
          )}
        </Stack>
      )}

      {/* ==================================================================== */}
      {/* PESTAÑA 2: GESTOR DE PLANTILLAS MAESTRAS                              */}
      {/* ==================================================================== */}
      {activeTab === 'templates' && (
        <Stack gap="md">
          <Paper p="md" radius="md" withBorder bg="white" shadow="xs" style={{ overflowX: 'auto' }}>
            <Table highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead bg="gray.0">
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
                {sortedTemplates.map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td p="sm">
                      <Group gap="xs">
                        <ThemeIcon size={28} radius="md" color="vetGreen" variant="light">
                          <IconTemplate size={16} color="#16a34a" />
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
                      <Badge size="sm" variant="outline" color="vetGreen">
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
          </Paper>
        </Stack>
      )}

      {/* ==================================================================== */}
      {/* WIZARD DE GENERACIÓN DE EXPEDIENTE                                   */}
      {/* ==================================================================== */}
      <Modal
        opened={wizardOpened}
        onClose={() => setWizardOpened(false)}
        title="Generador Automatizado de Expedientes Veterinarios"
        size="xl"
      >
        <Stepper active={wizardStep} onStepClick={setWizardStep} mb="lg">
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
              />
              <TextInput
                label="Asunto / Diagnóstico Clínico"
                placeholder="Ej: Certificado de Vacunación Canina"
                value={asunto}
                onChange={(e) => setAsunto(e.currentTarget.value)}
                required
              />
              <TextInput
                label="Paciente / Solicitante"
                placeholder="Ej: Max (Golden Retriever) - Dueño: Carlos Gómez"
                value={solicitante}
                onChange={(e) => setSolicitante(e.currentTarget.value)}
                required
              />
              <Group justify="flex-end" mt="md">
                <Button color="vetGreen" onClick={() => setWizardStep(1)} disabled={!selectedTemplate}>
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
                <Button variant="default" onClick={() => setWizardStep(0)}>
                  Atrás
                </Button>
                <Button color="vetGreen" onClick={() => setWizardStep(2)}>
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
                <Button variant="default" onClick={() => setWizardStep(1)}>
                  Atrás
                </Button>
                <Button
                  color="vetGreen"
                  loading={generating}
                  leftSection={<IconFileSpark size={18} />}
                  onClick={handleExecuteGeneration}
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
                  >
                    Descargar PDF Oficial
                  </Button>
                )}
                <Button variant="outline" color="gray" onClick={() => setWizardOpened(false)}>
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
            <Button variant="default" onClick={() => setDeleteModalOpened(false)}>
              Cancelar
            </Button>
            <Button
              color="red"
              loading={deleting}
              leftSection={<IconTrash size={16} />}
              onClick={confirmDeleteExpediente}
            >
              Confirmar Eliminación
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
