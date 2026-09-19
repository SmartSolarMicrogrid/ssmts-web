import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell } from 'lucide-react';

const TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/users':        'User Management',
  '/prosumers':    'Prosumer Management',
  '/nodes':        'Microgrid Node Management',
  '/reservations': 'Energy Slot Reservations',
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = TITLES[pathname] ?? 'SSMTS';
  const initials = user?.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U';

  return (
    <header className="ssmts-topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>SmartSolar Microgrid Transaction System (SSMTS)</div>
      </div>
      <div className="topbar-right">
        <button className="btn btn-sm btn-outline-secondary" style={{ padding: '0.3rem 0.6rem' }}>
          <Bell size={14} />
        </button>
        <div className="d-flex align-items-center gap-2">
          <div className="user-avatar">{initials}</div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#111827' }}>{user?.name}</div>
            <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
