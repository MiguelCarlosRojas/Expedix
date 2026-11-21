import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Title, Text, Button, Table, Badge, ActionIcon, Modal,
  TextInput, Select, Group, Stack, Card, Avatar, Tooltip, Switch
} from '@mantine/core';
import {
  IconUsers, IconPlus, IconEdit, IconKey, IconCheck, IconAlertTriangle,
  IconUserCheck, IconUserX
} from '@tabler/icons-react';
import { api } from '../../services/api';
import { User, Role } from '../../types';
import { notifications } from '@mantine/notifications';

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
  const [jobTitle, setJobTitle] = useState('');
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

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setJobTitle('');
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
    setJobTitle(u.job_title);
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
        job_title: jobTitle,
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
    <Box>
      <Box mb="lg">
        <Group justify="space-between">
          <div>
            <Title order={2} fw={800} c="dark.8">
              Administración de Usuarios y Cuentas
            </Title>
            <Text c="dimmed" size="sm">
              Gestión de credenciales, roles asignados, auditoría de creación y control de accesos.
            </Text>
          </div>

          <Button
            color="enterpriseBlue"
            leftSection={<IconPlus size={18} />}
            onClick={handleOpenCreate}
          >
            Nuevo Usuario
          </Button>
        </Group>
      </Box>

      {/* Users Table */}
      <Card p={0} radius="md" withBorder bg="white">
        <Table highlightOnHover verticalSpacing="sm">
          <Table.Thead bg="gray.0">
            <Table.Tr>
              <Table.Th>Usuario / Nombre</Table.Th>
              <Table.Th>Correo Electrónico</Table.Th>
              <Table.Th>Rol Asignado</Table.Th>
              <Table.Th>Cargo</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Última Conexión</Table.Th>
              <Table.Th>Creado Por</Table.Th>
              <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>
                  <Group gap="xs">
                    <Avatar src={u.avatar_display} radius="xl" size="sm" color="enterpriseBlue">
                      {u.username.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={600} c="dark.8">{u.full_name}</Text>
                      <Text size="xs" c="dimmed">@{u.username}</Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{u.email}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color="enterpriseBlue" variant="light" size="sm">
                    {u.role_details?.name || (u.is_superuser ? 'Superadministrador' : 'Sin rol')}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{u.job_title || '-'}</Text>
                </Table.Td>
                <Table.Td>
                  <Badge color={u.is_active ? 'teal' : 'red'} size="xs" variant="filled">
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{u.last_login ? new Date(u.last_login).toLocaleString() : 'Nunca'}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">{u.created_by_name || 'Sistema'}</Text>
                </Table.Td>
                <Table.Td style={{ textAlign: 'right' }}>
                  <Group gap={4} justify="flex-end">
                    <Tooltip label={u.is_active ? 'Desactivar usuario' : 'Activar usuario'}>
                      <ActionIcon
                        variant="subtle"
                        color={u.is_active ? 'orange' : 'teal'}
                        size="sm"
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.is_active ? <IconUserX size={16} /> : <IconUserCheck size={16} />}
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Restablecer contraseña">
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        size="sm"
                        onClick={() => {
                          setUserToReset(u);
                          setNewPassword('');
                          setResetModal(true);
                        }}
                      >
                        <IconKey size={16} />
                      </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Editar datos">
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* User Create / Edit Modal */}
      <Modal
        opened={userModal}
        onClose={() => setUserModal(false)}
        title={<Text fw={700}>{editingUser ? `Editar Usuario: ${editingUser.username}` : 'Registrar Nuevo Usuario'}</Text>}
        centered
        size="md"
      >
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="Nombres"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.currentTarget.value)}
            />
            <TextInput
              label="Apellidos"
              required
              value={lastName}
              onChange={(e) => setLastName(e.currentTarget.value)}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Nombre de Usuario"
              required
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
            />
            <TextInput
              label="Correo Electrónico"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </Group>

          {!editingUser && (
            <TextInput
              label="Contraseña Inicial"
              placeholder="Mínimo 6 caracteres"
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
          )}

          <Group grow>
            <TextInput
              label="Teléfono"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
            <TextInput
              label="Cargo / Área"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.currentTarget.value)}
            />
          </Group>

          <Select
            label="Rol de Seguridad Asignado"
            data={roles.map((r) => ({ value: String(r.id), label: `${r.name} (${r.code})` }))}
            value={roleId}
            onChange={setRoleId}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setUserModal(false)}>
              Cancelar
            </Button>
            <Button color="enterpriseBlue" loading={saving} onClick={handleSaveUser}>
              {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        opened={resetModal}
        onClose={() => setResetModal(false)}
        title="Restablecer Contraseña"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Ingrese la nueva contraseña para el usuario <b>{userToReset?.username}</b>:
          </Text>
          <TextInput
            label="Nueva contraseña"
            placeholder="Mínimo 6 caracteres"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setResetModal(false)}>
              Cancelar
            </Button>
            <Button color="enterpriseBlue" disabled={newPassword.length < 6} onClick={handleResetPassword}>
              Actualizar Contraseña
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
};
