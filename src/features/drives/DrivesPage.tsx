import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Group, Text, Button, TextInput, Select, Menu, ActionIcon,
  SimpleGrid, Card, Table, Badge, Breadcrumbs, Anchor, Modal, Stack,
  FileInput, Loader, Tooltip, Alert, ThemeIcon, Title, Divider, Skeleton
} from '@mantine/core';
import {
  IconFolder, IconFileText, IconFileSpreadsheet, IconFilePlus,
  IconFolderPlus, IconUpload, IconSearch, IconLayoutGrid, IconList,
  IconDotsVertical, IconTrash, IconEdit, IconArrowsMove, IconExternalLink,
  IconCheck, IconAlertTriangle, IconBrandGoogleDrive, IconPlus, IconArrowLeft,
  IconFolderOff, IconFileCertificate, IconX, IconFiles, IconSparkles, IconInfoCircle
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { DriveExplorerData, DriveFolderItem, DriveFileItem } from '../../types';
import { UniverSpreadsheetEditor } from '../../components/editors/UniverSpreadsheetEditor';
import { GoogleDocsEditor } from '../../components/editors/GoogleDocsEditor';
import { notifications } from '@mantine/notifications';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

export const DrivesPage: React.FC = () => {
  const [data, setData] = useState<DriveExplorerData | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');

  const [newDocModal, setNewDocModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<'doc' | 'sheet'>('doc');

  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [renameModal, setRenameModal] = useState(false);
  const [itemToRename, setItemToRename] = useState<{ id: number; name: string; is_folder: boolean } | null>(null);
  const [newName, setNewName] = useState('');

  // Active Embedded Editors
  const [activeEditor, setActiveEditor] = useState<{
    type: 'sheet' | 'doc';
    fileId: number;
    fileName: string;
  } | null>(null);

  const fetchContents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (currentFolderId) params.append('folder_id', String(currentFolderId));
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);

      const res = await api.get<DriveExplorerData>(`/drives/explorer/?${params.toString()}`);
      setData(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'No se pudo conectar con el explorador de Google Drive.');
      notifications.show({ title: 'Error de sincronización', message: 'No se pudo cargar el explorador de Drive.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [currentFolderId, search, typeFilter]);

  // Client-side search & filtering helpers
  const filteredFolders = useMemo(() => {
    if (!data?.folders) return [];
    if (!search.trim()) return data.folders;
    const term = search.toLowerCase();
    return data.folders.filter((f) => f.name.toLowerCase().includes(term));
  }, [data?.folders, search]);

  const filteredFiles = useMemo(() => {
    if (!data?.files) return [];
    let items = data.files;
    if (search.trim()) {
      const term = search.toLowerCase();
      items = items.filter((fl) => fl.name.toLowerCase().includes(term));
    }
    if (typeFilter) {
      if (typeFilter === 'docs') items = items.filter((fl) => fl.mime_type.includes('document'));
      if (typeFilter === 'sheets') items = items.filter((fl) => fl.mime_type.includes('spreadsheet') || fl.name.endsWith('.xlsx'));
      if (typeFilter === 'pdf') items = items.filter((fl) => fl.mime_type.includes('pdf') || fl.name.endsWith('.pdf'));
    }
    return items;
  }, [data?.files, search, typeFilter]);

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await api.post('/drives/create-folder/', {
        name: folderName,
        parent_id: currentFolderId,
      });
      setNewFolderModal(false);
      setFolderName('');
      fetchContents();
      notifications.show({ title: 'Carpeta creada', message: 'Carpeta creada con éxito en Google Drive.', color: 'teal', icon: <IconCheck size={18} /> });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Fallo al crear la carpeta en Google Drive.', color: 'red' });
    }
  };

  const handleCreateDocument = async () => {
    if (!docName.trim()) return;
    try {
      const res = await api.post('/drives/create-document/', {
        name: docName,
        type: docType,
        folder_id: currentFolderId,
      });
      setNewDocModal(false);
      setDocName('');
      fetchContents();

      notifications.show({
        title: 'Documento creado',
        message: `${docType === 'sheet' ? 'Hoja de cálculo Univer' : 'Documento Google Docs'} creado en Drive.`,
        color: 'teal',
        icon: <IconCheck size={18} />,
      });

      // Automatically open in embedded editor
      if (docType === 'sheet') {
        setActiveEditor({ type: 'sheet', fileId: res.data.id, fileName: res.data.name });
      } else {
        setActiveEditor({ type: 'doc', fileId: res.data.id, fileName: res.data.name });
      }
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo crear el archivo.', color: 'red' });
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (currentFolderId) formData.append('folder_id', String(currentFolderId));

    try {
      await api.post('/drives/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadModal(false);
      setSelectedFile(null);
      fetchContents();
      notifications.show({ title: 'Carga completada', message: 'Archivo subido a Google Drive correctamente.', color: 'teal', icon: <IconCheck size={18} /> });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Error durante la carga del archivo a Drive.', color: 'red' });
    }
  };

  const handleRename = async () => {
    if (!itemToRename || !newName.trim()) return;
    try {
      const endpoint = itemToRename.is_folder ? `/drives/folders/${itemToRename.id}/` : `/drives/files/${itemToRename.id}/`;
      await api.patch(endpoint, { name: newName });
      setRenameModal(false);
      setItemToRename(null);
      fetchContents();
      notifications.show({ title: 'Renombrado exitoso', message: 'El elemento fue actualizado en Google Drive.', color: 'teal', icon: <IconCheck size={18} /> });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Fallo al renombrar el elemento.', color: 'red' });
    }
  };

  const handleDeleteItem = async (id: number, is_folder: boolean) => {
    try {
      const endpoint = is_folder ? `/drives/folders/${id}/` : `/drives/files/${id}/`;
      await api.delete(endpoint);
      fetchContents();
      notifications.show({ title: 'Papelera', message: 'Elemento enviado a la papelera de Drive.', color: 'gray', icon: <IconTrash size={18} /> });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo eliminar el elemento.', color: 'red' });
    }
  };

  // If an embedded editor is active, render it full view
  if (activeEditor) {
    if (activeEditor.type === 'sheet') {
      return (
        <UniverSpreadsheetEditor
          fileId={activeEditor.fileId}
          fileName={activeEditor.fileName}
          onClose={() => {
            setActiveEditor(null);
            fetchContents();
          }}
        />
      );
    } else {
      return (
        <GoogleDocsEditor
          fileId={activeEditor.fileId}
          fileName={activeEditor.fileName}
          onClose={() => {
            setActiveEditor(null);
            fetchContents();
          }}
        />
      );
    }
  }

  const breadcrumbsList = data?.breadcrumbs || [{ id: null, name: 'Mi Unidad Drive' }];
  const currentFolderName = breadcrumbsList[breadcrumbsList.length - 1]?.name || 'Mi Unidad Drive';
  const isInsideSubfolder = currentFolderId !== null;

  return (
    <Box className="anim-fade-in">
      {/* ==================================================================== */}
      {/* 1. ENCABEZADO MODERNO DEL EXPLORADOR GOOGLE DRIVE                   */}
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
        <Group justify="space-between" align="center" wrap="nowrap">
          <Box style={{ position: 'relative', zIndex: 1, maxWidth: '100%' }}>
            <Group gap="xs" mb={8} wrap="nowrap">
              <Box
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                <IconBrandGoogleDrive size={13} color="#86efac" />
                <Text size="11px" fw={700} style={{ letterSpacing: '0.4px', textTransform: 'uppercase', color: '#ecfdf5' }}>
                  Expedix Vet • Almacenamiento Documental
                </Text>
              </Box>
            </Group>

            <Title
              order={1}
              style={{
                fontSize: 'clamp(20px, 3.2vw, 30px)',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.5px',
                lineHeight: 1.15,
                margin: '4px 0 8px 0',
              }}
            >
              Explorador de Google Drive
            </Title>

            <Text
              size="sm"
              style={{
                color: '#d1fae5',
                lineHeight: 1.5,
                width: '100%',
                fontWeight: 400,
              }}
            >
              Organiza, consulta y administra los documentos y carpetas institucionales desde un espacio centralizado.
            </Text>
          </Box>

          <Box
            visibleFrom="sm"
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconBrandGoogleDrive size={44} color="#86efac" />
          </Box>
        </Group>
      </Paper>

      {/* ==================================================================== */}
      {/* 2. BARRA DE HERRAMIENTAS: BOTÓN NUEVO, BUSCADOR Y MODO DE VISTA      */}
      {/* ==================================================================== */}
      <Paper p="md" mb="md" withBorder radius="lg" bg="white" shadow="xs">
        <Group justify="space-between" wrap="wrap" gap="md">
          {/* Botón Principal "NUEVO" con Gradiente VetGreen */}
          <Menu shadow="md" width={240} position="bottom-start" withinPortal transitionProps={{ transition: 'pop', duration: 150 }}>
            <Menu.Target>
              <Button
                color="vetGreen"
                size="sm"
                radius="md"
                leftSection={<IconPlus size={18} stroke={2.5} />}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                    fontWeight: 700,
                    transition: 'all 0.18s ease',
                  },
                }}
              >
                Nuevo
              </Button>
            </Menu.Target>

            <Menu.Dropdown className="vet-menu-dropdown">
              <Menu.Label>Crear o Subir a Drive</Menu.Label>
              <Menu.Item
                leftSection={<IconFolderPlus size={16} color="#d97706" />}
                onClick={() => setNewFolderModal(true)}
              >
                Nueva carpeta
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconFileText size={16} color="#2563eb" />}
                onClick={() => {
                  setDocType('doc');
                  setDocName('');
                  setNewDocModal(true);
                }}
              >
                Documento de Google Docs
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFileSpreadsheet size={16} color="#15803d" />}
                onClick={() => {
                  setDocType('sheet');
                  setDocName('');
                  setNewDocModal(true);
                }}
              >
                Hoja de cálculo Univer (Sheets)
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconUpload size={16} color="#7c3aed" />}
                onClick={() => setUploadModal(true)}
              >
                Cargar archivo
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Buscador de Drive y Selector de Tipo */}
          <Group style={{ flex: 1, minWidth: 280 }} wrap="wrap" gap="sm">
            <TextInput
              placeholder="Buscar archivos y carpetas en Drive..."
              leftSection={<IconSearch size={18} color="#15803d" />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              rightSection={
                search ? (
                  <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">
                    <IconX size={13} />
                  </ActionIcon>
                ) : null
              }
              style={{ flex: 1, minWidth: 260 }}
              size="sm"
              radius="md"
            />
            <Select
              placeholder="Tipo de archivo"
              data={[
                { value: '', label: 'Todos los tipos' },
                { value: 'docs', label: 'Google Docs' },
                { value: 'sheets', label: 'Hojas de Cálculo' },
                { value: 'pdf', label: 'Documentos PDF' },
              ]}
              value={typeFilter || ''}
              onChange={(val) => setTypeFilter(val || null)}
              size="sm"
              radius="md"
              style={{ width: 180 }}
            />
          </Group>

          {/* Alternador de Modo de Vista (Cuadrícula / Lista) - Sin botón refrescar */}
          <Group gap="xs">
            <Tooltip label="Vista de cuadrícula" withArrow position="top" withinPortal>
              <ActionIcon
                variant={viewMode === 'grid' ? 'filled' : 'subtle'}
                color="vetGreen"
                size="md"
                radius="md"
                onClick={() => setViewMode('grid')}
                aria-label="Vista de cuadrícula"
              >
                <IconLayoutGrid size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Vista de lista" withArrow position="top" withinPortal>
              <ActionIcon
                variant={viewMode === 'list' ? 'filled' : 'subtle'}
                color="vetGreen"
                size="md"
                radius="md"
                onClick={() => setViewMode('list')}
                aria-label="Vista de lista"
              >
                <IconList size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Paper>

      {/* ==================================================================== */}
      {/* 3. BREADCRUMBS Y NAVEGACIÓN JERÁRQUICA                               */}
      {/* ==================================================================== */}
      <Paper p="sm" px="md" mb="md" withBorder radius="md" bg="white" shadow="xs">
        <Group justify="space-between" align="center" wrap="wrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            {isInsideSubfolder && (
              <Tooltip label="Volver a la carpeta anterior" withArrow position="top" withinPortal>
                <ActionIcon
                  variant="light"
                  color="vetGreen"
                  size="sm"
                  radius="md"
                  onClick={() => {
                    const prevIdx = breadcrumbsList.length - 2;
                    if (prevIdx >= 0) {
                      setCurrentFolderId(breadcrumbsList[prevIdx].id);
                    } else {
                      setCurrentFolderId(null);
                    }
                  }}
                  aria-label="Volver"
                  style={{ border: '1px solid #bbf7d0' }}
                >
                  <IconArrowLeft size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <IconBrandGoogleDrive size={18} color="#15803d" style={{ flexShrink: 0 }} />
            <Breadcrumbs separator="/" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {breadcrumbsList.map((crumb, idx, arr) => (
                <Anchor
                  key={idx}
                  size="sm"
                  fw={idx === arr.length - 1 ? 700 : 500}
                  c={idx === arr.length - 1 ? 'vetGreen.9' : 'dimmed'}
                  onClick={() => setCurrentFolderId(crumb.id)}
                  style={{ cursor: 'pointer', textDecoration: 'none' }}
                >
                  {crumb.name}
                </Anchor>
              ))}
            </Breadcrumbs>
          </Group>

          {/* Indicadores de Recuento Real */}
          <Group gap="xs">
            <Badge color="yellow" variant="light" size="sm" radius="md">
              {filteredFolders.length} {filteredFolders.length === 1 ? 'carpeta' : 'carpetas'}
            </Badge>
            <Badge color="vetGreen" variant="light" size="sm" radius="md">
              {filteredFiles.length} {filteredFiles.length === 1 ? 'archivo' : 'archivos'}
            </Badge>
          </Group>
        </Group>
      </Paper>

      {/* ==================================================================== */}
      {/* 4. CONTENIDO DEL EXPLORADOR: CARPETAS Y ARCHIVOS                     */}
      {/* ==================================================================== */}
      {error && <ErrorState message={error} onRetry={fetchContents} />}

      {loading && !error && (
        <Stack gap="md">
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} p="md" radius="md" withBorder bg="white">
                <Group gap="sm">
                  <Skeleton height={44} width={44} radius="md" />
                  <Box style={{ flex: 1 }}>
                    <Skeleton height={14} width="70%" mb={8} radius="xs" />
                    <Skeleton height={10} width="40%" radius="xs" />
                  </Box>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      )}

      {!loading && !error && (
        <>
          {filteredFolders.length === 0 && filteredFiles.length === 0 ? (
            search || typeFilter ? (
              <EmptyState
                isFilterEmpty={true}
                icon={<IconSearch size={38} color="#15803d" />}
                title="No se encontraron coincidencias en Drive"
                description={`No hay carpetas ni archivos que coincidan con los criterios de búsqueda aplicados.`}
                secondaryActionText="Limpiar búsqueda"
                onSecondaryAction={() => {
                  setSearch('');
                  setTypeFilter(null);
                }}
              />
            ) : (
              <EmptyState
                isFilterEmpty={false}
                icon={<IconFolderOff size={42} color="#15803d" />}
                title="No hay archivos en esta ubicación"
                description="Los documentos y expedientes que agregues o compiles en esta carpeta aparecerán aquí de forma automática."
                actionText="Nueva Carpeta"
                onAction={() => setNewFolderModal(true)}
                secondaryActionText="Cargar Archivo"
                onSecondaryAction={() => setUploadModal(true)}
              />
            )
          ) : viewMode === 'grid' ? (
            <Stack gap="xl">
              {/* Sección de Carpetas */}
              {filteredFolders.length > 0 && (
                <Box>
                  <Group gap="xs" mb="sm" align="center">
                    <IconFolder size={18} color="#d97706" />
                    <Text fw={700} size="sm" c="dark.8" tt="uppercase" style={{ letterSpacing: '0.4px' }}>
                      Carpetas ({filteredFolders.length})
                    </Text>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {filteredFolders.map((folder) => (
                      <Card
                        key={folder.id}
                        p="md"
                        radius="md"
                        withBorder
                        bg="white"
                        className="interactive-card"
                        style={{
                          cursor: 'pointer',
                          borderColor: '#e2e8f0',
                          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onClick={() => setCurrentFolderId(folder.id)}
                      >
                        <Group justify="space-between" align="center" wrap="nowrap">
                          <Group gap="sm" style={{ flex: 1, minWidth: 0 }} wrap="nowrap">
                            <ThemeIcon
                              size={44}
                              radius="md"
                              variant="light"
                              color="yellow"
                              style={{
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fef3c7',
                                flexShrink: 0,
                              }}
                            >
                              <IconFolder size={24} color="#d97706" />
                            </ThemeIcon>
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={700} size="sm" c="dark.8" lineClamp={1}>
                                {folder.name}
                              </Text>
                              <Group gap={6} mt={2}>
                                <IconFiles size={12} color="#64748b" />
                                <Text size="11px" c="dimmed" fw={500}>
                                  {folder.items_count} {folder.items_count === 1 ? 'elemento' : 'elementos'}
                                </Text>
                              </Group>
                            </Box>
                          </Group>

                          <Menu shadow="md" position="bottom-end" withinPortal transitionProps={{ transition: 'pop', duration: 150 }}>
                            <Menu.Target>
                              <ActionIcon
                                className="vet-action-btn"
                                size="md"
                                radius="md"
                                aria-label="Opciones de carpeta"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown className="vet-menu-dropdown">
                              <Menu.Label>Carpeta: {folder.name}</Menu.Label>
                              <Menu.Item
                                leftSection={<IconEdit size={14} color="#2563eb" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToRename({ id: folder.id, name: folder.name, is_folder: true });
                                  setNewName(folder.name);
                                  setRenameModal(true);
                                }}
                              >
                                Renombrar
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(folder.id, true);
                                }}
                              >
                                Enviar a papelera
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              )}

              {/* Sección de Archivos */}
              {filteredFiles.length > 0 && (
                <Box>
                  <Group gap="xs" mb="sm" align="center">
                    <IconFileText size={18} color="#15803d" />
                    <Text fw={700} size="sm" c="dark.8" tt="uppercase" style={{ letterSpacing: '0.4px' }}>
                      Archivos ({filteredFiles.length})
                    </Text>
                  </Group>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                    {filteredFiles.map((file) => {
                      const isSheet = file.mime_type.includes('spreadsheet') || file.name.endsWith('.xlsx');
                      const isDoc = file.mime_type.includes('document');
                      const isPdf = file.mime_type.includes('pdf') || file.name.endsWith('.pdf');

                      return (
                        <Card
                          key={file.id}
                          p="md"
                          radius="md"
                          withBorder
                          bg="white"
                          className="interactive-card"
                          style={{
                            cursor: 'pointer',
                            borderColor: '#e2e8f0',
                            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                          onClick={() => {
                            if (isSheet) {
                              setActiveEditor({ type: 'sheet', fileId: file.id, fileName: file.name });
                            } else if (isDoc) {
                              setActiveEditor({ type: 'doc', fileId: file.id, fileName: file.name });
                            }
                          }}
                        >
                          <Group justify="space-between" align="flex-start" mb="xs">
                            <ThemeIcon
                              size={44}
                              radius="md"
                              variant="light"
                              color={isSheet ? 'vetGreen' : isDoc ? 'blue' : isPdf ? 'red' : 'gray'}
                              style={{
                                backgroundColor: isSheet ? '#f0fdf4' : isDoc ? '#eff6ff' : isPdf ? '#fef2f2' : '#f8fafc',
                                border: `1px solid ${isSheet ? '#bbf7d0' : isDoc ? '#bfdbfe' : isPdf ? '#fecaca' : '#e2e8f0'}`,
                              }}
                            >
                              {isSheet ? (
                                <IconFileSpreadsheet size={24} color="#15803d" />
                              ) : isDoc ? (
                                <IconFileText size={24} color="#1d4ed8" />
                              ) : isPdf ? (
                                <IconFileCertificate size={24} color="#dc2626" />
                              ) : (
                                <IconFileText size={24} color="#64748b" />
                              )}
                            </ThemeIcon>

                            <Menu shadow="md" position="bottom-end" withinPortal transitionProps={{ transition: 'pop', duration: 150 }}>
                              <Menu.Target>
                                <ActionIcon
                                  className="vet-action-btn"
                                  size="md"
                                  radius="md"
                                  aria-label="Opciones de archivo"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconDotsVertical size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown className="vet-menu-dropdown">
                                <Menu.Label>Archivo: {file.name}</Menu.Label>
                                {isDoc || isSheet ? (
                                  <Menu.Item
                                    leftSection={<IconExternalLink size={14} color="#15803d" />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isSheet) {
                                        setActiveEditor({ type: 'sheet', fileId: file.id, fileName: file.name });
                                      } else {
                                        setActiveEditor({ type: 'doc', fileId: file.id, fileName: file.name });
                                      }
                                    }}
                                  >
                                    Abrir en Editor
                                  </Menu.Item>
                                ) : null}
                                <Menu.Item
                                  leftSection={<IconEdit size={14} color="#2563eb" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToRename({ id: file.id, name: file.name, is_folder: false });
                                    setNewName(file.name);
                                    setRenameModal(true);
                                  }}
                                >
                                  Renombrar
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteItem(file.id, false);
                                  }}
                                >
                                  Enviar a papelera
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Group>

                          <Text fw={700} size="sm" c="dark.8" lineClamp={1} mb={2}>
                            {file.name}
                          </Text>

                          <Text size="11px" c="dimmed" mb="xs">
                            {file.size ? `${file.size} • ` : ''}{file.updated_at || 'Actualizado recientemente'}
                          </Text>

                          <Badge
                            size="xs"
                            variant="light"
                            color={isSheet ? 'vetGreen' : isDoc ? 'blue' : isPdf ? 'red' : 'gray'}
                          >
                            {isSheet ? 'Univer Sheet' : isDoc ? 'Google Doc' : isPdf ? 'PDF Oficial' : 'Archivo'}
                          </Badge>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              )}
            </Stack>
          ) : (
            /* Modo de Vista Lista */
            <div className="vet-table-container">
              <Table highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Nombre del Elemento</Table.Th>
                    <Table.Th>Propietario</Table.Th>
                    <Table.Th>Última Modificación</Table.Th>
                    <Table.Th>Tamaño / Contenido</Table.Th>
                    <Table.Th style={{ textAlign: 'center', width: 90 }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {/* Carpetas en Lista */}
                  {filteredFolders.map((f) => (
                    <Table.Tr
                      key={`folder-${f.id}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setCurrentFolderId(f.id)}
                    >
                      <Table.Td p="sm">
                        <Group gap="xs">
                          <ThemeIcon color="yellow" variant="light" size="sm" radius="sm">
                            <IconFolder size={16} color="#d97706" />
                          </ThemeIcon>
                          <Text size="sm" fw={700} c="dark.8">{f.name}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td p="sm">
                        <Badge size="xs" variant="light" color="gray">Administrador</Badge>
                      </Table.Td>
                      <Table.Td p="sm">
                        <Text size="xs" c="dimmed">{f.updated_at || 'N/A'}</Text>
                      </Table.Td>
                      <Table.Td p="sm">
                        <Text size="xs" fw={500}>{f.items_count} elementos</Text>
                      </Table.Td>
                      <Table.Td p="sm" style={{ textAlign: 'center' }}>
                        <Menu shadow="md" position="bottom-end" withinPortal transitionProps={{ transition: 'pop', duration: 150 }}>
                          <Menu.Target>
                            <ActionIcon
                              className="vet-action-btn"
                              size="md"
                              radius="md"
                              aria-label="Opciones de carpeta"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown className="vet-menu-dropdown">
                            <Menu.Label>Carpeta: {f.name}</Menu.Label>
                            <Menu.Item
                              leftSection={<IconEdit size={14} color="#2563eb" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToRename({ id: f.id, name: f.name, is_folder: true });
                                setNewName(f.name);
                                setRenameModal(true);
                              }}
                            >
                              Renombrar
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(f.id, true);
                              }}
                            >
                              Enviar a papelera
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}

                  {/* Archivos en Lista */}
                  {filteredFiles.map((fl) => {
                    const isSheet = fl.mime_type.includes('spreadsheet') || fl.name.endsWith('.xlsx');
                    const isDoc = fl.mime_type.includes('document');
                    const isPdf = fl.mime_type.includes('pdf') || fl.name.endsWith('.pdf');

                    return (
                      <Table.Tr
                        key={`file-${fl.id}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (isSheet) {
                            setActiveEditor({ type: 'sheet', fileId: fl.id, fileName: fl.name });
                          } else if (isDoc) {
                            setActiveEditor({ type: 'doc', fileId: fl.id, fileName: fl.name });
                          }
                        }}
                      >
                        <Table.Td p="sm">
                          <Group gap="xs">
                            <ThemeIcon
                              color={isSheet ? 'vetGreen' : isDoc ? 'blue' : isPdf ? 'red' : 'gray'}
                              variant="light"
                              size="sm"
                              radius="sm"
                            >
                              {isSheet ? (
                                <IconFileSpreadsheet size={16} color="#15803d" />
                              ) : isDoc ? (
                                <IconFileText size={16} color="#1d4ed8" />
                              ) : isPdf ? (
                                <IconFileCertificate size={16} color="#dc2626" />
                              ) : (
                                <IconFileText size={16} color="#64748b" />
                              )}
                            </ThemeIcon>
                            <Text size="sm" fw={600} c="dark.8">{fl.name}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td p="sm">
                          <Text size="xs">{fl.owner_name || 'Personal Clínico'}</Text>
                        </Table.Td>
                        <Table.Td p="sm">
                          <Text size="xs" c="dimmed">{fl.updated_at || 'N/A'}</Text>
                        </Table.Td>
                        <Table.Td p="sm">
                          <Text size="xs">{fl.size || 'N/A'}</Text>
                        </Table.Td>
                        <Table.Td p="sm" style={{ textAlign: 'center' }}>
                          <Menu shadow="md" position="bottom-end" withinPortal transitionProps={{ transition: 'pop', duration: 150 }}>
                            <Menu.Target>
                              <ActionIcon
                                className="vet-action-btn"
                                size="md"
                                radius="md"
                                aria-label="Opciones de archivo"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <IconDotsVertical size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown className="vet-menu-dropdown">
                              <Menu.Label>Archivo: {fl.name}</Menu.Label>
                              {isDoc || isSheet ? (
                                <Menu.Item
                                  leftSection={<IconExternalLink size={14} color="#15803d" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSheet) {
                                      setActiveEditor({ type: 'sheet', fileId: fl.id, fileName: fl.name });
                                    } else {
                                      setActiveEditor({ type: 'doc', fileId: fl.id, fileName: fl.name });
                                    }
                                  }}
                                >
                                  Abrir en Editor
                                </Menu.Item>
                              ) : null}
                              <Menu.Item
                                leftSection={<IconEdit size={14} color="#2563eb" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemToRename({ id: fl.id, name: fl.name, is_folder: false });
                                  setNewName(fl.name);
                                  setRenameModal(true);
                                }}
                              >
                                Renombrar
                              </Menu.Item>
                              <Menu.Divider />
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(fl.id, false);
                                }}
                              >
                                Enviar a papelera
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* ==================================================================== */}
      {/* 5. MODALES DE CREACIÓN, SUBIDA Y EDICIÓN                             */}
      {/* ==================================================================== */}

      {/* CREATE FOLDER MODAL */}
      <Modal
        opened={newFolderModal}
        onClose={() => setNewFolderModal(false)}
        title="Crear Nueva Carpeta en Drive"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Nombre de la carpeta"
            placeholder="Ej. Expedientes Caninos 2026 / Pagos"
            required
            radius="md"
            value={folderName}
            onChange={(e) => setFolderName(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={() => setNewFolderModal(false)} radius="md">
              Cancelar
            </Button>
            <Button
              color="vetGreen"
              onClick={handleCreateFolder}
              radius="md"
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                },
              }}
            >
              Crear Carpeta
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* CREATE DOCUMENT MODAL */}
      <Modal
        opened={newDocModal}
        onClose={() => setNewDocModal(false)}
        title={docType === 'sheet' ? 'Nueva Hoja de Cálculo Univer' : 'Nuevo Documento Google Docs'}
        centered
        radius="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Nombre del archivo"
            placeholder={docType === 'sheet' ? 'Ej. Control_Vacunacion_2026' : 'Ej. Historial_Clinico_01'}
            required
            radius="md"
            value={docName}
            onChange={(e) => setDocName(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={() => setNewDocModal(false)} radius="md">
              Cancelar
            </Button>
            <Button
              color="vetGreen"
              onClick={handleCreateDocument}
              radius="md"
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                },
              }}
            >
              Crear y Abrir Editor
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* UPLOAD FILE MODAL */}
      <Modal
        opened={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Cargar Archivo a Google Drive"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <FileInput
            label="Seleccione el archivo a cargar"
            placeholder="Documentos PDF, Excel, imágenes, etc."
            required
            radius="md"
            value={selectedFile}
            onChange={setSelectedFile}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={() => setUploadModal(false)} radius="md">
              Cancelar
            </Button>
            <Button
              color="vetGreen"
              disabled={!selectedFile}
              onClick={handleUploadFile}
              radius="md"
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                },
              }}
            >
              Subir a Drive
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* RENAME MODAL */}
      <Modal
        opened={renameModal}
        onClose={() => setRenameModal(false)}
        title="Renombrar Elemento"
        centered
        radius="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Nuevo nombre"
            required
            radius="md"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={() => setRenameModal(false)} radius="md">
              Cancelar
            </Button>
            <Button
              color="vetGreen"
              onClick={handleRename}
              radius="md"
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
                },
              }}
            >
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
