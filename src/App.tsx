import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage        from './pages/auth/LoginPage';
import DashboardPage    from './pages/dashboard/DashboardPage';
import UsersPage        from './pages/users/UsersPage';
import ProsumersPage    from './pages/prosumers/ProsumersPage';
import NodesPage        from './pages/nodes/NodesPage';
import ReservationsPage from './pages/reservations/ReservationsPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — Backoffice only */}
      <Route path="/users" element={
        <DashboardLayout allowedRoles={['Backoffice']}>
          <UsersPage />
        </DashboardLayout>
      } />
      <Route path="/prosumers" element={
        <DashboardLayout allowedRoles={['Backoffice']}>
          <ProsumersPage />
        </DashboardLayout>
      } />

      {/* Protected — Backoffice + GridOperator */}
      <Route path="/dashboard" element={
        <DashboardLayout>
          <DashboardPage />
        </DashboardLayout>
      } />
      <Route path="/nodes" element={
        <DashboardLayout>
          <NodesPage />
        </DashboardLayout>
      } />
      <Route path="/reservations" element={
        <DashboardLayout>
          <ReservationsPage />
        </DashboardLayout>
      } />

      {/* Catch-all → login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
