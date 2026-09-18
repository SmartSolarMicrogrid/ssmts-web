import { useState } from 'react';
import { mockReservations as init, mockNodes, mockProsumers } from '../../data/mockData';
import type { Reservation, ReservationType } from '../../types';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import TypePill from '../../components/ui/TypePill';
import { Plus, Pencil, Trash2, Info, AlertTriangle } from 'lucide-react';

// Max date = today + 7 days
function maxDate() {
  const d = new Date(); d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}
function todayStr() { return new Date().toISOString().split('T')[0]; }

type FormState = { prosumerNic: string; nodeId: string; bayNumber: string; slotDate: string; startTime: string; endTime: string; type: ReservationType };

function ReservationModal({ reservation, onSave, onClose }: { reservation: Reservation | null; onSave: (d: FormState) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>({
    prosumerNic: reservation?.prosumerNic ?? '',
    nodeId:      reservation?.nodeId ?? (mockNodes[0]?.nodeId ?? ''),
    bayNumber:   String(reservation?.bayNumber ?? 1),
    slotDate:    reservation?.slotDate ?? '',
    startTime:   reservation?.startTime ?? '',
    endTime:     reservation?.endTime ?? '',
    type:        reservation?.type ?? 'Export',
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.prosumerNic.trim()) e.prosumerNic = 'NIC required';
    if (!form.nodeId) e.nodeId = 'Node required';
    if (!form.slotDate) e.slotDate = 'Date required';
    else if (form.slotDate < todayStr()) e.slotDate = 'Date cannot be in the past';
    else if (form.slotDate > maxDate()) e.slotDate = 'Date must be within 7 days';
    if (!form.startTime) e.startTime = 'Start time required';
    if (!form.endTime) e.endTime = 'End time required';
    else if (form.endTime <= form.startTime) e.endTime = 'End time must be after start time';
    if (!form.bayNumber || Number(form.bayNumber) < 1) e.bayNumber = 'Bay number required';
    setErr(e); return !Object.keys(e).length;
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) onSave(form); };

  const activeNodes = mockNodes.filter(n => n.status === 'Active');

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.4)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header"><h6 className="modal-title">{reservation ? 'Edit Reservation' : 'New Reservation'}</h6><button className="btn-close" onClick={onClose} /></div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Prosumer NIC</label>
                <select id="res-nic" className={`form-select ${err.prosumerNic ? 'is-invalid' : ''}`} value={form.prosumerNic} onChange={e => set('prosumerNic', e.target.value)}>
                  <option value="">— Select Prosumer —</option>
                  {mockProsumers.filter(p => p.status === 'Active').map(p => (
                    <option key={p.nic} value={p.nic}>{p.name} ({p.nic})</option>
                  ))}
                </select>
                {err.prosumerNic && <div className="invalid-feedback">{err.prosumerNic}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Microgrid Node</label>
                <select id="res-node" className={`form-select ${err.nodeId ? 'is-invalid' : ''}`} value={form.nodeId} onChange={e => set('nodeId', e.target.value)}>
                  <option value="">— Select Node —</option>
                  {activeNodes.map(n => <option key={n.nodeId} value={n.nodeId}>{n.name}</option>)}
                </select>
                {err.nodeId && <div className="invalid-feedback">{err.nodeId}</div>}
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Bay Number</label>
                  <input id="res-bay" type="number" min={1} className={`form-control ${err.bayNumber ? 'is-invalid' : ''}`} value={form.bayNumber} onChange={e => set('bayNumber', e.target.value)} />
                  {err.bayNumber && <div className="invalid-feedback">{err.bayNumber}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">Type</label>
                  <div className="d-flex gap-3 mt-2">
                    {(['Export', 'Import'] as ReservationType[]).map(t => (
                      <div key={t} className="form-check">
                        <input className="form-check-input" type="radio" id={`res-type-${t}`} checked={form.type === t} onChange={() => set('type', t)} />
                        <label className="form-check-label" htmlFor={`res-type-${t}`} style={{ fontSize: '0.85rem' }}>{t}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Slot Date <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>(max: today + 7 days)</span></label>
                <input id="res-date" type="date" className={`form-control ${err.slotDate ? 'is-invalid' : ''}`} value={form.slotDate} min={todayStr()} max={maxDate()} onChange={e => set('slotDate', e.target.value)} />
                {err.slotDate && <div className="invalid-feedback">{err.slotDate}</div>}
              </div>
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Start Time</label>
                  <input id="res-start" type="time" className={`form-control ${err.startTime ? 'is-invalid' : ''}`} value={form.startTime} onChange={e => set('startTime', e.target.value)} />
                  {err.startTime && <div className="invalid-feedback">{err.startTime}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">End Time</label>
                  <input id="res-end" type="time" className={`form-control ${err.endTime ? 'is-invalid' : ''}`} value={form.endTime} onChange={e => set('endTime', e.target.value)} />
                  {err.endTime && <div className="invalid-feedback">{err.endTime}</div>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-amber btn-sm">{reservation ? 'Save Changes' : 'Create Reservation'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>(init);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Reservation | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleCancel = (id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;
    const hoursLeft = (new Date(`${res.slotDate}T${res.startTime}`).getTime() - Date.now()) / 36e5;
    if (hoursLeft < 12) { showToast('Cancellation requires at least 12 hours notice before the scheduled slot.'); return; }
    setReservations(p => p.map(r => r.id === id ? { ...r, status: 'Cancelled' } : r));
  };

  const save = (d: FormState) => {
    const prosumer = mockProsumers.find(p => p.nic === d.prosumerNic);
    const node     = mockNodes.find(n => n.nodeId === d.nodeId);
    if (edit) {
      setReservations(p => p.map(r => r.id === edit.id ? { ...r, prosumerNic: d.prosumerNic, prosumerName: prosumer?.name ?? '', nodeId: d.nodeId, nodeName: node?.name ?? '', bayNumber: Number(d.bayNumber), slotDate: d.slotDate, startTime: d.startTime, endTime: d.endTime, type: d.type } : r));
    } else {
      setReservations(p => [{ id: `RES-NEW-${String(p.length + 1).padStart(3,'0')}`, prosumerNic: d.prosumerNic, prosumerName: prosumer?.name ?? '', nodeId: d.nodeId, nodeName: node?.name ?? '', bayNumber: Number(d.bayNumber), slotDate: d.slotDate, startTime: d.startTime, endTime: d.endTime, type: d.type, status: 'Scheduled' }, ...p]);
    }
    setModal(false);
  };

  const cols = [
    { key: 'id', header: 'ID', render: (r: Reservation) => <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.id}</span> },
    { key: 'prosumerNic', header: 'Prosumer', render: (r: Reservation) => <div><div className="fw-600" style={{ fontSize: '0.82rem' }}>{r.prosumerName}</div><div style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>{r.prosumerNic}</div></div> },
    { key: 'nodeId', header: 'Node', render: (r: Reservation) => <span style={{ fontSize: '0.82rem' }}>{r.nodeName}</span> },
    { key: 'bayNumber', header: 'Bay', render: (r: Reservation) => <span className="badge" style={{ background: '#f3f4f6', color: '#374151', fontWeight: 700 }}>#{r.bayNumber}</span> },
    { key: 'slotDate', header: 'Date', render: (r: Reservation) => <span style={{ fontSize: '0.82rem' }}>{r.slotDate}</span> },
    { key: 'startTime', header: 'Time', render: (r: Reservation) => <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{r.startTime}–{r.endTime}</span> },
    { key: 'type', header: 'Type', render: (r: Reservation) => <TypePill type={r.type} /> },
    { key: 'status', header: 'Status', render: (r: Reservation) => <StatusPill status={r.status} /> },
    {
      key: 'actions', header: 'Actions', render: (r: Reservation) => r.status === 'Scheduled' ? (
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-outline-warning" onClick={() => { setEdit(r); setModal(true); }}><Pencil size={13} /></button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(r.id)}><Trash2 size={13} /></button>
        </div>
      ) : null
    },
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div><h4>Energy Slot Reservation Management</h4><p>Schedule and manage solar energy export/import reservations</p></div>
        <button id="create-reservation-btn" className="btn btn-amber d-flex align-items-center gap-2" onClick={() => { setEdit(null); setModal(true); }}><Plus size={15} /> New Reservation</button>
      </div>

      <div className="alert d-flex align-items-start gap-2 mb-3" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.82rem' }}>
        <Info size={15} style={{ marginTop: 2, flexShrink: 0 }} />
        <div><strong>Scheduling Rules:</strong>
          <ul className="mb-0 mt-1 ps-3">
            <li>Reservations must be scheduled <strong>within 7 days</strong> from today</li>
            <li>Updates or cancellations require at least <strong>12 hours notice</strong></li>
          </ul>
        </div>
      </div>

      {toast && (
        <div className="alert d-flex align-items-center gap-2 mb-3" style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.82rem' }}>
          <AlertTriangle size={15} /> {toast}
        </div>
      )}

      <div className="d-flex gap-2 mb-3">
        {(['Scheduled','Completed','Cancelled'] as const).map(s => (
          <span key={s} className={`status-pill status-${s.toLowerCase()}`} style={{ fontSize: '0.72rem', padding: '0.3rem 0.8rem' }}>
            {s}: {reservations.filter(r => r.status === s).length}
          </span>
        ))}
      </div>

      <div className="ssmts-card">
        <div className="ssmts-card-header">All Reservations <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>{reservations.length} total</span></div>
        <div className="ssmts-card-body">
          <DataTable data={reservations as unknown as Record<string, unknown>[]} columns={cols as never} keyExtractor={r => (r as unknown as Reservation).id} searchKeys={['id','prosumerNic','prosumerName','nodeName','status'] as never[]} />
        </div>
      </div>

      {modal && <ReservationModal reservation={edit} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
