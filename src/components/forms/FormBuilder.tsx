import React, { useState } from 'react';
import {
  Box, Grid, Paper, Text, Button, Stack, TextInput, Textarea, Select,
  Switch, Group, ThemeIcon, ActionIcon, Badge, ScrollArea, Divider
} from '@mantine/core';
import {
  IconPlus, IconTrash, IconGripVertical, IconLetterCase, IconAlignLeft,
  Icon123, IconCalendar, IconMail, IconPhone, IconCurrencyDollar,
  IconListDetails, IconCheckbox, IconToggleLeft, IconPaperclip, IconDeviceFloppy
} from '@tabler/icons-react';
import { DynamicField, DocumentTemplate } from '../../types';
import { api } from '../../services/api';
import { notifications } from '@mantine/notifications';

interface FormBuilderProps {
  template: DocumentTemplate;
  onUpdateTemplate: () => void;
}

const FIELD_PALETTE = [
  { type: 'text', label: 'Texto corto', icon: <IconLetterCase size={16} /> },
  { type: 'textarea', label: 'Texto largo', icon: <IconAlignLeft size={16} /> },
  { type: 'integer', label: 'Número entero', icon: <Icon123 size={16} /> },
  { type: 'decimal', label: 'Número decimal', icon: <Icon123 size={16} /> },
  { type: 'currency', label: 'Moneda (S/)', icon: <IconCurrencyDollar size={16} /> },
  { type: 'date', label: 'Fecha', icon: <IconCalendar size={16} /> },
  { type: 'email', label: 'Correo', icon: <IconMail size={16} /> },
  { type: 'phone', label: 'Teléfono', icon: <IconPhone size={16} /> },
  { type: 'select', label: 'Select (Opciones)', icon: <IconListDetails size={16} /> },
  { type: 'multiselect', label: 'Selección múltiple', icon: <IconListDetails size={16} /> },
  { type: 'radio', label: 'Radio botones', icon: <IconListDetails size={16} /> },
  { type: 'checkbox', label: 'Checkbox', icon: <IconCheckbox size={16} /> },
  { type: 'boolean', label: 'Booleano (Switch)', icon: <IconToggleLeft size={16} /> },
  { type: 'file', label: 'Archivo adjunto', icon: <IconPaperclip size={16} /> },
];

