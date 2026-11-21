import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (user.role_details?.code === 'SUPERADMINISTRADOR') return true;

    const codename = `${module}_${action}`;
    return user.permissions_list?.includes(codename) ?? false;
  };

  const hasModuleAccess = (module: string): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    if (user.role_details?.code === 'SUPERADMINISTRADOR') return true;

    // Checks if user has any action permission for the module
    return (user.permissions_list || []).some((perm) => perm.startsWith(`${module}_`));
  };

  return { hasPermission, hasModuleAccess };
};
