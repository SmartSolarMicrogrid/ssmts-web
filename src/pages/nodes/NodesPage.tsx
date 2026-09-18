import { useState } from 'react';
import { mockNodes as init, mockReservations } from '../../data/mockData';
import type { MicrogridNode, NodeStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import { Plus, Pencil, PowerOff, MapPin, AlertTriangle } from 'lucide-react';

const HOURS = ['06:00 - 18:00','06:00 - 20:00','06:00 - 22:00','07:00 - 19:00','07:00 - 20:00','08:00 - 18:00','08:00 - 20:00','24 Hours'];

type FormState = { name: string; lat: string; lng: string; capacityKW: string; batterySlots: string; operatingHours: string; status: NodeStatus };

function NodeModal({ node, onSave, onClose }: { node: MicrogridNode | null; onSave: (d: FormState) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>({
    name: node?.name ?? '', lat: String(node?.location.lat ?? ''), lng: String(node?.location.lng ?? ''),
    capacityKW: String(node?.capacityKW ?? ''), batterySlots: String(node?.batterySlots ?? ''),
    operatingHours: node?.operatingHours ?? HOURS[0], status: node?.status ?? 'Active',
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (isNaN(Number(form.lat)) || !form.lat) e.lat = 'Valid latitude required';
    if (isNaN(Number(form.lng)) || !form.lng) e.lng = 'Valid longitude required';
    if (!form.capacityKW || Number(form.capacityKW) <= 0) e.capacityKW = 'Capacity must be > 0';
    if (!form.batterySlots || Number(form.batterySlots) <= 0) e.batterySlots = 'Slots must be > 0';
    setErr(e); return !Object.keys(e).length;
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) onSave(form); };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.4)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header"><h6 className="modal-title">{node ? 'Edit Node' : 'Add Microgrid Node'}</h6><button className="btn-close" onClick={onClose} /></div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Node Name</label>
                <input id="node-name" className={`form-control ${err.name ? 'is-invalid' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} />
                {err.name && <div className="invalid-feedback">{err.name}</div>}
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Latitude</label>
                  <input id="node-lat" className={`form-control ${err.lat ? 'is-invalid' : ''}`} value={form.lat} onChange={e => set('lat', e.target.value)} placeholder="6.9271" />
                  {err.lat && <div className="invalid-feedback">{err.lat}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">Longitude</label>
                  <input id="node-lng" className={`form-control ${err.lng ? 'is-invalid' : ''}`} value={form.lng} onChange={e => set('lng', e.target.value)} placeholder="79.8612" />
                  {err.lng && <div className="invalid-feedback">{err.lng}</div>}
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Capacity (kW)</label>
                  <input id="node-capacity" type="number" className={`form-control ${err.capacityKW ? 'is-invalid' : ''}`} value={form.capacityKW} onChange={e => set('capacityKW', e.target.value)} />
                  {err.capacityKW && <div className="invalid-feedback">{err.capacityKW}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">Battery Slots</label>
                  <input id="node-slots" type="number" className={`form-control ${err.batterySlots ? 'is-invalid' : ''}`} value={form.batterySlots} onChange={e => set('batterySlots', e.target.value)} />
                  {err.batterySlots && <div className="invalid-feedback">{err.batterySlots}</div>}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Operating Hours</label>
                <select id="node-hours" className="form-select" value={form.operatingHours} onChange={e => set('operatingHours', e.target.value)}>
                  {HOURS.map(h => <option key={h}>{h}</option>)}
                </select>
              </div>
              {node && (
                <div className="mb-3">
                  <label className="form-label">Status</label>
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
              <button type="submit" className="btn btn-amber btn-sm">{node ? 'Save Changes' : 'Add Node'}</button>
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
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleDeactivate = (nodeId: string) => {
    const hasActive = mockReservations.some(r => r.nodeId === nodeId && r.status === 'Scheduled');
    if (hasActive) { showToast('Cannot deactivate — active reservations exist for this node.'); return; }
    setNodes(p => p.map(n => n.nodeId === nodeId ? { ...n, status: n.status === 'Active' ? 'Inactive' : 'Active' } : n));
  };

  const save = (d: FormState) => {
    if (edit) {
      setNodes(p => p.map(n => n.nodeId === edit.nodeId ? { ...n, name: d.name, location: { lat: Number(d.lat), lng: Number(d.lng) }, capacityKW: Number(d.capacityKW), batterySlots: Number(d.batterySlots), operatingHours: d.operatingHours, status: d.status } : n));
    } else {
      setNodes(p => [{ nodeId: `NODE-NEW-${String(p.length + 1).padStart(3,'0')}`, name: d.name, location: { lat: Number(d.lat), lng: Number(d.lng) }, capacityKW: Number(d.capacityKW), batterySlots: Number(d.batterySlots), operatingHours: d.operatingHours, status: 'Active' }, ...p]);
    }
    setModal(false);
  };

  const cols = [
    { key: 'nodeId', header: 'Node ID', render: (n: MicrogridNode) => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{n.nodeId}</span> },
    { key: 'name', header: 'Name', render: (n: MicrogridNode) => <span className="fw-600">{n.name}</span> },
    { key: 'location', header: 'Location', render: (n: MicrogridNode) => <span className="d-flex align-items-center gap-1" style={{ fontSize: '0.78rem', color: '#6b7280' }}><MapPin size={11} />{n.location.lat.toFixed(4)}, {n.location.lng.toFixed(4)}</span> },
    { key: 'capacityKW', header: 'Capacity', render: (n: MicrogridNode) => <span className="fw-600">{n.capacityKW} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#6b7280' }}>kW</span></span> },
    { key: 'batterySlots', header: 'Slots', render: (n: MicrogridNode) => <span className="badge" style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.72rem' }}>{n.batterySlots}</span> },
    { key: 'operatingHours', header: 'Hours', render: (n: MicrogridNode) => <span style={{ fontSize: '0.78rem' }}>{n.operatingHours}</span> },
    { key: 'status', header: 'Status', render: (n: MicrogridNode) => <StatusPill status={n.status} /> },
    ...(role === 'Backoffice' ? [{
      key: 'actions', header: 'Actions', render: (n: MicrogridNode) => (
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-outline-warning" onClick={() => { setEdit(n); setModal(true); }}><Pencil size={13} /></button>
          <button className={`btn btn-sm ${n.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => handleDeactivate(n.nodeId)}><PowerOff size={13} /></button>
        </div>
      )
    }] : []),
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div><h4>Microgrid Node Management</h4><p>Monitor and manage solar microgrid nodes across the network</p></div>
        {role === 'Backoffice' && (
          <button id="create-node-btn" className="btn btn-amber d-flex align-items-center gap-2" onClick={() => { setEdit(null); setModal(true); }}><Plus size={15} /> Add Node</button>
        )}
      </div>

      {toast && (
        <div className="alert d-flex align-items-center gap-2 mb-3" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.82rem' }}>
          <AlertTriangle size={15} /> {toast}
        </div>
      )}

      <div className="ssmts-card">
        <div className="ssmts-card-header">
          All Nodes <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>{nodes.length} total</span>
        </div>
        <div className="ssmts-card-body">
          <DataTable data={nodes as unknown as Record<string, unknown>[]} columns={cols as never} keyExtractor={n => (n as unknown as MicrogridNode).nodeId} searchKeys={['nodeId', 'name', 'status'] as never[]} />
        </div>
      </div>

      {modal && role === 'Backoffice' && <NodeModal node={edit} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
