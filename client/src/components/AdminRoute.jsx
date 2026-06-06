import { Navigate } from 'react-router-dom';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();

  if (authLoading || adminLoading) return <div className="p-6 text-center text-sm text-stone-600">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/deals" replace />;

  return children;
}
