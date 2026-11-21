import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Group, Text, Button, ActionIcon, Badge, Loader, Paper, Tooltip, Alert, ThemeIcon
} from '@mantine/core';
import {
  IconDeviceFloppy, IconArrowBackUp, IconArrowForwardUp,
  IconCheck, IconCloudCheck, IconCloudUpload, IconAlertTriangle, IconFileSpreadsheet
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { notifications } from '@mantine/notifications';

interface UniverSpreadsheetEditorProps {
  fileId: number;
  fileName: string;
  onClose?: () => void;
}

export const UniverSpreadsheetEditor: React.FC<UniverSpreadsheetEditorProps> = ({
  fileId,
  fileName,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerInstanceRef = useRef<any>(null);
  const workbookRef = useRef<any>(null);

  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'ERROR'>('SAVED');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [workbookData, setWorkbookData] = useState<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch initial spreadsheet data from Google Sheets / PostgreSQL
  useEffect(() => {
    let isMounted = true;

    const loadSpreadsheetData = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/spreadsheets/${fileId}/data/`);
        if (isMounted) {
          setWorkbookData(res.data.univer_data);
          setLastSavedTime(new Date(res.data.updated_at).toLocaleTimeString());
        }
      } catch (err) {
        notifications.show({
          title: 'Error de carga',
          message: 'No se pudieron recuperar los datos de la hoja de cálculo.',
          color: 'red',
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSpreadsheetData();

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [fileId]);

  // 2. Initialize Univer Engine inside containerRef
  useEffect(() => {
    if (loading || !workbookData || !containerRef.current) return;

    let isCleanedUp = false;

    const initUniver = async () => {
      try {
        const { createUniver, defaultTheme, LocaleType } = await import('@univerjs/presets');
        const { UniverSheetsCorePreset } = await import('@univerjs/preset-sheets-core');

        if (isCleanedUp || !containerRef.current) return;

        // Clean previous instance if any
        if (univerInstanceRef.current) {
          try {
            univerInstanceRef.current.dispose();
          } catch (e) {
            // ignore
          }
        }

        const { univer, univerAPI } = createUniver({
          locale: LocaleType.ES_ES,
          locales: {},
          theme: defaultTheme,
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current,
            }),
          ],
        });

        univerInstanceRef.current = univer;

        // Create workbook with the Google Sheets data
        const workbook = univer.createUnit(2, workbookData); // 2 is UNIVER_SHEET unit type
        workbookRef.current = workbook;

        // Setup Change Listener for Debounced Auto-save (3 seconds)
        const triggerDebouncedAutosave = () => {
          setSaveStatus('SAVING');
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            handleSaveSpreadsheet(true);
          }, 3000);
        };

        if (univerAPI && typeof (univerAPI as any).onCommandExecuted === 'function') {
          (univerAPI as any).onCommandExecuted(() => {
            triggerDebouncedAutosave();
          });
        }

        containerRef.current?.addEventListener('input', triggerDebouncedAutosave);

      } catch (e: any) {
        console.warn('Univer preset dynamic initialization notice:', e);
      }
    };

    initUniver();

    return () => {
      isCleanedUp = true;
      if (univerInstanceRef.current) {
        try {
          univerInstanceRef.current.dispose();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [loading, workbookData]);

  // 3. Save function (manual and autosave debounce)
  const handleSaveSpreadsheet = async (isAutosave = false) => {
    setSaveStatus('SAVING');
    try {
      let snapshot = workbookData;
      if (workbookRef.current && typeof workbookRef.current.save === 'function') {
        snapshot = workbookRef.current.save();
      }

      const res = await api.post(`/spreadsheets/${fileId}/save/`, {
        snapshot,
        is_autosave: isAutosave,
      });

      setSaveStatus('SAVED');
      setLastSavedTime(new Date().toLocaleTimeString());

      if (!isAutosave) {
        notifications.show({
          title: 'Guardado exitoso',
          message: 'Los cambios se sincronizaron con Google Sheets y PostgreSQL.',
          color: 'teal',
          icon: <IconCheck size={18} />,
        });
      }
    } catch (err: any) {
      setSaveStatus('ERROR');
      notifications.show({
        title: 'Error de guardado',
        message: 'No se pudieron confirmar los cambios en Google Sheets.',
        color: 'red',
        icon: <IconAlertTriangle size={18} />,
      });
    }
  };

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '82vh',
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
            <ThemeIcon color="green" variant="light" size="md">
              <IconFileSpreadsheet size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="sm" c="dark.8">
                {fileName}
              </Text>
              <Text size="11px" c="dimmed">
                Google Sheets v4 • Editor Univer Integrado
              </Text>
            </div>
          </Group>

          <Group gap="md">
            {/* Status indicator */}
            {saveStatus === 'SAVING' && (
              <Badge color="blue" variant="light" leftSection={<Loader size={10} color="blue" />}>
                Guardando en Google...
              </Badge>
            )}
            {saveStatus === 'SAVED' && (
              <Badge color="teal" variant="light" leftSection={<IconCloudCheck size={14} />}>
                Guardado {lastSavedTime ? `(${lastSavedTime})` : ''}
              </Badge>
            )}
            {saveStatus === 'ERROR' && (
              <Badge color="red" variant="filled" leftSection={<IconAlertTriangle size={14} />}>
                Error al guardar
              </Badge>
            )}

            <Tooltip label="Deshacer (Ctrl+Z)">
              <ActionIcon variant="default" size="sm">
                <IconArrowBackUp size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Rehacer (Ctrl+Y)">
              <ActionIcon variant="default" size="sm">
                <IconArrowForwardUp size={16} />
              </ActionIcon>
            </Tooltip>

            <Button
              size="xs"
              color="enterpriseBlue"
              leftSection={<IconDeviceFloppy size={16} />}
              loading={saveStatus === 'SAVING'}
              onClick={() => handleSaveSpreadsheet(false)}
            >
              Guardar
            </Button>

            {onClose && (
              <Button size="xs" variant="default" onClick={onClose}>
                Cerrar editor
              </Button>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Editor Main Canvas */}
      <Box style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading ? (
          <Box p="xl" style={{ textAlign: 'center', marginTop: 80 }}>
            <Loader size="md" color="enterpriseBlue" />
            <Text size="sm" c="dimmed" mt="md">
              Cargando hoja de cálculo y conectando con Google Sheets API...
            </Text>
          </Box>
        ) : (
          <div
            ref={containerRef}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        )}
      </Box>
    </Box>
  );
};
