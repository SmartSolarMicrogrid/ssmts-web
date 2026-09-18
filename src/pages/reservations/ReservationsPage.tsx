import { useState, useMemo } from 'react';
import { mockReservations as init, mockNodes, mockProsumers } from '../../data/mockData';
import type { Reservation, ReservationType, ReservationStatus } from '../../types';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import TypePill from '../../components/ui/TypePill';
import { Plus, Pencil, Trash2, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

// Max date = today + 7 days
function maxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

type FormState = {
  prosumerNic: string;
  nodeId: string;
  bayNumber: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  type: ReservationType;
  status: ReservationStatus;
};

function ReservationModal({ reservation, onSave, onClose }: { reservation: Reservation | null; onSave: (d: FormState) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>({
    prosumerNic: reservation?.prosumerNic ?? '',
    nodeId: reservation?.nodeId ?? (mockNodes.find(n => n.status === 'Active')?.nodeId ?? ''),
    bayNumber: String(reservation?.bayNumber ?? 1),
    slotDate: reservation?.slotDate ?? todayStr(),
    startTime: reservation?.startTime ?? '09:00',
    endTime: reservation?.endTime ?? '11:00',
    type: reservation?.type ?? 'Export',
    status: reservation?.status ?? 'Pending',
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.prosumerNic.trim()) e.prosumerNic = 'Prosumer required';
    if (!form.nodeId) e.nodeId = 'Microgrid node required';
    if (!form.slotDate) e.slotDate = 'Slot date required';
    else if (form.slotDate < todayStr()) e.slotDate = 'Date cannot be in the past';
    else if (form.slotDate > maxDate()) e.slotDate = 'Date must be scheduled within 7 days from today';
    if (!form.startTime) e.startTime = 'Start time required';
    if (!form.endTime) e.endTime = 'End time required';
    else if (form.endTime <= form.startTime) e.endTime = 'End time must be later than start time';
    if (!form.bayNumber || Number(form.bayNumber) < 1) e.bayNumber = 'Valid bay/slot number required';
    setErr(e);
    return !Object.keys(e).length;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const activeNodes = mockNodes.filter(n => n.status === 'Active');
  const activeProsumers = mockProsumers.filter(p => p.status === 'Active');

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.4)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title">{reservation ? 'Update Reservation' : 'Create Power Trading Reservation'}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Prosumer (NIC)</label>
                <select id="res-nic" className={`form-select ${err.prosumerNic ? 'is-invalid' : ''}`} value={form.prosumerNic} onChange={e => set('prosumerNic', e.target.value)}>
                  <option value="">— Select Active Prosumer —</option>
                  {activeProsumers.map(p => (
                    <option key={p.nic} value={p.nic}>{p.name} (NIC: {p.nic})</option>
                  ))}
                </select>
                {err.prosumerNic && <div className="invalid-feedback">{err.prosumerNic}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Target Solar Grid Hub</label>
                <select id="res-node" className={`form-select ${err.nodeId ? 'is-invalid' : ''}`} value={form.nodeId} onChange={e => set('nodeId', e.target.value)}>
                  <option value="">— Select Active Hub —</option>
                  {activeNodes.map(n => (
                    <option key={n.nodeId} value={n.nodeId}>{n.name} ({n.capacityKW} kW · {n.batterySlots} slots)</option>
                  ))}
                </select>
                {err.nodeId && <div className="invalid-feedback">{err.nodeId}</div>}
              </div>

              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label">Bay / Slot Number</label>
                  <input id="res-bay" type="number" min={1} className={`form-control ${err.bayNumber ? 'is-invalid' : ''}`} value={form.bayNumber} onChange={e => set('bayNumber', e.target.value)} />
                  {err.bayNumber && <div className="invalid-feedback">{err.bayNumber}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">Trading Flow Type</label>
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
                <label className="form-label">
                  Slot Date <span className="text-muted" style={{ fontSize: '0.75rem' }}>(7-Day Notice Rule: max {maxDate()})</span>
                </label>
                <input
                  id="res-date"
                  type="date"
                  className={`form-control ${err.slotDate ? 'is-invalid' : ''}`}
                  value={form.slotDate}
                  min={todayStr()}
                  max={maxDate()}
                  onChange={e => set('slotDate', e.target.value)}
                />
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

              {reservation && (
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select id="res-status" className="form-select" value={form.status} onChange={e => set('status', e.target.value as ReservationStatus)}>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-amber btn-sm">{reservation ? 'Save Changes' : 'Submit Reservation'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>(init);
  const [tab, setTab] = useState<'All' | 'Pending' | 'Approved' | 'History'>('All');
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Reservation | null>(null);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Helper: check 12-hour rule
  const check12HourRule = (slotDate: string, startTime: string): { ok: boolean; hoursRemaining: number } => {
    const slotDateTime = new Date(`${slotDate}T${startTime}`);
    const now = new Date();
    const diffMs = slotDateTime.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);
    return { ok: hoursRemaining >= 12, hoursRemaining };
  };

  const handleEditClick = (r: Reservation) => {
    // 12-hour rule check on UPDATE
    const { ok, hoursRemaining } = check12HourRule(r.slotDate, r.startTime);
    if (!ok && (r.status === 'Approved' || r.status === 'Pending')) {
      showToast(
        `Updates require at least 12 hours' notice before the scheduled slot (${hoursRemaining > 0 ? `${hoursRemaining.toFixed(1)} hrs remaining` : 'slot in past'}). Changes are locked.`,
        'error'
      );
      return;
    }
    setEdit(r);
    setModal(true);
  };

  const handleCancelClick = (id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    // 12-hour rule check on CANCEL
    const { ok, hoursRemaining } = check12HourRule(res.slotDate, res.startTime);
    if (!ok) {
      showToast(
        `Cancellations require at least 12 hours' notice before the scheduled slot (${hoursRemaining > 0 ? `${hoursRemaining.toFixed(1)} hrs remaining` : 'slot in past'}). Cancellation rejected.`,
        'error'
      );
      return;
    }

    if (window.confirm(`Are you sure you want to cancel reservation ${res.id}?`)) {
      setReservations(p => p.map(r => r.id === id ? { ...r, status: 'Cancelled' } : r));
      showToast(`Reservation ${res.id} has been cancelled.`, 'success');
    }
  };

  const handleApprove = (id: string) => {
    setReservations(p => p.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    showToast(`Reservation ${id} approved and locked in schedule.`, 'success');
  };

  const save = (d: FormState) => {
    const prosumer = mockProsumers.find(p => p.nic === d.prosumerNic);
    const node = mockNodes.find(n => n.nodeId === d.nodeId);

    if (edit) {
      setReservations(p => p.map(r => r.id === edit.id ? {
        ...r,
        prosumerNic: d.prosumerNic,
        prosumerName: prosumer?.name ?? '',
        nodeId: d.nodeId,
        nodeName: node?.name ?? '',
        bayNumber: Number(d.bayNumber),
        slotDate: d.slotDate,
        startTime: d.startTime,
        endTime: d.endTime,
        type: d.type,
        status: d.status,
      } : r));
      showToast(`Reservation ${edit.id} updated successfully.`, 'success');
    } else {
      const newRes: Reservation = {
        id: `RES-${new Date().getFullYear()}-${String(reservations.length + 1).padStart(3, '0')}`,
        prosumerNic: d.prosumerNic,
        prosumerName: prosumer?.name ?? '',
        nodeId: d.nodeId,
        nodeName: node?.name ?? '',
        bayNumber: Number(d.bayNumber),
        slotDate: d.slotDate,
        startTime: d.startTime,
        endTime: d.endTime,
        type: d.type,
        status: d.status ?? 'Pending',
      };
      setReservations(p => [newRes, ...p]);
      showToast(`Reservation ${newRes.id} created successfully (${newRes.status}).`, 'success');
    }
    setModal(false);
  };

  const filteredReservations = useMemo(() => {
    if (tab === 'Pending') return reservations.filter(r => r.status === 'Pending');
    if (tab === 'Approved') return reservations.filter(r => r.status === 'Approved');
    if (tab === 'History') return reservations.filter(r => r.status === 'Completed' || r.status === 'Cancelled');
    return reservations;
  }, [reservations, tab]);

  const pendingCount = reservations.filter(r => r.status === 'Pending').length;
  const approvedFutureCount = reservations.filter(r => r.status === 'Approved' && r.slotDate >= todayStr()).length;

  const cols = [
    { key: 'id', header: 'Reservation ID', render: (r: Reservation) => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600 }}>{r.id}</span> },
    {
      key: 'prosumerNic', header: 'Prosumer', render: (r: Reservation) => (
        <div>
          <div className="fw-600" style={{ fontSize: '0.82rem' }}>{r.prosumerName}</div>
          <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>{r.prosumerNic}</div>
        </div>
      )
    },
    { key: 'nodeId', header: 'Hub / Station', render: (r: Reservation) => <span style={{ fontSize: '0.82rem' }}>{r.nodeName}</span> },
    { key: 'bayNumber', header: 'Bay', render: (r: Reservation) => <span className="badge" style={{ background: '#f3f4f6', color: '#374151', fontWeight: 700 }}>#{r.bayNumber}</span> },
    { key: 'slotDate', header: 'Date', render: (r: Reservation) => <span style={{ fontSize: '0.82rem' }}>{r.slotDate}</span> },
    { key: 'startTime', header: 'Time Window', render: (r: Reservation) => <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>{r.startTime} – {r.endTime}</span> },
    { key: 'type', header: 'Flow', render: (r: Reservation) => <TypePill type={r.type} /> },
    { key: 'status', header: 'Status', render: (r: Reservation) => <StatusPill status={r.status} /> },
    {
      key: 'actions', header: 'Actions', render: (r: Reservation) => (
        <div className="d-flex gap-1 align-items-center">
          {r.status === 'Pending' && (
            <button className="btn btn-sm btn-success d-flex align-items-center gap-1" title="Approve Reservation" onClick={() => handleApprove(r.id)} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
              <CheckCircle2 size={13} /> Approve
            </button>
          )}
          {(r.status === 'Pending' || r.status === 'Approved') && (
            <>
              <button className="btn btn-sm btn-outline-warning" title="Update Slot (Requires >= 12h notice)" onClick={() => handleEditClick(r)}>
                <Pencil size={13} />
              </button>
              <button className="btn btn-sm btn-outline-danger" title="Cancel Slot (Requires >= 12h notice)" onClick={() => handleCancelClick(r.id)}>
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h4>Energy Slot Reservation Management</h4>
          <p>Schedule, manage and review solar power export/import slot reservations</p>
        </div>
        <button id="create-reservation-btn" className="btn btn-amber d-flex align-items-center gap-2" onClick={() => { setEdit(null); setModal(true); }}>
          <Plus size={15} /> New Reservation
        </button>
      </div>

      {/* Rules Notice */}
      <div className="alert d-flex align-items-start gap-2 mb-3" style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.82rem' }}>
        <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
        <div>
          <strong>Operational Rules Enforced:</strong>
          <ul className="mb-0 mt-1 ps-3">
            <li><strong>7-Day Window:</strong> Reservations must be scheduled within 7 days from today.</li>
            <li><strong>12-Hour Notice Rule:</strong> Both updates and cancellations require at least 12 hours' notice before the scheduled slot time.</li>
          </ul>
        </div>
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

      {/* Filter Tabs & KPIs */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <div className="d-flex gap-2">
          {(['All', 'Pending', 'Approved', 'History'] as const).map(t => {
            const count =
              t === 'All' ? reservations.length
              : t === 'Pending' ? pendingCount
              : t === 'Approved' ? approvedFutureCount
              : reservations.filter(r => r.status === 'Completed' || r.status === 'Cancelled').length;
            const isSelected = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`btn btn-sm ${isSelected ? 'btn-amber' : 'btn-outline-secondary'}`}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                {t} <span className={`badge ms-1 ${isSelected ? 'bg-light text-dark' : 'bg-secondary'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="d-flex gap-2">
          <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>
            Pending Review: {pendingCount}
          </span>
          <span className="badge" style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}>
            Approved Future Slots: {approvedFutureCount}
          </span>
        </div>
      </div>

      <div className="ssmts-card">
        <div className="ssmts-card-header">
          Reservations & Bookings <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>{filteredReservations.length} shown</span>
        </div>
        <div className="ssmts-card-body">
          <DataTable
            data={filteredReservations as unknown as Record<string, unknown>[]}
            columns={cols as never}
            keyExtractor={r => (r as unknown as Reservation).id}
            searchKeys={['id', 'prosumerNic', 'prosumerName', 'nodeName', 'type', 'status'] as never[]}
          />
        </div>
      </div>

      {modal && <ReservationModal reservation={edit} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
