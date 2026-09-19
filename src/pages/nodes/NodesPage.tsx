import { useState, useEffect } from 'react';
import type { MicrogridNode, NodeStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { nodesApi } from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import { Plus, Pencil, PowerOff, MapPin, Trash2, BatteryCharging, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
  nodeCode: string;
  name: string;
  lat: string;
  lng: string;
  capacityKW: string;
  capacityKWh: string;
  batterySlots: string;
  operatingHours: string;
  status: NodeStatus;
};

function NodeModal({
  node,
  onSave,
  onClose,
}: {
  node: MicrogridNode | null;
  onSave: (d: FormState) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    nodeCode: node?.nodeId ?? '',
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
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!node && !form.nodeCode.trim()) e.nodeCode = 'Node code required (e.g. NODE-COL-001)';
    if (!form.name.trim()) e.name = 'Node name required';
    if (isNaN(Number(form.lat)) || !form.lat) e.lat = 'Valid GPS latitude required';
    if (isNaN(Number(form.lng)) || !form.lng) e.lng = 'Valid GPS longitude required';
    if (!form.capacityKW || Number(form.capacityKW) <= 0) e.capacityKW = 'Power capacity must be > 0 kW';
    if (!form.capacityKWh || Number(form.capacityKWh) <= 0) e.capacityKWh = 'Storage capacity must be > 0 kWh';
    if (!form.batterySlots || Number(form.batterySlots) <= 0) e.batterySlots = 'Battery slots must be > 0';
    setErr(e);
    return !Object.keys(e).length;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await onSave(form);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title">{node ? 'Edit Solar Grid Hub' : 'Register New Solar Grid Hub'}</h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              {!node && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="node-code">Node Identifier Code</label>
                  <input
                    id="node-code"
                    className={`form-control ${err.nodeCode ? 'is-invalid' : ''}`}
                    value={form.nodeCode}
                    onChange={e => set('nodeCode', e.target.value)}
                    placeholder="e.g. NODE-COL-002"
                  />
                  {err.nodeCode && <div className="invalid-feedback">{err.nodeCode}</div>}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label" htmlFor="node-name">Hub Name</label>
                <input
                  id="node-name"
                  className={`form-control ${err.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
                {err.name && <div className="invalid-feedback">{err.name}</div>}
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label" htmlFor="node-lat">GPS Latitude</label>
                  <input
                    id="node-lat"
                    type="number"
                    step="any"
                    className={`form-control ${err.lat ? 'is-invalid' : ''}`}
                    value={form.lat}
                    onChange={e => set('lat', e.target.value)}
                  />
                  {err.lat && <div className="invalid-feedback">{err.lat}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label" htmlFor="node-lng">GPS Longitude</label>
                  <input
                    id="node-lng"
                    type="number"
                    step="any"
                    className={`form-control ${err.lng ? 'is-invalid' : ''}`}
                    value={form.lng}
                    onChange={e => set('lng', e.target.value)}
                  />
                  {err.lng && <div className="invalid-feedback">{err.lng}</div>}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label" htmlFor="node-cap-kw">Grid Capacity (kW)</label>
                  <input
                    id="node-cap-kw"
                    type="number"
                    className={`form-control ${err.capacityKW ? 'is-invalid' : ''}`}
                    value={form.capacityKW}
                    onChange={e => set('capacityKW', e.target.value)}
                  />
                  {err.capacityKW && <div className="invalid-feedback">{err.capacityKW}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label" htmlFor="node-cap-kwh">Battery Storage (kWh)</label>
                  <input
                    id="node-cap-kwh"
                    type="number"
                    className={`form-control ${err.capacityKWh ? 'is-invalid' : ''}`}
                    value={form.capacityKWh}
                    onChange={e => set('capacityKWh', e.target.value)}
                  />
                  {err.capacityKWh && <div className="invalid-feedback">{err.capacityKWh}</div>}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label" htmlFor="node-bays">Battery Charging Bays</label>
                  <input
                    id="node-bays"
                    type="number"
                    min={1}
                    className={`form-control ${err.batterySlots ? 'is-invalid' : ''}`}
                    value={form.batterySlots}
                    onChange={e => set('batterySlots', e.target.value)}
                  />
                  {err.batterySlots && <div className="invalid-feedback">{err.batterySlots}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label" htmlFor="node-hours">Operating Schedule</label>
                  <select
                    id="node-hours"
                    className="form-select"
                    value={form.operatingHours}
                    onChange={e => set('operatingHours', e.target.value)}
                  >
                    {HOURS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-amber btn-sm" disabled={loading}>
                {loading ? 'Saving...' : node ? 'Save Changes' : 'Create Hub'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function NodesPage() {
  const { role } = useAuth();
  const [nodes, setNodes] = useState<MicrogridNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<MicrogridNode | null>(null);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadNodes = async () => {
    setLoading(true);
    try {
      const data = await nodesApi.getAll();
      setNodes(data);
    } catch {
      showToast('Could not fetch microgrid nodes from API.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNodes();
  }, []);

  const handleDeactivate = async (nodeId: string) => {
    const node = nodes.find(n => n.nodeId === nodeId);
    if (!node) return;

    const targetId = node.id || nodeId;
    if (node.status === 'Active') {
      try {
        await nodesApi.deactivate(targetId);
        setNodes(p => p.map(n => (n.nodeId === nodeId ? { ...n, status: 'Inactive' as const } : n)));
        showToast(`Node ${node.name} has been deactivated.`, 'success');
      } catch (err: unknown) {
        // Backend BR-06 rule returns 409 Conflict if active reservations exist
        const msg = err instanceof Error ? err.message : 'Deactivation failed';
        showToast(`Cannot deactivate hub ${node.name}: ${msg}`, 'error');
      }
    } else {
      try {
        await nodesApi.activate(targetId);
        setNodes(p => p.map(n => (n.nodeId === nodeId ? { ...n, status: 'Active' as const } : n)));
        showToast(`Node ${node.name} reactivated to Active state.`, 'success');
      } catch {
        showToast(`Failed to reactivate hub ${node.name}.`, 'error');
      }
    }
  };

  const handleDelete = async (nodeId: string) => {
    const node = nodes.find(n => n.nodeId === nodeId);
    if (!node) return;

    if (window.confirm(`Are you sure you want to delete station ${node.name} (${node.nodeId})?`)) {
      try {
        await nodesApi.deactivate(node.id || nodeId);
        setNodes(p => p.filter(n => n.nodeId !== nodeId));
        showToast(`Station ${node.name} deleted successfully.`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Cannot delete hub';
        showToast(msg, 'error');
      }
    }
  };

  const save = async (d: FormState) => {
    try {
      if (edit) {
        await nodesApi.update(edit.id || edit.nodeId, {
          name: d.name,
          latitude: Number(d.lat),
          longitude: Number(d.lng),
          capacityBays: Number(d.batterySlots),
        });
        setNodes(p =>
          p.map(n =>
            n.nodeId === edit.nodeId
              ? {
                  ...n,
                  name: d.name,
                  location: { lat: Number(d.lat), lng: Number(d.lng) },
                  capacityKW: Number(d.capacityKW),
                  capacityKWh: Number(d.capacityKWh),
                  batterySlots: Number(d.batterySlots),
                  operatingHours: d.operatingHours,
                  status: d.status,
                }
              : n
          )
        );
        showToast(`Node ${edit.name} updated successfully.`, 'success');
      } else {
        const parts = d.operatingHours.split('-');
        const openTime = parts[0]?.trim() || '06:00';
        const closeTime = parts[1]?.trim() || '20:00';

        const created = await nodesApi.create({
          nodeCode: d.nodeCode,
          name: d.name,
          latitude: Number(d.lat),
          longitude: Number(d.lng),
          capacityBays: Number(d.batterySlots),
          openTime,
          closeTime,
          maxKwhPerReservation: 50,
        });
        setNodes(p => [created, ...p]);
        showToast(`New hub ${created.name} created successfully.`, 'success');
      }
      setModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving hub';
      showToast(msg, 'error');
    }
  };

  const cols = [
    {
      key: 'nodeId',
      header: 'Node ID',
      render: (n: MicrogridNode) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{n.nodeId}</span>
      ),
    },
    { key: 'name', header: 'Hub / Station', render: (n: MicrogridNode) => <span className="fw-600">{n.name}</span> },
    {
      key: 'location',
      header: 'GPS Location',
      render: (n: MicrogridNode) => (
        <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: '#6b7280' }}>
          <MapPin size={11} />
          {n.location.lat.toFixed(4)}, {n.location.lng.toFixed(4)}
        </span>
      ),
    },
    {
      key: 'capacityKW',
      header: 'Capacity Specs',
      render: (n: MicrogridNode) => (
        <div>
          <span className="fw-600 d-inline-flex align-items-center gap-1">
            <Zap size={12} className="text-amber" />
            {n.capacityKW} kW
          </span>
          {n.capacityKWh && (
            <span className="text-muted ms-1" style={{ fontSize: '0.75rem' }}>
              ({n.capacityKWh} kWh)
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'batterySlots',
      header: 'Slots / Bays',
      render: (n: MicrogridNode) => (
        <span className="d-inline-flex align-items-center gap-1 text-secondary" style={{ fontSize: '0.8rem' }}>
          <BatteryCharging size={12} />
          {n.batterySlots} bays
        </span>
      ),
    },
    {
      key: 'operatingHours',
      header: 'Operating Hours',
      render: (n: MicrogridNode) => <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{n.operatingHours}</span>,
    },
    { key: 'status', header: 'Status', render: (n: MicrogridNode) => <StatusPill status={n.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (n: MicrogridNode) => (
        <div className="d-flex gap-1 align-items-center">
          {role === 'Backoffice' && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                title="Edit Hub Details"
                onClick={() => {
                  setEdit(n);
                  setModal(true);
                }}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className={`btn btn-sm ${n.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
                title={n.status === 'Active' ? 'Deactivate Node (Checks active bookings)' : 'Reactivate Node'}
                onClick={() => handleDeactivate(n.nodeId)}
              >
                <PowerOff size={13} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                title="Delete Node"
                onClick={() => handleDelete(n.nodeId)}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h4>Microgrid Node Management</h4>
          <p>Configure solar power generation hubs, battery storage capacity, and dispatch schedules</p>
        </div>
        {role === 'Backoffice' && (
          <button
            id="create-node-btn"
            type="button"
            className="btn btn-amber d-flex align-items-center gap-2"
            onClick={() => {
              setEdit(null);
              setModal(true);
            }}
          >
            <Plus size={15} /> Create Hub
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
          {toast.type === 'error' ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
          {toast.text}
        </div>
      )}

      <div className="ssmts-card">
        <div className="ssmts-card-header d-flex justify-content-between align-items-center">
          <span>Solar Microgrid Stations</span>
          <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>
            {nodes.length} stations
          </span>
        </div>
        <div className="ssmts-card-body">
          {loading ? (
            <div className="text-center py-4 text-muted">Loading microgrid stations...</div>
          ) : (
            <DataTable
              data={nodes}
              columns={cols}
              keyExtractor={n => n.nodeId}
              searchKeys={['nodeId', 'name', 'operatingHours', 'status']}
            />
          )}
        </div>
      </div>

      {modal && <NodeModal node={edit} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
