import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Title, Text, Button, Table, Badge, ActionIcon, Modal,
  TextInput, Textarea, Group, Stack, Checkbox, SimpleGrid, Card, Tooltip
} from '@mantine/core';
import {
  IconShieldLock, IconPlus, IconCopy, IconEdit, IconTrash, IconCheck, IconAlertTriangle
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { Role, Permission } from '../../types';
import { notifications } from '@mantine/notifications';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Role Form Modal
  const [modalOpened, setModalOpened] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchRolesAndPermissions = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get<{ results: Role[] } | Role[]>('/roles/'),
        api.get<Permission[]>('/roles/permissions_list/'),
      ]);
      const rolesList = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data.results || []);
      setRoles(rolesList);
      setAllPermissions(permsRes.data);
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudieron cargar los roles.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleCode('');
    setRoleDesc('');
    setSelectedPermIds([]);
    setModalOpened(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleCode(role.code);
    setRoleDesc(role.description);
    const existingIds = (role.permissions || []).map((p) => p.id);
    setSelectedPermIds(existingIds);
    setModalOpened(true);
  };

  const handleDuplicate = async (roleId: number) => {
    try {
      await api.post(`/roles/${roleId}/duplicate/`);
      notifications.show({ title: 'Rol duplicado', message: 'Copia del rol creada.', color: 'teal' });
      fetchRolesAndPermissions();
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo duplicar el rol.', color: 'red' });
    }
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: roleName,
        code: roleCode || roleName.toUpperCase().replace(/\s+/g, '_'),
        description: roleDesc,
        permission_ids: selectedPermIds,
      };

      if (editingRole) {
        await api.put(`/roles/${editingRole.id}/`, payload);
        notifications.show({ title: 'Rol actualizado', message: 'Cambios guardados.', color: 'teal' });
      } else {
        await api.post('/roles/', payload);
        notifications.show({ title: 'Rol creado', message: 'Nuevo rol registrado.', color: 'teal' });
      }

      setModalOpened(false);
      fetchRolesAndPermissions();
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudo guardar el rol.', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by module
  const permsByModule = allPermissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const togglePermission = (id: number) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <Box>
      <Box mb="lg">
        <Group justify="space-between">
          <div>
            <Title order={2} fw={800} c="dark.8">
              Roles y Matriz de Privilegios
            </Title>
            <Text c="dimmed" size="sm">
              Control de acceso basado en roles (RBAC) con aplicación estricta de permisos en backend.
            </Text>
          </div>

          <Button
            color="enterpriseBlue"
            leftSection={<IconPlus size={18} />}
            onClick={handleOpenCreate}
          >
            Nuevo Rol
          </Button>
        </Group>
      </Box>

      {/* Roles List */}
      <Card p={0} radius="md" withBorder bg="white">
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead bg="gray.0">
            <Table.Tr>
              <Table.Th>Nombre del Rol</Table.Th>
              <Table.Th>Código de Sistema</Table.Th>
              <Table.Th>Descripción</Table.Th>
              <Table.Th>Usuarios Asignados</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {roles.map((role) => (
              <Table.Tr key={role.id}>
                <Table.Td fw={700} c="dark.8">
                  <Group gap="xs">
                    <IconShieldLock size={18} color="#0b7285" />
                    <Text size="sm">{role.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" ff="monospace" c="dimmed">{role.code}</Text>
                </Table.Td>
                <Table.Td style={{ maxWidth: 300 }}>
                  <Text size="xs" c="dimmed">{role.description}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="blue" size="xs">
                    {role.user_count || 0} usuarios
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge color={role.is_active ? 'teal' : 'gray'} variant="light" size="sm">
                    {role.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Group gap={4} justify="flex-end">
                    <Tooltip label="Editar Rol y Permisos">
                      <ActionIcon variant="subtle" color="blue" onClick={() => handleOpenEdit(role)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Duplicar Rol">
                      <ActionIcon variant="subtle" color="gray" onClick={() => handleDuplicate(role.id)}>
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Role & Permissions Matrix Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <IconShieldLock size={20} color="#0b7285" />
            <Text fw={700} size="md">
              {editingRole ? `Editar Rol: ${editingRole.name}` : 'Crear Nuevo Rol'}
            </Text>
          </Group>
        }
        size="xl"
        centered
      >
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Nombre del Rol"
              placeholder="Ej. Operador Contable"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.currentTarget.value)}
            />
            <TextInput
              label="Código de Sistema"
              placeholder="OPERADOR_CONTABLE"
              required
              value={roleCode}
              onChange={(e) => setRoleCode(e.currentTarget.value)}
            />
          </Group>

          <Textarea
            label="Descripción del Rol"
            placeholder="Alcance y responsabilidades..."
            minRows={2}
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.currentTarget.value)}
          />

          <Box mt="xs">
            <Text fw={700} size="sm" mb={4}>Matriz de Permisos Granulares:</Text>
            <Text size="xs" c="dimmed" mb="md">
              Seleccione los módulos y acciones habilitados para este perfil.
            </Text>

            <Stack gap="md" style={{ maxHeight: '45vh', overflowY: 'auto' }}>
              {Object.entries(permsByModule).map(([moduleName, modulePerms]) => (
                <Paper key={moduleName} p="sm" withBorder radius="md" bg="gray.0">
                  <Text fw={700} size="xs" c="enterpriseBlue.8" mb="xs" tt="uppercase">
                    Módulo: {moduleName}
                  </Text>
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
                    {modulePerms.map((perm) => (
                      <Checkbox
                        key={perm.id}
                        label={perm.name}
                        size="xs"
                        checked={selectedPermIds.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                    ))}
                  </SimpleGrid>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancelar
            </Button>
            <Button color="enterpriseBlue" loading={saving} onClick={handleSaveRole}>
              Guardar Rol
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
