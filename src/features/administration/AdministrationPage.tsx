import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Title, Text, TextInput, Textarea, NumberInput,
  Button, Group, Stack, SimpleGrid, Divider, Alert, LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBuildingSkyscraper, IconDeviceFloppy, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { api } from '../../services/api';
import { Company } from '../../types';
import { notifications } from '@mantine/notifications';

export const AdministrationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<Company>({
    initialValues: {
      id: 0,
      razon_social: '',
      nombre_comercial: '',
      ruc: '',
      direccion: '',
      telefono: '',
      correo: '',
      pagina_web: '',
      logo_url: '',
      descripcion: '',
      encabezado_documental: '',
      pie_pagina_documental: '',
      prefijo_expedientes: 'EXP-',
      correlativo_actual: 1000,
      zona_horaria: 'America/Lima',
    },
    validate: {
      razon_social: (val) => (val.trim() ? null : 'La razón social es obligatoria.'),
      ruc: (val) => (val.trim() ? null : 'El RUC es obligatorio.'),
      correo: (val) => (/^\S+@\S+$/.test(val) ? null : 'Correo electrónico no válido.'),
    },
  });

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const res = await api.get<Company>('/company/');
      form.setValues(res.data);
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo cargar la configuración de empresa.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const handleSubmit = async (values: Company) => {
    setSaving(true);
    try {
      const res = await api.put('/company/', values);
      form.setValues(res.data);
      notifications.show({
        title: 'Configuración Guardada',
        message: 'Los parámetros empresariales y documentales fueron actualizados.',
        color: 'teal',
        icon: <IconCheck size={18} />,
      });
    } catch (e: any) {
      notifications.show({
        title: 'Error al Guardar',
        message: e.response?.data?.detail || 'No se pudieron actualizar los datos.',
        color: 'red',
        icon: <IconAlertCircle size={18} />,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box mb="lg">
        <Title order={2} fw={800} c="dark.8">
          Administración Empresarial y Configuración Documental
        </Title>
        <Text c="dimmed" size="sm">
          Información legal, parámetros corporativos y correlativos oficiales aplicados a las plantillas maestras.
        </Text>
      </Box>

      <Paper p="xl" radius="md" withBorder bg="white" pos="relative">
        <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="xl">
            {/* SECCIÓN 1: Identificación Corporativa */}
            <Box>
              <Group gap="xs" mb="xs">
                <IconBuildingSkyscraper size={20} color="#0b7285" />
                <Text fw={700} size="md" c="dark.8">
                  1. Identificación y Datos Fiscales
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mb="md">
                Estos datos se inyectarán de forma automática en los encabezados de los documentos oficiales emitidos.
              </Text>

              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <TextInput
                  label="Razón Social"
                  placeholder="Ej. CORPORACIÓN EMPRESARIAL DE SERVICIOS S.A.C."
                  required
                  {...form.getInputProps('razon_social')}
                />
                <TextInput
                  label="Nombre Comercial"
                  placeholder="Ej. EXPEDIENTES PRO CORP"
                  {...form.getInputProps('nombre_comercial')}
                />
                <TextInput
                  label="RUC / Identificación Fiscal"
                  placeholder="20601234567"
                  required
                  {...form.getInputProps('ruc')}
                />
                <TextInput
                  label="Dirección Fiscal"
                  placeholder="Av. República de Panamá 3418, San Isidro, Lima"
                  {...form.getInputProps('direccion')}
                />
                <TextInput
                  label="Teléfono Central"
                  placeholder="+51 (01) 710-8900"
                  {...form.getInputProps('telefono')}
                />
                <TextInput
                  label="Correo Electrónico Corporativo"
                  placeholder="contacto@empresa.com"
                  required
                  {...form.getInputProps('correo')}
                />
                <TextInput
                  label="Página Web Oficial"
                  placeholder="https://www.empresa.com"
                  {...form.getInputProps('pagina_web')}
                />
                <TextInput
                  label="URL del Logotipo Institucional"
                  placeholder="https://..."
                  {...form.getInputProps('logo_url')}
                />
              </SimpleGrid>

              <Textarea
                label="Descripción / Objeto Social de la Empresa"
                placeholder="Descripción institucional breve..."
                minRows={2}
                mt="md"
                {...form.getInputProps('descripcion')}
              />
            </Box>

            <Divider />

            {/* SECCIÓN 2: Configuración Documental */}
            <Box>
              <Text fw={700} size="md" c="dark.8" mb="xs">
                2. Nomenclatura, Correlativos y Configuración Documental
              </Text>
              <Text size="xs" c="dimmed" mb="md">
                Reglas de numeración correlativa y pie de página legal para la interoperabilidad documental.
              </Text>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                <TextInput
                  label="Prefijo de Expedientes"
                  description="Identificador antepuesto al correlativo"
                  placeholder="EXP-"
                  required
                  {...form.getInputProps('prefijo_expedientes')}
                />
                <NumberInput
                  label="Correlativo Actual"
                  description="Último número generado en el sistema"
                  required
                  min={1}
                  {...form.getInputProps('correlativo_actual')}
                />
                <TextInput
                  label="Zona Horaria de Emisión"
                  placeholder="America/Lima"
                  required
                  {...form.getInputProps('zona_horaria')}
                />
              </SimpleGrid>

              <Textarea
                label="Texto de Encabezado Documental Estándar"
                description="Texto superior impreso en plantillas Google Docs y PDFs"
                minRows={2}
                mt="md"
                {...form.getInputProps('encabezado_documental')}
              />

              <Textarea
                label="Texto de Pie de Página y Validez Legal"
                description="Cláusula de interoperabilidad y valor probatorio"
                minRows={2}
                mt="md"
                {...form.getInputProps('pie_pagina_documental')}
              />
            </Box>

            <Group justify="flex-end" mt="md">
              <Button
                type="submit"
                color="enterpriseBlue"
                size="md"
                leftSection={<IconDeviceFloppy size={18} />}
                loading={saving}
              >
                Guardar Configuración Empresarial
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};
