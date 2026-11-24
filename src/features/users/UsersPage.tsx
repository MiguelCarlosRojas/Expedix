import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Title, Text, Button, Table, Badge, ActionIcon, Modal,
  TextInput, Select, Group, Stack, Card, Avatar, Tooltip, Switch, Menu, Divider
} from '@mantine/core';
import {
  IconUsers, IconPlus, IconEdit, IconKey, IconCheck, IconAlertTriangle,
  IconUserCheck, IconUserX, IconPaw, IconDotsVertical
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { User, Role } from '../../types';
import { notifications } from '@mantine/notifications';
import { useSortableData } from '../../hooks/useSortableData';
import { SortableTh } from '../../components/ui/SortableTh';
import { TableSkeleton } from '../../components/ui/SkeletonLoaders';
import { EmptyState } from '../../components/ui/EmptyState';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // User Create / Edit Modal
  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset Password Modal
  const [resetModal, setResetModal] = useState(false);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get<{ results: User[] } | User[]>('/auth/users/'),
        api.get<{ results: Role[] } | Role[]>('/roles/'),
      ]);
      const usersList = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.results || []);
      const rolesList = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data.results || []);
      setUsers(usersList);
      setRoles(rolesList);
    } catch (e) {
      notifications.show({ title: 'Error', message: 'No se pudieron cargar los usuarios.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const { sortedData: sortedUsers, sortConfig, requestSort } = useSortableData(users, 'full_name', 'asc');

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setRoleId(roles[0] ? String(roles[0].id) : null);
    setUserModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setEmail(u.email);
    setPassword('');
    setFirstName(u.first_name);
    setLastName(u.last_name);
    setPhone(u.phone);
    setRoleId(u.role ? String(u.role) : null);
    setUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!username.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: roleId ? parseInt(roleId, 10) : null,
      };

      if (!editingUser) {
        payload.password = password || 'cambiar123';
        await api.post('/auth/users/', payload);
        notifications.show({ title: 'Usuario creado', message: `Usuario ${username} registrado.`, color: 'teal' });
      } else {
        await api.patch(`/auth/users/${editingUser.id}/`, payload);
        notifications.show({ title: 'Usuario actualizado', message: 'Datos modificados.', color: 'teal' });
      }

      setUserModal(false);
      fetchUsersAndRoles();
    } catch (e: any) {
      const detail = e.response?.data?.username?.[0] || e.response?.data?.email?.[0] || 'Error al guardar el usuario.';
      notifications.show({ title: 'Error', message: detail, color: 'red' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      const res = await api.post(`/auth/users/${u.id}/toggle_active/`);
      setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, is_active: res.data.is_active } : item)));
      notifications.show({ title: 'Estado modificado', message: res.data.message, color: 'teal' });
    } catch (e: any) {
      notifications.show({ title: 'Error', message: e.response?.data?.detail || 'Fallo al cambiar estado.', color: 'red' });
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset || newPassword.length < 6) return;
    try {
      await api.post(`/auth/users/${userToReset.id}/reset_password/`, { new_password: newPassword });
      setResetModal(false);
      setUserToReset(null);
      setNewPassword('');
      notifications.show({ title: 'Contraseña restablecida', message: 'Nueva clave establecida con éxito.', color: 'teal' });
    } catch (e: any) {
      notifications.show({ title: 'Error', message: 'Fallo al restablecer contraseña.', color: 'red' });
    }
  };

  return (
    <Box className="anim-fade-in">
      <Box mb="lg">
        <Group justify="space-between">
          <div>
            <Group gap="xs" mb={4}>
              <Badge color="vetGreen" variant="light" size="sm" leftSection={<IconPaw size={13} />}>
                Equipo Clínico & Operativo
              </Badge>
              <Badge color="gray" variant="outline" size="sm">
                Control de Cuentas
              </Badge>
            </Group>
            <Title order={2} fw={800} c="dark.8">
              Administración de Usuarios
            </Title>
            <Text c="dimmed" size="sm" mt={2}>
              Gestión de cuentas profesionales del personal veterinario, asignación de roles y estados de acceso.
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
            Nuevo Usuario
          </Button>
        </Group>
      </Box>

      {/* Users Table */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : sortedUsers.length === 0 ? (
        <EmptyState
          title="No hay usuarios registrados"
          description="Inicie registrando al personal médico veterinario y administrativo."
          actionText="Crear Primer Usuario"
          onAction={handleOpenCreate}
        />
      ) : (
        <Card p={0} radius="md" withBorder bg="white" shadow="xs" style={{ overflowX: 'auto' }}>
          <Table highlightOnHover verticalSpacing="sm" withTableBorder={false} withColumnBorders={false}>
            <Table.Thead>
              <Table.Tr>
                <SortableTh columnKey="full_name" sortConfig={sortConfig} onSort={requestSort}>
                  Usuario / Nombre
                </SortableTh>
                <SortableTh columnKey="email" sortConfig={sortConfig} onSort={requestSort}>
                  Correo Electrónico
                </SortableTh>
                <SortableTh columnKey="role_details" sortConfig={sortConfig} onSort={requestSort}>
                  Rol Clínico
                </SortableTh>
                <SortableTh columnKey="is_active" sortConfig={sortConfig} onSort={requestSort} align="center" width={110}>
                  Estado
                </SortableTh>
                <SortableTh columnKey="last_login" sortConfig={sortConfig} onSort={requestSort} width={160}>
                  Última Conexión
                </SortableTh>
                <SortableTh columnKey="created_by_name" sortConfig={sortConfig} onSort={requestSort} width={150}>
                  Registrado Por
                </SortableTh>
                <Table.Th style={{ textAlign: 'center', width: 110 }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedUsers.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td p="sm">
                    <Group gap="xs">
                      <Avatar src={u.avatar_display} radius="xl" size="sm" color="vetGreen">
                        {u.username.slice(0, 2).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={600} c="dark.8">{u.full_name}</Text>
                        <Text size="xs" c="dimmed">@{u.username}</Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td p="sm">
                    <Text size="xs">{u.email}</Text>
                  </Table.Td>
                  <Table.Td p="sm">
                    <Badge color="vetGreen" variant="light" size="sm">
                      {u.role_details?.name || (u.is_superuser ? 'Superadministrador' : 'Sin rol')}
                    </Badge>
                  </Table.Td>
                  <Table.Td p="sm" style={{ textAlign: 'center' }}>
                    <Badge color={u.is_active ? 'green' : 'red'} size="xs" variant="filled">
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Table.Td>
                  <Table.Td p="sm">
                    <Text size="xs" c="dimmed">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Nunca'}</Text>
                  </Table.Td>
                  <Table.Td p="sm">
                    <Text size="xs" c="dimmed">{u.created_by_name || 'Sistema'}</Text>
                  </Table.Td>
                  <Table.Td p="sm" style={{ textAlign: 'center' }}>
                    <Menu shadow="md" width={220} position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm" radius="md" title="Opciones de usuario">
                          <IconDotsVertical size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>Usuario: {u.username}</Menu.Label>
                        <Menu.Item
                          leftSection={<IconEdit size={15} color="#2563eb" />}
                          onClick={() => handleOpenEdit(u)}
                        >
                          Editar Datos
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconKey size={15} color="#64748b" />}
                          onClick={() => {
                            setUserToReset(u);
                            setNewPassword('');
                            setResetModal(true);
                          }}
                        >
                          Restablecer Contraseña
                        </Menu.Item>
                        <Divider />
                        <Menu.Item
                          leftSection={u.is_active ? <IconUserX size={15} color="#f97316" /> : <IconUserCheck size={15} color="#16a34a" />}
                          color={u.is_active ? 'orange' : 'teal'}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.is_active ? 'Desactivar Acceso' : 'Habilitar Acceso'}
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

      {/* Modal: Crear / Editar Usuario */}
      <Modal
        opened={userModal}
        onClose={() => setUserModal(false)}
        title={editingUser ? `Editar Usuario: ${editingUser.username}` : 'Registrar Nuevo Usuario Veterinario'}
        size="md"
      >
        <Stack gap="sm">
          <TextInput
            label="Usuario institucional"
            placeholder="mv.carlos"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            disabled={!!editingUser}
            required
          />
          <TextInput
            label="Correo Electrónico"
            placeholder="carlos@expedixvet.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
          {!editingUser && (
            <TextInput
              label="Contraseña inicial"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              type="password"
            />
          )}
          <Group grow>
            <TextInput
              label="Nombres"
              placeholder="Carlos"
              value={firstName}
              onChange={(e) => setFirstName(e.currentTarget.value)}
            />
            <TextInput
              label="Apellidos"
              placeholder="Rojas"
              value={lastName}
              onChange={(e) => setLastName(e.currentTarget.value)}
            />
          </Group>
          <TextInput
            label="Teléfono de contacto"
            placeholder="+51 987 654 321"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />
          <Select
            label="Rol de Acceso Asignado"
            placeholder="Seleccione un rol"
            data={roles.map((r) => ({ value: String(r.id), label: r.name }))}
            value={roleId}
            onChange={setRoleId}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setUserModal(false)}>
              Cancelar
            </Button>
            <Button color="vetGreen" loading={saving} onClick={handleSaveUser}>
              {editingUser ? 'Guardar Cambios' : 'Registrar Usuario'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal: Restablecer Contraseña */}
      <Modal
        opened={resetModal}
        onClose={() => setResetModal(false)}
        title={`Restablecer Contraseña: ${userToReset?.username}`}
        size="sm"
      >
        <Stack gap="md">
          <Text size="xs" c="dimmed">
            Ingrese la nueva contraseña de acceso para este usuario. Mínimo 6 caracteres.
          </Text>
          <TextInput
            label="Nueva contraseña"
            placeholder="Clave segura temporal"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            required
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setResetModal(false)}>
              Cancelar
            </Button>
            <Button
              color="vetGreen"
              disabled={newPassword.length < 6}
              onClick={handleResetPassword}
            >
              Confirmar Clave
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
