import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Users, Zap, Network, CalendarClock, LogOut } from 'lucide-react';

export default function Sidebar() {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="ssmts-sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="SmartSolar Logo" className="brand-logo" />
        <div className="brand-info">
          <span className="brand-text">Smart<span>Solar</span></span>
          <span className="brand-sub">SSMTS Portal</span>
        </div>
      </div>

      <nav className="mt-2">
        <div className="nav-section-label">Main</div>
        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={16} className="nav-icon" /> Dashboard
        </NavLink>

        {role === 'Backoffice' && (
          <>
            <div className="nav-section-label mt-3">Management</div>
            <NavLink to="/users" className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}>
              <Users size={16} className="nav-icon" /> Users
            </NavLink>
            <NavLink to="/prosumers" className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}>
              <Zap size={16} className="nav-icon" /> Prosumers
            </NavLink>
          </>
        )}

        <div className="nav-section-label mt-3">Operations</div>
        <NavLink to="/nodes" className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}>
          <Network size={16} className="nav-icon" /> Microgrid Nodes
        </NavLink>
        <NavLink to="/reservations" className={({ isActive }) => `sidebar-nav-link${isActive ? ' active' : ''}`}>
          <CalendarClock size={16} className="nav-icon" /> Reservations
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#111827' }}>{user?.name}</div>
        <div style={{ fontSize: '0.72rem' }}>{user?.role}</div>
        <button className="btn btn-sm btn-outline-secondary mt-2 w-100 d-flex align-items-center gap-1" onClick={handleLogout} style={{ fontSize: '0.78rem' }}>
          <LogOut size={13} /> Logout
        </button>
      </div>
    </aside>
  );
}
