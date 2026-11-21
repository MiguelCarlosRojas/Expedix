import React from 'react';
import {
  TextInput, Textarea, NumberInput, Select, MultiSelect, Radio, Checkbox,
  Switch, FileInput, SimpleGrid, Stack, Title, Paper, Group, Text, Box
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { DynamicField } from '../../types';

interface DynamicFormProps {
  fields: DynamicField[];
  values: Record<string, any>;
  onChange: (identifier: string, value: any) => void;
  errors?: Record<string, string>;
  readOnly?: boolean;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  values,
  onChange,
  errors = {},
  readOnly = false,
}) => {
  // Group fields by section
  const sections = fields.reduce((acc, field) => {
    const sec = field.section || 'Datos Generales';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(field);
    return acc;
  }, {} as Record<string, DynamicField[]>);

  const renderField = (field: DynamicField) => {
    const val = values[field.identifier] ?? field.default_value ?? '';
    const err = errors[field.identifier];

    const commonProps = {
      label: field.name,
      description: field.description,
      placeholder: field.placeholder,
      required: field.is_required,
      error: err,
      disabled: readOnly,
      mb: 'sm',
    };

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            minRows={3}
            value={val}
            onChange={(e) => onChange(field.identifier, e.currentTarget.value)}
          />
        );

      case 'integer':
        return (
          <NumberInput
            {...commonProps}
            value={val}
            onChange={(v) => onChange(field.identifier, v)}
            min={field.min_value}
            max={field.max_value}
            decimalScale={0}
          />
        );

      case 'decimal':
      case 'currency':
        return (
          <NumberInput
            {...commonProps}
            prefix={field.field_type === 'currency' ? 'S/ ' : undefined}
            value={val}
            onChange={(v) => onChange(field.identifier, v)}
            min={field.min_value}
            max={field.max_value}
            decimalScale={2}
          />
        );

      case 'date':
        return (
          <DateInput
            {...commonProps}
            valueFormat="YYYY-MM-DD"
            value={val ? new Date(val) : null}
            onChange={(date) => onChange(field.identifier, date ? date.toISOString().split('T')[0] : '')}
          />
        );

      case 'select':
        return (
          <Select
            {...commonProps}
            data={field.options || []}
            value={val}
            onChange={(v) => onChange(field.identifier, v)}
            clearable
          />
        );

      case 'multiselect':
        return (
          <MultiSelect
            {...commonProps}
            data={field.options || []}
            value={Array.isArray(val) ? val : []}
            onChange={(v) => onChange(field.identifier, v)}
            clearable
          />
        );

      case 'radio':
        return (
          <Radio.Group
            {...commonProps}
            value={val}
            onChange={(v) => onChange(field.identifier, v)}
          >
            <Group mt="xs">
              {(field.options || []).map((opt) => (
                <Radio key={opt.value} value={opt.value} label={opt.label} />
              ))}
            </Group>
          </Radio.Group>
        );

      case 'checkbox':
      case 'boolean':
        return (
          <Box mb="sm" mt="xs">
            <Switch
              label={field.name}
              description={field.description}
              checked={Boolean(val)}
              onChange={(e) => onChange(field.identifier, e.currentTarget.checked)}
              disabled={readOnly}
            />
          </Box>
        );

      case 'file':
        return (
          <FileInput
            {...commonProps}
            placeholder="Seleccione archivo..."
            onChange={(f) => onChange(field.identifier, f ? f.name : '')}
          />
        );

      case 'email':
        return (
          <TextInput
            {...commonProps}
            type="email"
            value={val}
            onChange={(e) => onChange(field.identifier, e.currentTarget.value)}
          />
        );

      case 'phone':
        return (
          <TextInput
            {...commonProps}
            type="tel"
            value={val}
            onChange={(e) => onChange(field.identifier, e.currentTarget.value)}
          />
        );

      case 'text':
      default:
        return (
          <TextInput
            {...commonProps}
            value={val}
            onChange={(e) => onChange(field.identifier, e.currentTarget.value)}
          />
        );
    }
  };

  return (
    <Stack gap="lg">
      {Object.entries(sections).map(([sectionTitle, sectionFields]) => (
        <Paper key={sectionTitle} p="md" radius="md" withBorder bg="gray.0">
          <Text fw={700} size="sm" c="enterpriseBlue.8" mb="sm" tt="uppercase" style={{ letterSpacing: 0.5 }}>
            {sectionTitle}
          </Text>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {sectionFields.map((field) => (
              <Box key={field.identifier} style={{ gridColumn: field.width === 'col-12' ? 'span 2' : 'span 1' }}>
                {renderField(field)}
              </Box>
            ))}
          </SimpleGrid>
        </Paper>
      ))}
    </Stack>
  );
};
