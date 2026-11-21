import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Tabs, Table, Text, Group, Button, TextInput, Select, Badge,
  ActionIcon, Card, Modal, Stepper, Stack, Paper, Title, Divider,
  Tooltip, Loader, Alert, SimpleGrid, ThemeIcon
} from '@mantine/core';
import {
  IconPlus, IconSearch, IconFilter, IconFileSpark, IconDownload,
  IconEye, IconTrash, IconTemplate, IconRefresh, IconCheck, IconAlertTriangle,
  IconExternalLink, IconCopy, IconTool, IconFiles, IconBrandGoogleDrive
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { Expediente, DocumentTemplate, DynamicField } from '../../types';
import { CustomBadge } from '../../components/ui/CustomBadge';
import { DynamicForm } from '../../components/forms/DynamicForm';
import { FormBuilder } from '../../components/forms/FormBuilder';
import { notifications } from '@mantine/notifications';

export const DocumentsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'templates' ? 'templates' : 'expedientes';

  const [activeTab, setActiveTab] = useState<string | null>(initialTab);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string | null>(null);

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

  const fetchExpedientes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('estado', statusFilter);
      if (templateFilter) params.append('template', templateFilter);

      const res = await api.get<{ results: Expediente[] } | Expediente[]>(`/documents/?${params.toString()}`);
      const items = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setExpedientes(items);
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudieron cargar los expedientes.', color: 'red' });
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
  }, [search, statusFilter, templateFilter]);

  // Handle URL action parameters (e.g., from Inicio shortcuts)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new' || action === 'generate') {
      handleOpenWizard();
    }
  }, [searchParams, templates]);

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
      // 1. Create Expediente
      const createRes = await api.post('/documents/', {
        asunto: asunto || `Expediente de ${selectedTemplate.nombre}`,
        solicitante: solicitante || 'Beneficiario Central',
        template: selectedTemplate.id,
        dynamic_values: dynamicValues,
      });

      const newExp = createRes.data;

      // 2. Trigger automated compilation & PDF generation
      const genRes = await api.post(`/documents/${newExp.id}/generate_document/`, {
        dynamic_values: dynamicValues,
      });

      setGenerationResult(genRes.data.expediente);
      setWizardStep(3); // Result step
      fetchExpedientes();
      notifications.show({
        title: 'Generación Exitosa',
        message: `El documento ${genRes.data.expediente.numero_expediente} fue compilado y guardado en Drive.`,
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
      notifications.show({ title: 'Plantilla duplicada', message: 'Copia creada exitosamente.', color: 'teal' });
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

  return (
    <Box>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Group justify="space-between" mb="lg">
          <Tabs.List>
            <Tabs.Tab value="expedientes" leftSection={<IconFiles size={18} />}>
              Expedientes Electrónicos
            </Tabs.Tab>
            <Tabs.Tab value="templates" leftSection={<IconTemplate size={18} />}>
              Plantillas Maestras ({templates.length})
            </Tabs.Tab>
          </Tabs.List>

          <Group gap="sm">
            {activeTab === 'expedientes' ? (
              <Button
                color="enterpriseBlue"
                leftSection={<IconFileSpark size={18} />}
                onClick={handleOpenWizard}
              >
                Generar Documento
              </Button>
            ) : (
              <Button
                color="enterpriseBlue"
                leftSection={<IconPlus size={18} />}
                onClick={() => {
                  if (templates.length > 0) {
                    setTemplateForBuilder(templates[0]);
                    setBuilderOpened(true);
                  }
                }}
              >
                Constructor de Campos
              </Button>
            )}
          </Group>
        </Group>

        {/* TAB 1: EXPEDIENTES ELECTRÓNICOS */}
        <Tabs.Panel value="expedientes">
          {/* Filters Bar */}
          <Paper p="md" mb="md" withBorder radius="md" bg="white">
            <Group justify="space-between">
              <Group style={{ flex: 1 }}>
                <TextInput
                  placeholder="Buscar por N° expediente, asunto o solicitante..."
                  leftSection={<IconSearch size={16} />}
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  style={{ width: 320 }}
                  size="sm"
                />

                <Select
                  placeholder="Filtrar por estado"
                  data={[
                    { value: '', label: 'Todos los estados' },
                    { value: 'GENERADO', label: 'Generados' },
                    { value: 'PENDIENTE', label: 'Pendientes' },
                    { value: 'EN_PROCESO', label: 'En Proceso' },
                    { value: 'ERROR', label: 'Con Errores' },
                    { value: 'OBSERVADO', label: 'Observados' },
                  ]}
                  value={statusFilter || ''}
                  onChange={(val) => setStatusFilter(val || null)}
                  clearable
                  size="sm"
                />

                <Select
                  placeholder="Filtrar por plantilla"
                  data={templates.map((t) => ({ value: String(t.id), label: t.nombre }))}
                  value={templateFilter || ''}
                  onChange={(val) => setTemplateFilter(val || null)}
                  clearable
                  size="sm"
                />
              </Group>

              <ActionIcon variant="light" color="gray" size="lg" onClick={fetchExpedientes} title="Refrescar">
                <IconRefresh size={18} />
              </ActionIcon>
            </Group>
          </Paper>

          {/* Table */}
          <Card p={0} radius="md" withBorder bg="white">
            <Table highlightOnHover verticalSpacing="sm">
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>N° Expediente</Table.Th>
                  <Table.Th>Asunto / Título</Table.Th>
                  <Table.Th>Plantilla</Table.Th>
                  <Table.Th>Fecha Creación</Table.Th>
                  <Table.Th>Responsable</Table.Th>
                  <Table.Th>Estado</Table.Th>
                  <Table.Th>Drive</Table.Th>
                  <Table.Th>PDF</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {loading ? (
                  <Table.Tr>
                    <Table.Td colSpan={9} style={{ textAlign: 'center', padding: 30 }}>
                      <Loader size="sm" />
                      <Text size="xs" c="dimmed" mt="xs">Cargando expedientes electrónicos...</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : expedientes.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>
                      <Text size="sm" c="dimmed">No se encontraron expedientes con los criterios seleccionados.</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  expedientes.map((exp) => (
                    <Table.Tr key={exp.id}>
                      <Table.Td fw={700} c="enterpriseBlue.8">
                        {exp.numero_expediente}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500} lineClamp={1}>{exp.asunto}</Text>
                        <Text size="xs" c="dimmed">Sol: {exp.solicitante}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" fw={500}>{exp.template_details?.nombre || 'General'}</Text>
                        <Badge size="xs" variant="outline" color="gray">{exp.template_details?.tipo || 'DOC'}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {new Date(exp.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          {exp.responsable_name || 'Sistema Central'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <CustomBadge status={exp.estado} />
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label={`Carpeta: ${exp.drive_folder_name || 'Expedientes Emitidos'}`}>
                          <Badge color="green" variant="light" size="xs" leftSection={<IconBrandGoogleDrive size={12} />}>
                            Drive
                          </Badge>
                        </Tooltip>
                      </Table.Td>
                      <Table.Td>
                        {exp.pdf_url ? (
                          <Button
                            component="a"
                            href={exp.pdf_url}
                            target="_blank"
                            size="compact-xs"
                            variant="light"
                            color="red"
                            leftSection={<IconDownload size={12} />}
                          >
                            PDF
                          </Button>
                        ) : (
                          <Text size="xs" c="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group gap={4} justify="flex-end">
                          {exp.estado !== 'GENERADO' && (
                            <Tooltip label="Compilar y Generar Documento">
                              <ActionIcon
                                color="teal"
                                variant="light"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    notifications.show({ title: 'Generando...', message: 'Compilando documento en Drive.', color: 'blue' });
                                    await api.post(`/documents/${exp.id}/generate_document/`);
                                    fetchExpedientes();
                                    notifications.show({ title: 'Generado', message: 'Documento completado.', color: 'teal' });
                                  } catch (e: any) {
                                    notifications.show({ title: 'Observación', message: e.response?.data?.detail || 'Error', color: 'red' });
                                    fetchExpedientes();
                                  }
                                }}
                              >
                                <IconFileSpark size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                          <Tooltip label="Descargar PDF Oficial">
                            <ActionIcon
                              component="a"
                              href={`/api/v1/documents/${exp.id}/download_pdf/`}
                              target="_blank"
                              color="blue"
                              variant="subtle"
                              size="sm"
                            >
                              <IconDownload size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        {/* TAB 2: PLANTILLAS MAESTRAS */}
        <Tabs.Panel value="templates">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {templates.map((tpl) => (
              <Card key={tpl.id} p="lg" radius="md" withBorder bg="white">
                <Group justify="space-between" mb="xs">
                  <Badge color="enterpriseBlue" size="md">
                    {tpl.tipo}
                  </Badge>
                  <Group gap="xs">
                    <Badge color={tpl.is_active ? 'teal' : 'gray'} variant="light" size="sm">
                      {tpl.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                    <Badge color="dark" variant="outline" size="sm">
                      v{tpl.version}
                    </Badge>
                  </Group>
                </Group>

                <Text fw={700} size="md" c="dark.8" mb={4}>
                  {tpl.nombre}
                </Text>
                <Text size="xs" c="dimmed" mb="md" lineClamp={2}>
                  {tpl.descripcion}
                </Text>

                <Paper p="xs" bg="gray.0" radius="sm" mb="md">
                  <Text size="11px" c="dimmed">
                    Nomenclatura: <Text span fw={600} ff="monospace" c="dark.7">{tpl.naming_pattern}</Text>
                  </Text>
                  <Text size="11px" c="dimmed">
                    Campos dinámicos: <Text span fw={600} c="dark.7">{tpl.fields?.length || tpl.fields_count || 0}</Text> configurados
                  </Text>
                </Paper>

                <Group justify="space-between" mt="auto">
                  <Button
                    size="xs"
                    variant="light"
                    color="enterpriseBlue"
                    leftSection={<IconTool size={14} />}
                    onClick={() => {
                      setTemplateForBuilder(tpl);
                      setBuilderOpened(true);
                    }}
                  >
                    Constructor de Campos
                  </Button>

                  <Group gap={6}>
                    <Tooltip label="Previsualizar Plantilla">
                      <ActionIcon
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setPreviewTemplate(tpl);
                          setPreviewOpened(true);
                        }}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Duplicar Plantilla">
                      <ActionIcon
                        variant="default"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(tpl.id)}
                      >
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Button
                      size="xs"
                      variant="subtle"
                      color={tpl.is_active ? 'orange' : 'teal'}
                      onClick={() => handleToggleTemplateActive(tpl.id)}
                    >
                      {tpl.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </Group>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Tabs.Panel>
      </Tabs>

      {/* WIZARD MODAL: 10-Step Automated Document Generation */}
      <Modal
        opened={wizardOpened}
        onClose={() => setWizardOpened(false)}
        title={
          <Group gap="xs">
            <IconFileSpark size={22} color="#0b7285" />
            <Text fw={700} size="md">Asistente de Generación y Automatización Documental</Text>
          </Group>
        }
        size="xl"
        centered
      >
        <Stepper active={wizardStep} onStepClick={setWizardStep} mb="xl">
          <Stepper.Step label="1. Plantilla" description="Selección de modelo" />
          <Stepper.Step label="2. Formulario" description="Carga de campos" />
          <Stepper.Step label="3. Revisión" description="Validar y confirmar" />
          <Stepper.Step label="4. Resultado" description="PDF y Drive" />
        </Stepper>

        {/* STEP 0: Seleccionar Plantilla */}
        {wizardStep === 0 && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Seleccione la plantilla maestra que servirá de base. El sistema trabajará sobre una copia independiente en Google Drive sin alterar la plantilla original.
            </Text>

            <TextInput
              label="Asunto / Requerimiento del Expediente"
              placeholder="Ej. Servicio de consultoría e infraestructura cloud"
              required
              value={asunto}
              onChange={(e) => setAsunto(e.currentTarget.value)}
            />

            <TextInput
              label="Solicitante / Beneficiario"
              placeholder="Ej. Consultores Andinos S.A. / Lic. Juan Pérez"
              required
              value={solicitante}
              onChange={(e) => setSolicitante(e.currentTarget.value)}
            />

            <Select
              label="Plantilla Maestra"
              placeholder="Seleccione la plantilla..."
              data={templates.filter((t) => t.is_active).map((t) => ({ value: String(t.id), label: `${t.nombre} (${t.tipo})` }))}
              value={selectedTemplate ? String(selectedTemplate.id) : null}
              onChange={(val) => {
                const found = templates.find((t) => String(t.id) === val);
                if (found) setSelectedTemplate(found);
              }}
              required
            />

            <Group justify="flex-end" mt="md">
              <Button
                color="enterpriseBlue"
                disabled={!selectedTemplate || !asunto.trim() || !solicitante.trim()}
                onClick={() => setWizardStep(1)}
              >
                Siguiente: Completar Formulario
              </Button>
            </Group>
          </Stack>
        )}

        {/* STEP 1: Formulario Dinámico */}
        {wizardStep === 1 && selectedTemplate && (
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text fw={700} size="sm">{selectedTemplate.nombre}</Text>
                <Text size="xs" c="dimmed">Diligencie los campos requeridos para la sustitución de etiquetas en Google Docs.</Text>
              </div>
              <Badge color="enterpriseBlue">v{selectedTemplate.version}</Badge>
            </Group>
            <Divider />

            <DynamicForm
              fields={selectedTemplate.fields || []}
              values={dynamicValues}
              onChange={(ident, val) => setDynamicValues((prev) => ({ ...prev, [ident]: val }))}
            />

            <Group justify="space-between" mt="md">
              <Button variant="default" onClick={() => setWizardStep(0)}>
                Atrás
              </Button>
              <Button color="enterpriseBlue" onClick={() => setWizardStep(2)}>
                Siguiente: Revisar Información
              </Button>
            </Group>
          </Stack>
        )}

        {/* STEP 2: Revisión y Confirmación */}
        {wizardStep === 2 && selectedTemplate && (
          <Stack gap="md">
            <Alert icon={<IconCheck size={16} />} title="Información Lista para Compilación" color="teal">
              Al confirmar, el sistema clonará la plantilla en Google Drive, sustituirá las etiquetas, compilará el archivo oficial y exportará el PDF con firma digital.
            </Alert>

            <Paper p="md" withBorder radius="md">
              <Text fw={700} size="sm" mb="xs">Resumen del Expediente:</Text>
              <Text size="xs"><b>Asunto:</b> {asunto}</Text>
              <Text size="xs"><b>Solicitante:</b> {solicitante}</Text>
              <Text size="xs"><b>Plantilla:</b> {selectedTemplate.nombre}</Text>
              <Divider my="xs" />
              <Text fw={700} size="xs" mb={4}>Campos Diligenciados:</Text>
              <Stack gap={2}>
                {Object.entries(dynamicValues).map(([k, v]) => (
                  <Text size="11px" key={k} c="dimmed">
                    <b>{k}:</b> {String(v)}
                  </Text>
                ))}
              </Stack>
            </Paper>

            <Group justify="space-between" mt="md">
              <Button variant="default" onClick={() => setWizardStep(1)} disabled={generating}>
                Atrás
              </Button>
              <Button
                color="teal"
                leftSection={<IconFileSpark size={16} />}
                loading={generating}
                onClick={handleExecuteGeneration}
              >
                Confirmar y Generar Documento
              </Button>
            </Group>
          </Stack>
        )}

        {/* STEP 3: Resultado */}
        {wizardStep === 3 && generationResult && (
          <Stack gap="md" align="center" p="md">
            <ThemeIcon color="teal" size={60} radius="xl">
              <IconCheck size={36} />
            </ThemeIcon>
            <Title order={3} fw={800} c="dark.8" ta="center">
              ¡Documento Generado Exitosamente!
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              El expediente <b>{generationResult.numero_expediente}</b> se compiló en {generationResult.processing_time_seconds || 1.8}s y se almacenó en Google Drive.
            </Text>

            <Group mt="lg">
              <Button
                component="a"
                href={generationResult.pdf_url}
                target="_blank"
                color="red"
                leftSection={<IconDownload size={18} />}
              >
                Descargar PDF Oficial
              </Button>

              <Button
                component="a"
                href={generationResult.google_doc_url}
                target="_blank"
                variant="light"
                color="blue"
                leftSection={<IconExternalLink size={18} />}
              >
                Abrir en Google Drive
              </Button>
            </Group>

            <Button variant="default" mt="md" onClick={() => setWizardOpened(false)}>
              Cerrar Asistente
            </Button>
          </Stack>
        )}
      </Modal>

      {/* FORM BUILDER MODAL */}
      <Modal
        opened={builderOpened}
        onClose={() => setBuilderOpened(false)}
        title={
          <Group gap="xs">
            <IconTool size={22} color="#0b7285" />
            <Text fw={700} size="md">
              Constructor Dinámico de Campos: {templateForBuilder?.nombre}
            </Text>
          </Group>
        }
        size="90%"
        centered
      >
        {templateForBuilder && (
          <FormBuilder
            template={templateForBuilder}
            onUpdateTemplate={fetchTemplates}
          />
        )}
      </Modal>

      {/* TEMPLATE PREVIEW MODAL */}
      <Modal
        opened={previewOpened}
        onClose={() => setPreviewOpened(false)}
        title={
          <Group gap="xs">
            <IconEye size={20} color="#0b7285" />
            <Text fw={700} size="md">Previsualización de Plantilla Maestra</Text>
          </Group>
        }
        size="lg"
        centered
      >
        {previewTemplate && (
          <Box
            p="md"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              maxHeight: '65vh',
              overflowY: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: previewTemplate.content_preview || '<p>Plantilla base.</p>' }}
          />
        )}
      </Modal>
    </Box>
  );
};
