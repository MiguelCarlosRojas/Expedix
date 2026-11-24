import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Group, Text, Button, TextInput, Select, Menu, ActionIcon,
  SimpleGrid, Card, Table, Badge, Breadcrumbs, Anchor, Modal, Stack,
  FileInput, Loader, Tooltip, Alert, ThemeIcon
} from '@mantine/core';
import {
  IconFolder, IconFileText, IconFileSpreadsheet, IconFilePlus,
  IconFolderPlus, IconUpload, IconSearch, IconLayoutGrid, IconList,
  IconDotsVertical, IconTrash, IconEdit, IconArrowsMove, IconExternalLink,
  IconRefresh, IconCheck, IconAlertTriangle, IconBrandGoogleDrive
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { DriveExplorerData, DriveFolderItem, DriveFileItem } from '../../types';
import { UniverSpreadsheetEditor } from '../../components/editors/UniverSpreadsheetEditor';
import { GoogleDocsEditor } from '../../components/editors/GoogleDocsEditor';
import { notifications } from '@mantine/notifications';

export const DrivesPage: React.FC = () => {
  const [data, setData] = useState<DriveExplorerData | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

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
      const params = new URLSearchParams();
      if (currentFolderId) params.append('folder_id', String(currentFolderId));
      if (search) params.append('search', search);
      if (typeFilter) params.append('type', typeFilter);

      const res = await api.get<DriveExplorerData>(`/drives/explorer/?${params.toString()}`);
      setData(res.data);
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo cargar el explorador de Drive.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, [currentFolderId, search, typeFilter]);

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
      notifications.show({ title: 'Carpeta creada', message: 'Carpeta creada en Google Drive.', color: 'teal' });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Fallo al crear la carpeta.', color: 'red' });
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
        message: `${docType === 'sheet' ? 'Hoja de cálculo' : 'Documento Google Docs'} creado en Drive.`,
        color: 'teal',
      });

      // Automatically open in embedded editor!
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
      notifications.show({ title: 'Carga completada', message: 'Archivo subido a Google Drive.', color: 'teal' });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Error durante la carga.', color: 'red' });
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
      notifications.show({ title: 'Renombrado', message: 'Elemento actualizado.', color: 'teal' });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Fallo al renombrar.', color: 'red' });
    }
  };

  const handleDeleteItem = async (id: number, is_folder: boolean) => {
    try {
      const endpoint = is_folder ? `/drives/folders/${id}/` : `/drives/files/${id}/`;
      await api.delete(endpoint);
      fetchContents();
      notifications.show({ title: 'Papelera', message: 'Elemento enviado a la papelera de Drive.', color: 'gray' });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo eliminar el elemento.', color: 'red' });
    }
  };

  // If an embedded editor is active, render it full view!
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

  return (
    <Box>
      {/* Top Toolbar */}
      <Paper p="md" mb="md" withBorder radius="md" bg="white">
        <Group justify="space-between">
          {/* Action "NUEVO" Button with Dropdown Menu */}
          <Menu shadow="md" width={220} position="bottom-start">
            <Menu.Target>
              <Button
                color="enterpriseBlue"
                size="sm"
                leftSection={<IconFilePlus size={18} />}
              >
                NUEVO
              </Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconFolderPlus size={16} color="#0b7285" />}
                onClick={() => setNewFolderModal(true)}
              >
                Nueva carpeta
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconFileText size={16} color="#1971c2" />}
                onClick={() => {
                  setDocType('doc');
                  setDocName('');
                  setNewDocModal(true);
                }}
              >
                Documento de Google Docs
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFileSpreadsheet size={16} color="#0ca678" />}
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
                leftSection={<IconUpload size={16} color="#7950f2" />}
                onClick={() => setUploadModal(true)}
              >
                Cargar archivo
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Search & Type filter */}
          <Group style={{ flex: 1, maxWidth: 600 }}>
            <TextInput
              placeholder="Buscar archivos y carpetas en Drive..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              style={{ flex: 1 }}
              size="sm"
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
              clearable
              size="sm"
              style={{ width: 180 }}
            />
          </Group>

          {/* View mode toggle & Refresh */}
          <Group gap="xs">
            <ActionIcon
              variant={viewMode === 'grid' ? 'filled' : 'subtle'}
              color="enterpriseBlue"
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
            >
              <IconLayoutGrid size={18} />
            </ActionIcon>
            <ActionIcon
              variant={viewMode === 'list' ? 'filled' : 'subtle'}
              color="enterpriseBlue"
              onClick={() => setViewMode('list')}
              title="Vista de lista"
            >
              <IconList size={18} />
            </ActionIcon>
            <ActionIcon variant="light" color="gray" onClick={fetchContents} title="Refrescar">
              <IconRefresh size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Paper>

      {/* Breadcrumbs Navigation */}
      <Paper p="xs" px="md" mb="md" withBorder radius="md" bg="white">
        <Group gap="xs">
          <IconBrandGoogleDrive size={18} color="#0ca678" />
          <Breadcrumbs separator="/">
            {(data?.breadcrumbs || [{ id: null, name: 'Mi Unidad Drive' }]).map((crumb, idx, arr) => (
              <Anchor
                key={idx}
                size="sm"
                fw={idx === arr.length - 1 ? 700 : 500}
                c={idx === arr.length - 1 ? 'dark.8' : 'enterpriseBlue.7'}
                onClick={() => setCurrentFolderId(crumb.id)}
                style={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                {crumb.name}
              </Anchor>
            ))}
          </Breadcrumbs>
        </Group>
      </Paper>

      {/* Explorer Content */}
      {loading ? (
        <Paper p="xl" withBorder radius="md" bg="white" style={{ textAlign: 'center' }}>
          <Loader size="md" color="enterpriseBlue" />
          <Text size="sm" c="dimmed" mt="md">Sincronizando con Google Drive...</Text>
        </Paper>
      ) : viewMode === 'grid' ? (
        <Stack gap="lg">
          {/* Folders Section */}
          {data?.folders && data.folders.length > 0 && (
            <Box>
              <Text fw={700} size="sm" c="dimmed" mb="xs" tt="uppercase">
                Carpetas ({data.folders.length})
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {data.folders.map((folder) => (
                  <Card
                    key={folder.id}
                    p="sm"
                    radius="md"
                    withBorder
                    bg="white"
                    style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                    onClick={() => setCurrentFolderId(folder.id)}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        <ThemeIcon color="yellow" variant="light" size="lg" radius="md">
                          <IconFolder size={22} />
                        </ThemeIcon>
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={600} size="sm" lineClamp={1}>{folder.name}</Text>
                          <Text size="11px" c="dimmed">{folder.items_count} elementos</Text>
                        </Box>
                      </Group>

                      <Menu shadow="md" position="bottom-end">
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToRename({ id: folder.id, name: folder.name, is_folder: true });
                              setNewName(folder.name);
                              setRenameModal(true);
                            }}
                          >
                            Renombrar
                          </Menu.Item>
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

          {/* Files Section */}
          <Box>
            <Text fw={700} size="sm" c="dimmed" mb="xs" tt="uppercase">
              Archivos ({data?.files.length || 0})
            </Text>
            {(!data?.files || data.files.length === 0) && (!data?.folders || data.folders.length === 0) ? (
              <Paper p="xl" withBorder radius="md" bg="white" style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed">Esta carpeta está vacía en Google Drive.</Text>
              </Paper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
                {(data?.files || []).map((file) => {
                  const isSheet = file.mime_type.includes('spreadsheet') || file.name.endsWith('.xlsx');
                  const isDoc = file.mime_type.includes('document');

                  return (
                    <Card
                      key={file.id}
                      p="sm"
                      radius="md"
                      withBorder
                      bg="white"
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
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
                          color={isSheet ? 'green' : isDoc ? 'blue' : 'red'}
                          variant="light"
                          size="xl"
                          radius="md"
                        >
                          {isSheet ? (
                            <IconFileSpreadsheet size={24} />
                          ) : isDoc ? (
                            <IconFileText size={24} />
                          ) : (
                            <IconFileText size={24} />
                          )}
                        </ThemeIcon>

                        <Menu shadow="md" position="bottom-end">
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToRename({ id: file.id, name: file.name, is_folder: false });
                                setNewName(file.name);
                                setRenameModal(true);
                              }}
                            >
                              Renombrar
                            </Menu.Item>
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

                      <Text fw={600} size="sm" lineClamp={1} mb={2}>
                        {file.name}
                      </Text>
                      <Text size="11px" c="dimmed">
                        {file.size} • {file.updated_at}
                      </Text>
                      <Badge mt="xs" size="xs" variant="light" color={isSheet ? 'green' : 'blue'}>
                        {isSheet ? 'Univer Sheet' : 'Google Doc'}
                      </Badge>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </Box>
        </Stack>
      ) : (
        /* List View */
        <Card p={0} radius="md" withBorder bg="white">
          <Table highlightOnHover verticalSpacing="sm" withTableBorder={false} withColumnBorders={false}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre</Table.Th>
                <Table.Th>Propietario</Table.Th>
                <Table.Th>Modificado</Table.Th>
                <Table.Th>Tamaño</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {/* Folders */}
              {(data?.folders || []).map((f) => (
                <Table.Tr
                  key={`folder-${f.id}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setCurrentFolderId(f.id)}
                >
                  <Table.Td>
                    <Group gap="xs">
                      <IconFolder size={18} color="#e0a100" />
                      <Text size="sm" fw={600}>{f.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">Administrador</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">{f.updated_at}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">{f.items_count} elementos</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(f.id, true);
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}

              {/* Files */}
              {(data?.files || []).map((fl) => {
                const isSheet = fl.mime_type.includes('spreadsheet');
                const isDoc = fl.mime_type.includes('document');

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
                    <Table.Td>
                      <Group gap="xs">
                        {isSheet ? (
                          <IconFileSpreadsheet size={18} color="#0ca678" />
                        ) : (
                          <IconFileText size={18} color="#1864ab" />
                        )}
                        <Text size="sm" fw={500}>{fl.name}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{fl.owner_name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">{fl.updated_at}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{fl.size}</Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(fl.id, false);
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* CREATE FOLDER MODAL */}
      <Modal
        opened={newFolderModal}
        onClose={() => setNewFolderModal(false)}
        title="Crear Nueva Carpeta en Drive"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Nombre de la carpeta"
            placeholder="Ej. Expedientes 2026 / Pagos"
            required
            value={folderName}
            onChange={(e) => setFolderName(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setNewFolderModal(false)}>
              Cancelar
            </Button>
            <Button color="enterpriseBlue" onClick={handleCreateFolder}>
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
      >
        <Stack gap="md">
          <TextInput
            label="Nombre del archivo"
            placeholder={docType === 'sheet' ? 'Ej. Control_Desembolsos_2026' : 'Ej. Informe_Legal_01'}
            required
            value={docName}
            onChange={(e) => setDocName(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setNewDocModal(false)}>
              Cancelar
            </Button>
            <Button color="enterpriseBlue" onClick={handleCreateDocument}>
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
      >
        <Stack gap="md">
          <FileInput
            label="Seleccione el archivo a cargar"
            placeholder="Documentos PDF, Excel, imágenes, etc."
            required
            value={selectedFile}
            onChange={setSelectedFile}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setUploadModal(false)}>
              Cancelar
            </Button>
            <Button color="enterpriseBlue" disabled={!selectedFile} onClick={handleUploadFile}>
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
      >
        <Stack gap="md">
          <TextInput
            label="Nuevo nombre"
            required
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setRenameModal(false)}>
              Cancelar
            </Button>
            <Button color="enterpriseBlue" onClick={handleRename}>
              Guardar Cambios
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
