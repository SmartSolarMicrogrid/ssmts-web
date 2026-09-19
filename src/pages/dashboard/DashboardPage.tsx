import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, prosumersApi, nodesApi, reservationsApi } from '../../services/api';
import type { User, Prosumer, MicrogridNode, Reservation } from '../../types';
import { Users, Zap, Network, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({
  label,
  value,
  sub,
  icon,
  accent = '#d97706',
  linkTo,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
  linkTo?: string;
}) {
  const cardContent = (
    <div className="stat-card d-flex justify-content-between align-items-start h-100" style={{ borderTopColor: accent }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div className="stat-icon" style={{ background: `${accent}20`, color: accent }}>{icon}</div>
    </div>
  );

  return (
    <div className="col-12 col-sm-6 col-xl-3">
      {linkTo ? (
        <Link to={linkTo} style={{ textDecoration: 'none', color: 'inherit' }}>
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { role, user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [nodes, setNodes] = useState<MicrogridNode[]>([]);
  const [prosumers, setProsumers] = useState<Prosumer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [resList, nodeList, prosumerList, userList] = await Promise.all([
          reservationsApi.getAll().catch(() => []),
          nodesApi.getAll().catch(() => []),
          prosumersApi.getAll().catch(() => []),
          role === 'Backoffice' ? usersApi.getAll().catch(() => []) : Promise.resolve([]),
        ]);
        setReservations(resList);
        setNodes(nodeList);
        setProsumers(prosumerList);
        setUsers(userList);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [role]);

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingReservations = reservations.filter(r => r.status === 'Pending').length;
  const approvedFutureReservations = reservations.filter(
    r => r.status === 'Approved' && r.slotDate >= todayStr
  ).length;
  const activeNodes = nodes.filter(n => n.status === 'Active').length;
  const pendingProsumers = prosumers.filter(p => p.status === 'PendingActivation').length;
  const totalCapacityKW = nodes.reduce((acc, n) => acc + (n.capacityKW || 0), 0);

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-center">
        <div>
          <h4>Welcome back, {user?.name?.split(' ')[0] || 'Officer'} 👋</h4>
          <p>
            {role === 'Backoffice'
              ? 'System Administration & Commercial Operations Console'
              : 'Microgrid Operations & Live Energy Flow Dispatch Console'}
          </p>
        </div>
        <span className="badge" style={{ background: role === 'Backoffice' ? '#d97706' : '#0284c7', color: '#fff', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
          {role === 'Backoffice' ? 'Backoffice Officer' : 'Grid Operator'}
        </span>
      </div>

      {/* Primary KPI Metrics */}
      <div className="row g-3 mb-4">
        {role === 'Backoffice' ? (
          <>
            <StatCard
              label="Pending Reservations"
              value={pendingReservations}
              sub="Awaiting operator review"
              icon={<Clock size={20} />}
              accent="#f59e0b"
              linkTo="/reservations"
            />
            <StatCard
              label="Approved Future Slots"
              value={approvedFutureReservations}
              sub="Confirmed upcoming slots"
              icon={<CheckCircle2 size={20} />}
              accent="#059669"
              linkTo="/reservations"
            />
            <StatCard
              label="Pending Prosumers"
              value={pendingProsumers}
              sub={`${prosumers.length} total registered`}
              icon={<Zap size={20} />}
              accent="#d97706"
              linkTo="/prosumers"
            />
            <StatCard
              label="Active Users"
              value={users.filter(u => u.status === 'Active').length}
              sub={`${users.length} total staff`}
              icon={<Users size={20} />}
              accent="#0284c7"
              linkTo="/users"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Pending Slot Reviews"
              value={pendingReservations}
              sub="Action required"
              icon={<Clock size={20} />}
              accent="#f59e0b"
              linkTo="/reservations"
            />
            <StatCard
              label="Approved Future Slots"
              value={approvedFutureReservations}
              sub="Next 7 days schedule"
              icon={<CheckCircle2 size={20} />}
              accent="#059669"
              linkTo="/reservations"
            />
            <StatCard
              label="Active Grid Hubs"
              value={activeNodes}
              sub={`${nodes.length} total hubs online`}
              icon={<Network size={20} />}
              accent="#0284c7"
              linkTo="/nodes"
            />
            <StatCard
              label="Total Capacity"
              value={`${totalCapacityKW} kW`}
              sub="Network generation capacity"
              icon={<Zap size={20} />}
              accent="#d97706"
              linkTo="/nodes"
            />
          </>
        )}
      </div>

      {/* Main Content Row */}
      <div className="row g-3">
        {/* Recent & Pending Reservations */}
        <div className="col-12 col-lg-8">
          <div className="ssmts-card">
            <div className="ssmts-card-header d-flex justify-content-between align-items-center">
              <span>Live Reservation Activity</span>
              <Link to="/reservations" className="d-flex align-items-center gap-1 text-decoration-none text-amber" style={{ fontSize: '0.78rem' }}>
                View All <ArrowRight size={13} />
              </Link>
            </div>
            <div className="p-0">
              {loading ? (
                <div className="text-center py-4 text-muted">Loading live reservations...</div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-4 text-muted">No reservations recorded in database.</div>
              ) : (
                <table className="table ssmts-table mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Prosumer</th>
                      <th>Node / Hub</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.slice(0, 6).map(r => (
                      <tr key={r.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.id}</td>
                        <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.prosumerName}</td>
                        <td style={{ fontSize: '0.8rem' }}>{r.nodeName}</td>
                        <td style={{ fontSize: '0.8rem' }}>{r.slotDate}</td>
                        <td>
                          <span className={`type-pill type-${r.type.toLowerCase()}`}>{r.type}</span>
                        </td>
                        <td>
                          <span className={`status-pill status-${r.status.toLowerCase()}`}>{r.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Microgrid Hubs Overview */}
        <div className="col-12 col-lg-4">
          <div className="ssmts-card">
            <div className="ssmts-card-header d-flex justify-content-between align-items-center">
              <span>Microgrid Hub Telemetry</span>
              <Link to="/nodes" className="d-flex align-items-center gap-1 text-decoration-none text-amber" style={{ fontSize: '0.78rem' }}>
                Manage <ArrowRight size={13} />
              </Link>
            </div>
            <div className="ssmts-card-body">
              {loading ? (
                <div className="text-center py-4 text-muted">Loading solar stations...</div>
              ) : nodes.length === 0 ? (
                <div className="text-center py-4 text-muted">No microgrid stations registered.</div>
              ) : (
                nodes.map(node => (
                  <div key={node.nodeId} className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{node.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>
                        {node.capacityKW} kW · {node.batterySlots} storage slots
                      </div>
                    </div>
                    <span className={`status-pill status-${node.status.toLowerCase()}`}>{node.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