export const FormBuilder: React.FC<FormBuilderProps> = ({ template, onUpdateTemplate }) => {
  const [fields, setFields] = useState<DynamicField[]>(template.fields || []);
  const [selectedField, setSelectedField] = useState<DynamicField | null>(
    (template.fields && template.fields[0]) || null
  );
  const [saving, setSaving] = useState(false);

  const handleAddField = async (type: string, label: string) => {
    const slug = `campo_${Date.now().toString().slice(-6)}`;
    const newFieldData: DynamicField = {
      template: template.id,
      name: `Nuevo ${label}`,
      identifier: slug,
      field_type: type,
      description: '',
      placeholder: '',
      is_required: false,
      order: fields.length,
      section: 'Datos Generales',
      width: 'col-6',
      sheets_column: String.fromCharCode(65 + (fields.length % 26)),
      docs_tag: `{{${slug.toUpperCase()}}}`,
      options: type.includes('select') || type === 'radio' ? [
        { label: 'Opción 1', value: 'opt1' },
        { label: 'Opción 2', value: 'opt2' },
      ] : [],
    };

    try {
      const res = await api.post('/fields/', newFieldData);
      const savedField = res.data;
      setFields((prev) => [...prev, savedField]);
      setSelectedField(savedField);
      notifications.show({
        title: 'Campo agregado',
        message: `Se añadió el campo "${savedField.name}" con etiqueta ${savedField.docs_tag}.`,
        color: 'teal',
      });
      onUpdateTemplate();
    } catch (err: any) {
      notifications.show({ title: 'Error', message: 'No se pudo crear el campo.', color: 'red' });
    }
  };

  const handleUpdateSelectedField = async () => {
    if (!selectedField || !selectedField.id) return;
    setSaving(true);
    try {
      const res = await api.put(`/fields/${selectedField.id}/`, selectedField);
      setFields((prev) => prev.map((f) => (f.id === selectedField.id ? res.data : f)));
      setSelectedField(res.data);
      notifications.show({
        title: 'Campo actualizado',
        message: 'Configuración guardada en la base de datos.',
        color: 'teal',
      });
      onUpdateTemplate();
    } catch (err: any) {
      notifications.show({ title: 'Error', message: 'Error al actualizar propiedades.', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    try {
      await api.delete(`/fields/${fieldId}/`);
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
      notifications.show({ title: 'Eliminado', message: 'Campo eliminado.', color: 'gray' });
      onUpdateTemplate();
    } catch (err) {
      notifications.show({ title: 'Error', message: 'No se pudo eliminar el campo.', color: 'red' });
    }
  };

  return (
    <Box style={{ height: '75vh', display: 'flex', flexDirection: 'column' }}>
      <Grid gutter="md" style={{ flex: 1, minHeight: 0 }}>
        {/* PANEL 1: Campos Disponibles */}
        <Grid.Col span={{ base: 12, md: 3 }} style={{ display: 'flex', flexDirection: 'column' }}>
          <Paper p="md" withBorder radius="md" bg="white" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Text fw={700} size="sm" mb="xs" c="dark.7">
              1. Campos Disponibles
            </Text>
            <Text size="xs" c="dimmed" mb="sm">
              Haga clic para agregar campos al formulario dinámico.
            </Text>
            <Divider mb="sm" />
            <ScrollArea style={{ flex: 1 }}>
              <Stack gap="xs">
                {FIELD_PALETTE.map((item) => (
                  <Button
                    key={item.type}
                    variant="light"
                    color="gray"
                    justify="flex-start"
                    leftSection={item.icon}
                    size="xs"
                    onClick={() => handleAddField(item.type, item.label)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </ScrollArea>
          </Paper>
        </Grid.Col>

        {/* PANEL 2: Área de Construcción */}
        <Grid.Col span={{ base: 12, md: 5 }} style={{ display: 'flex', flexDirection: 'column' }}>
          <Paper p="md" withBorder radius="md" bg="white" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="xs">
              <div>
                <Text fw={700} size="sm" c="dark.7">
                  2. Estructura del Formulario
                </Text>
                <Text size="xs" c="dimmed">
                  {fields.length} campos configurados en la plantilla
                </Text>
              </div>
              <Badge color="enterpriseBlue" size="sm">
                v{template.version}
              </Badge>
            </Group>
            <Divider mb="sm" />

            <ScrollArea style={{ flex: 1 }}>
              <Stack gap="xs">
                {fields.length === 0 ? (
                  <Box p="xl" style={{ textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: 8 }}>
                    <Text size="xs" c="dimmed">No hay campos agregados. Seleccione uno de la izquierda.</Text>
                  </Box>
                ) : (
                  fields.map((f, idx) => {
                    const isSelected = selectedField?.id === f.id;
                    return (
                      <Paper
                        key={f.id || idx}
                        p="xs"
                        withBorder
                        radius="sm"
                        style={{
                          cursor: 'pointer',
                          borderColor: isSelected ? '#1971c2' : '#e2e8f0',
                          backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                          transition: 'all 0.15s ease',
                        }}
                        onClick={() => setSelectedField(f)}
                      >
                        <Group justify="space-between" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <IconGripVertical size={16} color="#94a3b8" />
                            <div>
                              <Group gap="xs">
                                <Text fw={600} size="xs">{f.name}</Text>
                                {f.is_required && <Badge color="red" size="xs">Obligatorio</Badge>}
                              </Group>
                              <Text size="11px" c="dimmed" ff="monospace">
                                {f.docs_tag} • Sheets Col: {f.sheets_column || '-'}
                              </Text>
                            </div>
                          </Group>

                          <ActionIcon
                            color="red"
                            variant="subtle"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (f.id) handleDeleteField(f.id);
                            }}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            </ScrollArea>
          </Paper>
        </Grid.Col>

        {/* PANEL 3: Panel de Propiedades */}
        <Grid.Col span={{ base: 12, md: 4 }} style={{ display: 'flex', flexDirection: 'column' }}>
          <Paper p="md" withBorder radius="md" bg="white" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Text fw={700} size="sm" mb="xs" c="dark.7">
              3. Propiedades del Campo
            </Text>
            <Divider mb="sm" />

            {selectedField ? (
              <ScrollArea style={{ flex: 1 }}>
                <Stack gap="sm">
                  <TextInput
                    label="Nombre / Etiqueta"
                    size="xs"
                    value={selectedField.name}
                    onChange={(e) => setSelectedField({ ...selectedField, name: e.currentTarget.value })}
                  />

                  <TextInput
                    label="Identificador único"
                    size="xs"
                    value={selectedField.identifier}
                    onChange={(e) => setSelectedField({ ...selectedField, identifier: e.currentTarget.value.toLowerCase().replace(/\s+/g, '_') })}
                  />

                  <TextInput
                    label="Etiqueta para Google Docs"
                    size="xs"
                    description="Ejemplo: {{NOMBRE_COMPLETO}}"
                    value={selectedField.docs_tag}
                    onChange={(e) => setSelectedField({ ...selectedField, docs_tag: e.currentTarget.value.toUpperCase() })}
                  />

                  <TextInput
                    label="Correspondencia Columna Sheets"
                    size="xs"
                    placeholder="Ej. A, B, C..."
                    value={selectedField.sheets_column || ''}
                    onChange={(e) => setSelectedField({ ...selectedField, sheets_column: e.currentTarget.value.toUpperCase() })}
                  />

                  <TextInput
                    label="Sección / Grupo"
                    size="xs"
                    value={selectedField.section || 'Datos Generales'}
                    onChange={(e) => setSelectedField({ ...selectedField, section: e.currentTarget.value })}
                  />

                  <Select
                    label="Ancho en Formulario"
                    size="xs"
                    data={[
                      { value: 'col-12', label: '100% Ancho Completo' },
                      { value: 'col-6', label: '50% Media Columna' },
                    ]}
                    value={selectedField.width || 'col-6'}
                    onChange={(val) => setSelectedField({ ...selectedField, width: val || 'col-6' })}
                  />

                  <TextInput
                    label="Placeholder"
                    size="xs"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => setSelectedField({ ...selectedField, placeholder: e.currentTarget.value })}
                  />

                  <Switch
                    label="Campo obligatorio"
                    size="xs"
                    checked={selectedField.is_required}
                    onChange={(e) => setSelectedField({ ...selectedField, is_required: e.currentTarget.checked })}
                  />

                  <Button
                    size="xs"
                    mt="md"
                    color="enterpriseBlue"
                    leftSection={<IconDeviceFloppy size={16} />}
                    loading={saving}
                    onClick={handleUpdateSelectedField}
                  >
                    Guardar Propiedades
                  </Button>
                </Stack>
              </ScrollArea>
            ) : (
              <Box p="xl" style={{ textAlign: 'center' }}>
                <Text size="xs" c="dimmed">Seleccione un campo de la columna central para editar sus propiedades.</Text>
              </Box>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
};
