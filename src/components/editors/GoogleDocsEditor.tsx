import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Group, Text, Button, ActionIcon, Badge, Loader, Divider,
  Tooltip, Stack
} from '@mantine/core';
import {
  IconDeviceFloppy, IconExternalLink, IconFileText, IconBold, IconItalic,
  IconUnderline, IconList, IconListNumbers, IconH1, IconH2, IconCheck
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { notifications } from '@mantine/notifications';

interface GoogleDocsEditorProps {
  fileId: number;
  fileName: string;
  onClose?: () => void;
}

export const GoogleDocsEditor: React.FC<GoogleDocsEditorProps> = ({
  fileId,
  fileName,
  onClose,
}) => {
  const [contentHtml, setContentHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string>('');

  useEffect(() => {
    const fetchDocContent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/drives/docs/${fileId}/content/`);
        setContentHtml(res.data.raw_html || `<h2>${fileName}</h2><p>Documento listo para edición.</p>`);
        setLastSaved(new Date(res.data.updated_at).toLocaleTimeString());
      } catch (e) {
        notifications.show({ title: 'Error', message: 'No se pudo cargar el documento.', color: 'red' });
      } finally {
        setLoading(false);
      }
    };
    fetchDocContent();
  }, [fileId, fileName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/drives/docs/${fileId}/content/`, {
        raw_html: contentHtml,
      });
      setLastSaved(new Date().toLocaleTimeString());
      notifications.show({
        title: 'Guardado en Google Docs',
        message: 'Los cambios se han preservado en el documento oficial.',
        color: 'teal',
        icon: <IconCheck size={18} />,
      });
    } catch (e) {
      notifications.show({ title: 'Error', message: 'Fallo al guardar en Google Docs.', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const applyFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '80vh',
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <Paper p="sm" bg="gray.0" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <IconFileText size={22} color="#1864ab" />
            <div>
              <Text fw={700} size="sm" c="dark.8">
                {fileName}
              </Text>
              <Text size="11px" c="dimmed">
                Google Docs API v1 • Editor Documental Integrado
              </Text>
            </div>
          </Group>

          <Group gap="sm">
            {lastSaved && (
              <Badge color="teal" variant="light" size="sm">
                Guardado ({lastSaved})
              </Badge>
            )}

            <Button
              size="xs"
              color="enterpriseBlue"
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saving}
              onClick={handleSave}
            >
              Guardar en Docs
            </Button>

            <Button
              size="xs"
              variant="light"
              color="gray"
              leftSection={<IconExternalLink size={16} />}
              component="a"
              href={`https://docs.google.com/document/d/sample/edit`}
              target="_blank"
            >
              Abrir en Google Docs
            </Button>

            {onClose && (
              <Button size="xs" variant="default" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Formatting Toolbar */}
      <Paper p="xs" bg="white" style={{ borderBottom: '1px solid #e2e8f0' }}>
        <Group gap="xs">
          <Tooltip label="Título Principal">
            <ActionIcon variant="subtle" color="gray" onClick={() => applyFormat('formatBlock', '<h2>')}>
              <IconH1 size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Subtítulo">
            <ActionIcon variant="subtle" color="gray" onClick={() => applyFormat('formatBlock', '<h3>')}>
              <IconH2 size={18} />
            </ActionIcon>
          </Tooltip>
          <Divider orientation="vertical" />
          <Tooltip label="Negrita (Ctrl+B)">
            <ActionIcon variant="subtle" color="gray" onClick={() => applyFormat('bold')}>
              <IconBold size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Cursiva (Ctrl+I)">
            <ActionIcon variant="subtle" color="gray" onClick={() => applyFormat('italic')}>
              <IconItalic size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Subrayado (Ctrl+U)">
            <ActionIcon variant="subtle" color="gray" onClick={() => applyFormat('underline')}>
              <IconUnderline size={18} />
            </ActionIcon>
          </Tooltip>
          <Divider orientation="vertical" />
          <Tooltip label="Lista con viñetas">
            <ActionIcon variant="subtle" color="gray" onClick={() => applyFormat('insertUnorderedList')}>
              <IconList size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Lista numerada">
            <ActionIcon variant="subtle" color="gray" onClick={() => applyFormat('insertOrderedList')}>
              <IconListNumbers size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Paper>

      {/* Editable Canvas */}
      <Box p="xl" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f1f5f9' }}>
        {loading ? (
          <Box style={{ textAlign: 'center', marginTop: 60 }}>
            <Loader size="md" color="enterpriseBlue" />
            <Text size="sm" c="dimmed" mt="sm">Cargando documento de Google Docs...</Text>
          </Box>
        ) : (
          <Paper
            p={40}
            shadow="sm"
            radius="sm"
            bg="white"
            style={{
              maxWidth: 800,
              margin: '0 auto',
              minHeight: '100%',
              outline: 'none',
              lineHeight: 1.6,
              color: '#1e293b',
            }}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: contentHtml }}
            onBlur={(e) => setContentHtml(e.currentTarget.innerHTML)}
          />
        )}
      </Box>
    </Box>
  );
};
