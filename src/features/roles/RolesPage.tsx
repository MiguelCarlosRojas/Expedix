import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Title, Text, Button, Table, Badge, ActionIcon, Modal,
  TextInput, Textarea, Group, Stack, Checkbox, SimpleGrid, Card, Tooltip, Menu
} from '@mantine/core';
import {
  IconShieldLock, IconPlus, IconCopy, IconEdit, IconCheck, IconAlertTriangle,
  IconPaw, IconDotsVertical
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { Role, Permission } from '../../types';
import { notifications } from '@mantine/notifications';
import { useSortableData } from '../../hooks/useSortableData';
import { SortableTh } from '../../components/ui/SortableTh';
import { TableSkeleton } from '../../components/ui/SkeletonLoaders';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  // Role Form Modal
  const [modalOpened, setModalOpened] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
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

  const { sortedData: sortedRoles, sortConfig, requestSort } = useSortableData(roles, 'name', 'asc');

  const handleOpenCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setSelectedPermIds([]);
    setModalOpened(true);
  };

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
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
      const payload: Record<string, any> = {
        name: roleName,
        description: roleDesc,
        permission_ids: selectedPermIds,
      };

      if (editingRole) {
        payload.code = editingRole.code;
        await api.put(`/roles/${editingRole.id}/`, payload);
        notifications.show({ title: 'Rol actualizado', message: 'Cambios guardados con éxito.', color: 'teal' });
      } else {
        await api.post('/roles/', payload);
        notifications.show({ title: 'Rol creado', message: 'Nuevo rol clínico registrado.', color: 'teal' });
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
    <Box className="anim-fade-in">
      <Box mb="lg">
        <Group justify="space-between">
          <div>
            <Group gap="xs" mb={4}>
              <Badge color="vetGreen" variant="light" size="sm" leftSection={<IconPaw size={13} />}>
                Seguridad & Matriz de Privilegios
              </Badge>
              <Badge color="gray" variant="outline" size="sm">
                Control RBAC
              </Badge>
            </Group>
            <Title order={2} fw={800} c="dark.8">
              Roles y Permisos del Sistema Veterinario
            </Title>
            <Text c="dimmed" size="sm" mt={2}>
              Control de acceso basado en roles con aplicación estricta de permisos en backend para cada función clínica y administrativa.
            </Text>
          </div>

          <Button
            color="vetGreen"
            leftSection={<IconPlus size={18} />}
            onClick={handleOpenCreate}
            styles={{
              root: {
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)',
              },
            }}
          >
            Nuevo Rol
          </Button>
        </Group>
      </Box>

      {/* Roles List */}
      {loading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <Card p={0} radius="md" withBorder bg="white" shadow="xs" style={{ overflowX: 'auto' }}>
          <Table highlightOnHover verticalSpacing="sm" withTableBorder={false} withColumnBorders={false}>
            <Table.Thead>
              <Table.Tr>
                <SortableTh columnKey="name" sortConfig={sortConfig} onSort={requestSort}>
                  Nombre del Rol
                </SortableTh>
                <SortableTh columnKey="description" sortConfig={sortConfig} onSort={requestSort}>
                  Descripción
                </SortableTh>
                <SortableTh columnKey="user_count" sortConfig={sortConfig} onSort={requestSort} align="center" width={150}>
                  Usuarios Asignados
                </SortableTh>
                <SortableTh columnKey="is_active" sortConfig={sortConfig} onSort={requestSort} align="center" width={130}>
                  Estado
                </SortableTh>
                <Table.Th style={{ textAlign: 'center', width: 120 }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedRoles.map((role) => (
                <Table.Tr key={role.id}>
                  <Table.Td p="sm" fw={700} c="dark.8">
                    <Group gap="xs">
                      <IconShieldLock size={18} color="#16a34a" />
                      <Text size="sm">{role.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td p="sm" style={{ maxWidth: 380 }}>
                    <Text size="xs" c="dimmed" lineClamp={2}>{role.description || 'Sin descripción detallada'}</Text>
                  </Table.Td>
                  <Table.Td p="sm" style={{ textAlign: 'center' }}>
                    <Badge variant="light" color="vetGreen" size="xs">
                      {role.user_count || 0} usuarios
                    </Badge>
                  </Table.Td>
                  <Table.Td p="sm" style={{ textAlign: 'center' }}>
                    <Badge color={role.is_active ? 'green' : 'gray'} variant="light" size="sm">
                      {role.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Table.Td>
                  <Table.Td p="sm" style={{ textAlign: 'center' }}>
                    <Menu shadow="md" width={220} position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm" radius="md" title="Opciones del rol">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>Rol: {role.name}</Menu.Label>
                        <Menu.Item
                          leftSection={<IconEdit size={15} color="#2563eb" />}
                          onClick={() => handleOpenEdit(role)}
                        >
                          Editar Permisos
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconCopy size={15} color="#64748b" />}
                          onClick={() => handleDuplicate(role.id)}
                        >
                          Clonar Rol
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Modal: Crear / Editar Rol con Matriz de 72 Permisos */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingRole ? `Editar Rol: ${editingRole.name}` : 'Crear Nuevo Rol de Acceso'}
        size="xl"
      >
        <Stack gap="md">
          <TextInput
            label="Nombre del Rol"
            placeholder="Ej: Médico Veterinario Residente"
            value={roleName}
            onChange={(e) => setRoleName(e.currentTarget.value)}
            required
          />

          <Textarea
            label="Descripción del Rol"
            placeholder="Alcance operativo y clínico de las acciones permitidas..."
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.currentTarget.value)}
          />

          <Box mt="xs">
            <Group justify="space-between" mb="xs">
              <Text fw={700} size="sm">
                Matriz de Permisos por Módulo ({selectedPermIds.length} seleccionados)
              </Text>
              <Group gap="xs">
                <Button
                  size="xs"
                  variant="light"
                  color="vetGreen"
                  onClick={() => setSelectedPermIds(allPermissions.map((p) => p.id))}
                >
                  Seleccionar Todos
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => setSelectedPermIds([])}
                >
                  Deseleccionar
                </Button>
              </Group>
            </Group>

            <Stack gap="md" style={{ maxHeight: 380, overflowY: 'auto' }} p="xs">
              {Object.entries(permsByModule).map(([moduleName, perms]) => {
                const allModuleSelected = perms.every((p) => selectedPermIds.includes(p.id));
                return (
                  <Paper key={moduleName} p="sm" radius="md" withBorder bg="gray.0">
                    <Group justify="space-between" mb="xs">
                      <Text fw={700} size="xs" tt="uppercase" c="vetGreen.9">
                        Módulo: {moduleName}
                      </Text>
                      <Checkbox
                        size="xs"
                        label="Todos"
                        checked={allModuleSelected}
                        onChange={(e) => {
                          const ids = perms.map((p) => p.id);
                          if (e.currentTarget.checked) {
                            setSelectedPermIds((prev) => [...new Set([...prev, ...ids])]);
                          } else {
                            setSelectedPermIds((prev) => prev.filter((id) => !ids.includes(id)));
                          }
                        }}
                      />
                    </Group>
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xs">
                      {perms.map((p) => (
                        <Checkbox
                          key={p.id}
                          size="xs"
                          label={p.name}
                          checked={selectedPermIds.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                        />
                      ))}
                    </SimpleGrid>
                  </Paper>
                );
              })}
            </Stack>
          </Box>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancelar
            </Button>
            <Button color="vetGreen" loading={saving} onClick={handleSaveRole}>
              {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
