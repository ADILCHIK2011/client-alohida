import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Gates one dashboard page behind a permission key (see WorkersPage's
// permission checkboxes / User.permissions on the backend). Owners always
// pass — only cashiers are restricted, and only to the pages their owner
// explicitly checked for them.
export function RequirePermission({ permission }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'owner' && !user.permissions?.includes(permission)) {
    return <Navigate to="/cashier" replace />;
  }

  return <Outlet />;
}
