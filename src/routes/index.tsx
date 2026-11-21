import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/authentication/LoginPage';
import { HomePage } from '../features/home/HomePage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { DrivesPage } from '../features/drives/DrivesPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { AdministrationPage } from '../features/administration/AdministrationPage';
import { RolesPage } from '../features/roles/RolesPage';
import { UsersPage } from '../features/users/UsersPage';
import { Loader, Center } from '@mantine/core';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center style={{ width: '100vw', height: '100vh' }}>
        <Loader size="lg" color="enterpriseBlue" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Enterprise Modules */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/inicio" replace />} />
        <Route path="inicio" element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="documentos" element={<DocumentsPage />} />
        <Route path="drives" element={<DrivesPage />} />
        <Route path="reportes" element={<ReportsPage />} />
        <Route path="administracion" element={<AdministrationPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="usuarios" element={<UsersPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/app/inicio" replace />} />
      <Route path="*" element={<Navigate to="/app/inicio" replace />} />
    </Routes>
  );
};
