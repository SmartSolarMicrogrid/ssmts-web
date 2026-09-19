import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import type { UserRole } from '../../types';

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function DashboardLayout({ children, allowedRoles }: Props) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100" style={{ background: '#0a0f1d' }}>
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;

  return (
    <div className="ssmts-layout">
      <Sidebar />
      <div className="ssmts-main">
        <Topbar />
        <main className="ssmts-content fade-in">{children}</main>
      </div>
    </div>
  );
}
