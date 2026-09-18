import { useState } from 'react';
import { mockNodes as init, mockReservations } from '../../data/mockData';
import type { MicrogridNode, NodeStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import { Plus, Pencil, PowerOff, MapPin, AlertTriangle, Trash2, BatteryCharging, Zap } from 'lucide-react';

const HOURS = [
  '06:00 - 18:00',
  '06:00 - 20:00',
  '06:00 - 22:00',
  '07:00 - 19:00',
  '07:00 - 20:00',
  '08:00 - 18:00',
  '08:00 - 20:00',
  '24 Hours',
];

type FormState = {
  name: string;
  lat: string;
  lng: string;
  capacityKW: string;
  capacityKWh: string;
  batterySlots: string;
  operatingHours: string;
  status: NodeStatus;
};

function NodeModal({ node, onSave, onClose }: { node: MicrogridNode | null; onSave: (d: FormState) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>({
    name: node?.name ?? '',
    lat: String(node?.location.lat ?? ''),
    lng: String(node?.location.lng ?? ''),
    capacityKW: String(node?.capacityKW ?? ''),
    capacityKWh: String(node?.capacityKWh ?? (node?.capacityKW ? node.capacityKW * 4 : '')),
    batterySlots: String(node?.batterySlots ?? ''),
    operatingHours: node?.operatingHours ?? HOURS[0],
    status: node?.status ?? 'Active',
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Node name required';
    if (isNaN(Number(form.lat)) || !form.lat) e.lat = 'Valid GPS latitude required';
    if (isNaN(Number(form.lng)) || !form.lng) e.lng = 'Valid GPS longitude required';
    if (!form.capacityKW || Number(form.capacityKW) <= 0) e.capacityKW = 'Power capacity must be > 0 kW';
    if (!form.capacityKWh || Number(form.capacityKWh) <= 0) e.capacityKWh = 'Storage capacity must be > 0 kWh';
    if (!form.batterySlots || Number(form.batterySlots) <= 0) e.batterySlots = 'Battery slots must be > 0';
    setErr(e); return !Object.keys(e).length;
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) onSave(form); };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.4)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title">{node ? 'Edit Microgrid Node & Slots' : 'Add Solar Grid Hub'}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Node / Hub Name</label>
                <input id="node-name" className={`form-control ${err.name ? 'is-invalid' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Colombo Central Hub" />
                {err.name && <div className="invalid-feedback">{err.name}</div>}
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">GPS Latitude</label>
                  <input id="node-lat" className={`form-control ${err.lat ? 'is-invalid' : ''}`} value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="6.9271" />
                  {err.lat && <div className="invalid-feedback">{err.lat}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">GPS Longitude</label>
                  <input id="node-lng" className={`form-control ${err.lng ? 'is-invalid' : ''}`} value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="79.8612" />
                  {err.lng && <div className="invalid-feedback">{err.lng}</div>}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Power Rating (kW)</label>
                  <input id="node-capacity" type="number" className={`form-control ${err.capacityKW ? 'is-invalid' : ''}`} value={form.capacityKW} onChange={e => set('capacityKW', e.target.value)} placeholder="500" />
                  {err.capacityKW && <div className="invalid-feedback">{err.capacityKW}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">Storage (kWh)</label>
                  <input id="node-storage" type="number" className={`form-control ${err.capacityKWh ? 'is-invalid' : ''}`} value={form.capacityKWh} onChange={e => set('capacityKWh', e.target.value)} placeholder="2000" />
                  {err.capacityKWh && <div className="invalid-feedback">{err.capacityKWh}</div>}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Battery Storage Slots</label>
                  <input id="node-slots" type="number" min={1} className={`form-control ${err.batterySlots ? 'is-invalid' : ''}`} value={form.batterySlots} onChange={e => set('batterySlots', e.target.value)} placeholder="12" />
                  {err.batterySlots && <div className="invalid-feedback">{err.batterySlots}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">Operating Schedule</label>
                  <select id="node-hours" className="form-select" value={form.operatingHours} onChange={e => set('operatingHours', e.target.value)}>
                    {HOURS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              {node && (
                <div className="mb-3">
                  <label className="form-label">Operational Status</label>
                  <select id="node-status" className="form-select" value={form.status} onChange={e => set('status', e.target.value as NodeStatus)}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-amber btn-sm">{node ? 'Save Changes' : 'Create Hub'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NodesPage() {
  const { role } = useAuth();
  const [nodes, setNodes] = useState<MicrogridNode[]>(init);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<MicrogridNode | null>(null);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleDeactivate = (nodeId: string) => {
    const node = nodes.find(n => n.nodeId === nodeId);
    if (!node) return;

    if (node.status === 'Active') {
      const hasActive = mockReservations.some(
        r => r.nodeId === nodeId && (r.status === 'Approved' || r.status === 'Pending')
      );
      if (hasActive) {
        showToast(`Cannot deactivate hub ${node.name} — active or pending energy reservations currently exist.`, 'error');
        return;
      }
      setNodes(p => p.map(n => n.nodeId === nodeId ? { ...n, status: 'Inactive' } : n));
      showToast(`Node ${node.name} has been deactivated.`, 'success');
    } else {
      setNodes(p => p.map(n => n.nodeId === nodeId ? { ...n, status: 'Active' } : n));
      showToast(`Node ${node.name} reactivated to Active state.`, 'success');
    }
  };

  const handleDelete = (nodeId: string) => {
    const node = nodes.find(n => n.nodeId === nodeId);
    if (!node) return;

    const hasActive = mockReservations.some(
      r => r.nodeId === nodeId && (r.status === 'Approved' || r.status === 'Pending')
    );
    if (hasActive) {
      showToast(`Cannot delete hub ${node.name} — active or pending energy reservations exist for this node.`, 'error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete station ${node.name} (${node.nodeId})?`)) {
      setNodes(p => p.filter(n => n.nodeId !== nodeId));
      showToast(`Station ${node.name} deleted successfully.`, 'success');
    }
  };

  const save = (d: FormState) => {
    if (edit) {
      setNodes(p => p.map(n => n.nodeId === edit.nodeId ? {
        ...n,
        name: d.name,
        location: { lat: Number(d.lat), lng: Number(d.lng) },
        capacityKW: Number(d.capacityKW),
        capacityKWh: Number(d.capacityKWh),
        batterySlots: Number(d.batterySlots),
        operatingHours: d.operatingHours,
        status: d.status,
      } : n));
      showToast(`Node ${edit.name} updated successfully.`, 'success');
    } else {
      const newNode: MicrogridNode = {
        nodeId: `NODE-HUB-${String(nodes.length + 1).padStart(3, '0')}`,
        name: d.name,
        location: { lat: Number(d.lat), lng: Number(d.lng) },
        capacityKW: Number(d.capacityKW),
        capacityKWh: Number(d.capacityKWh),
        batterySlots: Number(d.batterySlots),
        operatingHours: d.operatingHours,
        status: 'Active',
      };
      setNodes(p => [newNode, ...p]);
      showToast(`New hub ${newNode.name} created successfully.`, 'success');
    }
    setModal(false);
  };

  const cols = [
    { key: 'nodeId', header: 'Node ID', render: (n: MicrogridNode) => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{n.nodeId}</span> },
    { key: 'name', header: 'Hub / Station', render: (n: MicrogridNode) => <span className="fw-600">{n.name}</span> },
    { key: 'location', header: 'GPS Location', render: (n: MicrogridNode) => <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: '#6b7280' }}><MapPin size={11} />{n.location.lat.toFixed(4)}, {n.location.lng.toFixed(4)}</span> },
    {
      key: 'capacityKW', header: 'Capacity Specs', render: (n: MicrogridNode) => (
        <div>
          <span className="fw-600 d-inline-flex align-items-center gap-1"><Zap size={12} className="text-amber" />{n.capacityKW} kW</span>
          {n.capacityKWh && <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>({n.capacityKWh} kWh)</span>}
        </div>
      )
    },
    {
      key: 'batterySlots', header: 'Battery Slots', render: (n: MicrogridNode) => (
        <span className="badge d-inline-flex align-items-center gap-1" style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.75rem' }}>
          <BatteryCharging size={12} /> {n.batterySlots} slots
        </span>
      )
    },
    { key: 'operatingHours', header: 'Schedule', render: (n: MicrogridNode) => <span style={{ fontSize: '0.78rem' }}>{n.operatingHours}</span> },
    { key: 'status', header: 'Status', render: (n: MicrogridNode) => <StatusPill status={n.status} /> },
    ...(role === 'Backoffice' ? [{
      key: 'actions', header: 'Actions', render: (n: MicrogridNode) => (
        <div className="d-flex gap-1 align-items-center">
          <button className="btn btn-sm btn-outline-warning" title="Edit Hub & Slots" onClick={() => { setEdit(n); setModal(true); }}>
            <Pencil size={13} />
          </button>
          <button
            className={`btn btn-sm ${n.status === 'Active' ? 'btn-outline-secondary' : 'btn-outline-success'}`}
            title={n.status === 'Active' ? 'Deactivate Hub' : 'Reactivate Hub'}
            onClick={() => handleDeactivate(n.nodeId)}
          >
            <PowerOff size={13} />
          </button>
          <button className="btn btn-sm btn-outline-danger" title="Delete Hub (Blocked if active reservations exist)" onClick={() => handleDelete(n.nodeId)}>
            <Trash2 size={13} />
          </button>
        </div>
      )
    }] : []),
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h4>Microgrid Node Management</h4>
          <p>
            {role === 'Backoffice'
              ? 'Configure solar grid hubs, capacity specifications, battery slots and operational schedules'
              : 'Monitor active microgrid hubs, GPS telemetry, battery storage slots and network capacity'}
          </p>
        </div>
        {role === 'Backoffice' && (
          <button id="create-node-btn" className="btn btn-amber d-flex align-items-center gap-2" onClick={() => { setEdit(null); setModal(true); }}>
            <Plus size={15} /> Add Solar Hub
          </button>
        )}
      </div>

      {toast && (
        <div
          className="alert d-flex align-items-center gap-2 mb-3"
          style={{
            background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${toast.type === 'error' ? '#fca5a5' : '#a7f3d0'}`,
            color: toast.type === 'error' ? '#991b1b' : '#065f46',
            fontSize: '0.82rem',
          }}
        >
          <AlertTriangle size={15} /> {toast.text}
        </div>
      )}

      <div className="ssmts-card">
        <div className="ssmts-card-header">
          Solar Grid Hubs & Storage Slots <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>{nodes.length} total</span>
        </div>
        <div className="ssmts-card-body">
          <DataTable
            data={nodes as unknown as Record<string, unknown>[]}
            columns={cols as never}
            keyExtractor={n => (n as unknown as MicrogridNode).nodeId}
            searchKeys={['nodeId', 'name', 'status', 'operatingHours'] as never[]}
          />
        </div>
      </div>

      {modal && role === 'Backoffice' && <NodeModal node={edit} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
