import { useAuth } from '../../contexts/AuthContext';
import { mockUsers, mockProsumers, mockNodes, mockReservations } from '../../data/mockData';
import { Users, Zap, Network, CalendarClock, TrendingUp, CheckCircle } from 'lucide-react';

function StatCard({ label, value, sub, icon, accent = '#d97706' }: {
  label: string; value: number | string; sub?: string; icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="stat-card d-flex justify-content-between align-items-start" style={{ borderTopColor: accent }}>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {sub && <div className="stat-sub">{sub}</div>}
        </div>
        <div className="stat-icon" style={{ background: `${accent}20`, color: accent }}>{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { role, user } = useAuth();
  const scheduledRes = mockReservations.filter(r => r.status === 'Scheduled').length;
  const completedRes = mockReservations.filter(r => r.status === 'Completed').length;
  const activeNodes  = mockNodes.filter(n => n.status === 'Active').length;

  return (
    <div>
      <div className="page-header">
        <h4>Welcome back, {user?.name?.split(' ')[0]} 👋</h4>
        <p>{role === 'Backoffice' ? 'System management overview' : 'Grid operations overview'}</p>
      </div>

      <div className="row g-3 mb-4">
        {role === 'Backoffice' ? (
          <>
            <StatCard label="Total Users"         value={mockUsers.length}    sub={`${mockUsers.filter(u => u.status === 'Active').length} active`}       icon={<Users size={20} />}        accent="#d97706" />
            <StatCard label="Active Prosumers"    value={mockProsumers.filter(p => p.status === 'Active').length} sub={`${mockProsumers.length} total`}   icon={<Zap size={20} />}          accent="#059669" />
            <StatCard label="Microgrid Nodes"     value={mockNodes.length}    sub={`${activeNodes} active`}                                                icon={<Network size={20} />}      accent="#0284c7" />
            <StatCard label="Scheduled Slots"     value={scheduledRes}        sub="upcoming reservations"                                                  icon={<CalendarClock size={20} />} accent="#d97706" />
          </>
        ) : (
          <>
            <StatCard label="Active Nodes"        value={activeNodes}         sub={`${mockNodes.length} total`}     icon={<Network size={20} />}       accent="#d97706" />
            <StatCard label="Scheduled Slots"     value={scheduledRes}        sub="upcoming"                        icon={<CalendarClock size={20} />}  accent="#059669" />
            <StatCard label="Active Reservations" value={scheduledRes}        sub="requires action"                 icon={<TrendingUp size={20} />}     accent="#0284c7" />
            <StatCard label="Completed Today"     value={completedRes}        sub="sessions done"                   icon={<CheckCircle size={20} />}    accent="#059669" />
          </>
        )}
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="ssmts-card">
            <div className="ssmts-card-header">Recent Reservations</div>
            <div className="p-0">
              <table className="table ssmts-table mb-0">
                <thead>
                  <tr><th>ID</th><th>Prosumer</th><th>Node</th><th>Date</th><th>Type</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {mockReservations.slice(0, 5).map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.id}</td>
                      <td style={{ fontSize: '0.82rem' }}>{r.prosumerName}</td>
                      <td style={{ fontSize: '0.8rem' }}>{r.nodeName}</td>
                      <td style={{ fontSize: '0.8rem' }}>{r.slotDate}</td>
                      <td><span className={`type-pill type-${r.type.toLowerCase()}`}>{r.type}</span></td>
                      <td><span className={`status-pill status-${r.status.toLowerCase()}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="ssmts-card">
            <div className="ssmts-card-header">Node Status</div>
            <div className="ssmts-card-body">
              {mockNodes.map(node => (
                <div key={node.nodeId} className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{node.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{node.capacityKW} kW · {node.batterySlots} slots</div>
                  </div>
                  <span className={`status-pill status-${node.status.toLowerCase()}`}>{node.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
