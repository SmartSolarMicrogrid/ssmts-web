import { useState, useMemo, useEffect, type FormEvent } from 'react';
import type { Reservation, ReservationType, ReservationStatus, MicrogridNode, Prosumer, SlotResponseDto } from '../../types';
import { reservationsApi, nodesApi, prosumersApi } from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import TypePill from '../../components/ui/TypePill';
import { Plus, Pencil, Trash2, Info, CheckCircle2, ShieldAlert, XCircle, Clock } from 'lucide-react';

// Max date = today + 7 days
function maxDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface FormState {
  prosumerNic: string;
  nodeId: string;
  slotId: string;
  requestedKwh: string;
  bayNumber: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  type: ReservationType;
  status: ReservationStatus;
}

interface ReservationModalProps {
  reservation: Reservation | null;
  nodes: MicrogridNode[];
  prosumers: Prosumer[];
  onSave: (data: FormState) => Promise<void>;
  onClose: () => void;
}

function ReservationModal({ reservation, nodes, prosumers, onSave, onClose }: ReservationModalProps) {
  const activeNodes = nodes.filter(n => n.status === 'Active');
  const activeProsumers = prosumers.filter(p => p.status === 'Active');
  const defaultNodeId = activeNodes[0]?.nodeId ?? '';

  const [form, setForm] = useState<FormState>({
    prosumerNic: reservation?.prosumerNic ?? (activeProsumers[0]?.nic ?? ''),
    nodeId: reservation?.nodeId ?? defaultNodeId,
    slotId: reservation?.slotId ?? '',
    requestedKwh: String(reservation?.requestedKwh ?? 20),
    bayNumber: String(reservation?.bayNumber ?? 1),
    slotDate: reservation?.slotDate ?? todayStr(),
    startTime: reservation?.startTime ?? '06:00',
    endTime: reservation?.endTime ?? '07:00',
    type: reservation?.type ?? 'Export',
    status: reservation?.status ?? 'Pending',
  });

  const [slots, setSlots] = useState<SlotResponseDto[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const setField = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!form.nodeId || !form.slotDate) return;
    let isMounted = true;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const nodeObj = nodes.find(n => n.nodeId === form.nodeId);
        const targetId = nodeObj?.id || form.nodeId;
        let data = await nodesApi.getSlots(targetId, form.slotDate);
        if ((!data || data.length === 0) && isMounted) {
          // Auto generate slots for this date if none exists
          await nodesApi.generateSlots(targetId, form.slotDate, form.slotDate).catch(() => {});
          data = await nodesApi.getSlots(targetId, form.slotDate);
        }
        if (!isMounted) return;
        setSlots(data || []);

        if (data && data.length > 0) {
          const nowMs = Date.now();
          const matched = data.find(s => s.id === form.slotId && new Date(s.startUtc).getTime() > nowMs);
          if (!matched) {
            const firstOpen = data.find(s => s.status === 'Available' && (s.capacity - s.bookedCount) > 0 && new Date(s.startUtc).getTime() > nowMs);
            if (firstOpen) {
              setField('slotId', firstOpen.id);
              const sT = new Date(firstOpen.startUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              const eT = new Date(firstOpen.endUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
              setField('startTime', sT);
              setField('endTime', eT);
            } else {
              setField('slotId', '');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching slots for node', err);
      } finally {
        if (isMounted) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => { isMounted = false; };
  }, [form.nodeId, form.slotDate, nodes]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.prosumerNic.trim()) errs.prosumerNic = 'Prosumer selection is required';
    if (!form.nodeId) errs.nodeId = 'Microgrid node selection is required';
    if (!form.slotDate) {
      errs.slotDate = 'Slot date is required';
    } else if (form.slotDate < todayStr()) {
      errs.slotDate = 'Date cannot be in the past';
    } else if (form.slotDate > maxDate()) {
      errs.slotDate = 'Date must be scheduled within 7 days from today';
    }

    if (!form.slotId && !reservation) {
      errs.slotId = 'Please select an available booking slot';
    }

    if (!form.requestedKwh || Number(form.requestedKwh) < 5) {
      errs.requestedKwh = 'Requested energy must be at least 5 kWh';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
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
            <h6 className="modal-title">
              {reservation ? 'Update Reservation' : 'Create Power Trading Reservation'}
            </h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label" htmlFor="res-nic">Prosumer (NIC)</label>
                <select
                  id="res-nic"
                  className={`form-select ${errors.prosumerNic ? 'is-invalid' : ''}`}
                  value={form.prosumerNic}
                  onChange={e => setField('prosumerNic', e.target.value)}
                >
                  <option value="">— Select Active Prosumer —</option>
                  {activeProsumers.map(p => (
                    <option key={p.nic} value={p.nic}>
                      {p.name} (NIC: {p.nic})
                    </option>
                  ))}
                </select>
                {errors.prosumerNic && <div className="invalid-feedback">{errors.prosumerNic}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="res-node">Target Solar Grid Hub</label>
                <select
                  id="res-node"
                  className={`form-select ${errors.nodeId ? 'is-invalid' : ''}`}
                  value={form.nodeId}
                  onChange={e => setField('nodeId', e.target.value)}
                >
                  <option value="">— Select Active Hub —</option>
                  {activeNodes.map(n => (
                    <option key={n.nodeId} value={n.nodeId}>
                      {n.name} ({n.capacityKW} kW · {n.batterySlots} slots)
                    </option>
                  ))}
                </select>
                {errors.nodeId && <div className="invalid-feedback">{errors.nodeId}</div>}
              </div>

              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label" htmlFor="res-bay">Bay / Slot Number</label>
                  <input
                    id="res-bay"
                    type="number"
                    min={1}
                    className={`form-control ${errors.bayNumber ? 'is-invalid' : ''}`}
                    value={form.bayNumber}
                    onChange={e => setField('bayNumber', e.target.value)}
                  />
                  {errors.bayNumber && <div className="invalid-feedback">{errors.bayNumber}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label">Trading Flow Type</label>
                  <div className="d-flex gap-3 mt-2">
                    {(['Export', 'Import'] as ReservationType[]).map(flowType => (
                      <div key={flowType} className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          id={`res-type-${flowType}`}
                          checked={form.type === flowType}
                          onChange={() => setField('type', flowType)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`res-type-${flowType}`}
                          style={{ fontSize: '0.85rem' }}
                        >
                          {flowType}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="res-date">
                  Slot Date <span className="text-muted" style={{ fontSize: '0.75rem' }}>(7-Day Notice Rule: max {maxDate()})</span>
                </label>
                <input
                  id="res-date"
                  type="date"
                  className={`form-control ${errors.slotDate ? 'is-invalid' : ''}`}
                  value={form.slotDate}
                  min={todayStr()}
                  max={maxDate()}
                  onChange={e => setField('slotDate', e.target.value)}
                />
                {errors.slotDate && <div className="invalid-feedback">{errors.slotDate}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="res-slot">
                  Available Booking Slot {loadingSlots && <span className="text-muted" style={{ fontSize: '0.75rem' }}>(Loading slots...)</span>}
                </label>
                <div className="input-group">
                  <span className="input-group-text"><Clock size={16} /></span>
                  <select
                    id="res-slot"
                    className={`form-select ${errors.slotId ? 'is-invalid' : ''}`}
                    value={form.slotId}
                    disabled={loadingSlots || slots.length === 0}
                    onChange={e => {
                      const selectedId = e.target.value;
                      setField('slotId', selectedId);
                      const chosen = slots.find(s => s.id === selectedId);
                      if (chosen) {
                        const sT = new Date(chosen.startUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        const eT = new Date(chosen.endUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                        setField('startTime', sT);
                        setField('endTime', eT);
                      }
                    }}
                  >
                    {loadingSlots ? (
                      <option value="">Generating & loading available slots...</option>
                    ) : slots.length === 0 ? (
                      <option value="">No slots configured for this date</option>
                    ) : (
                      <>
                        <option value="">— Select Slot Window —</option>
                        {slots.map(s => {
                          const sT = new Date(s.startUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                          const eT = new Date(s.endUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                          const remaining = s.capacity - s.bookedCount;
                          const isPast = new Date(s.startUtc).getTime() <= Date.now();
                          const isAvail = !isPast && s.status === 'Available' && remaining > 0;
                          return (
                            <option key={s.id} value={s.id} disabled={!isAvail && s.id !== form.slotId}>
                              {sT} – {eT} {isPast ? '(Slot Expired / Passed)' : `(${s.status} · ${remaining} of ${s.capacity} bays open)`}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                </div>
                {slots.length > 0 && slots.every(s => new Date(s.startUtc).getTime() <= Date.now()) && (
                  <div className="text-warning mt-1" style={{ fontSize: '0.78rem' }}>
                    ⚠️ All slots for today have already passed. Please choose tomorrow or another day within 7 days.
                  </div>
                )}
                {errors.slotId && <div className="invalid-feedback d-block">{errors.slotId}</div>}
              </div>

              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label" htmlFor="res-kwh">Requested Energy (kWh)</label>
                  <input
                    id="res-kwh"
                    type="number"
                    min={5}
                    max={100}
                    step={1}
                    className={`form-control ${errors.requestedKwh ? 'is-invalid' : ''}`}
                    value={form.requestedKwh}
                    onChange={e => setField('requestedKwh', e.target.value)}
                  />
                  {errors.requestedKwh && <div className="invalid-feedback">{errors.requestedKwh}</div>}
                </div>
                <div className="col-6">
                  <label className="form-label" htmlFor="res-slot-time">Slot Time Range</label>
                  <input
                    id="res-slot-time"
                    type="text"
                    readOnly
                    className="form-control bg-light"
                    value={`${form.startTime} – ${form.endTime}`}
                  />
                </div>
              </div>

              {reservation && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="res-status">Status</label>
                  <select
                    id="res-status"
                    className="form-select"
                    value={form.status}
                    onChange={e => setField('status', e.target.value as ReservationStatus)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-amber btn-sm" disabled={loading}>
                {loading ? 'Saving...' : reservation ? 'Save Changes' : 'Submit Reservation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [nodes, setNodes] = useState<MicrogridNode[]>([]);
  const [prosumers, setProsumers] = useState<Prosumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'All' | 'Pending' | 'Approved' | 'History'>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Reservation | null>(null);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resData, nodesData, prosumersData] = await Promise.all([
        reservationsApi.getAll(),
        nodesApi.getAll(),
        prosumersApi.getAll(),
      ]);
      setReservations(resData);
      setNodes(nodesData);
      setProsumers(prosumersData);
    } catch {
      showToast('Could not fetch data from API.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 12-hour rule check
  const check12HourRule = (slotDate: string, startTime: string): { ok: boolean; hoursRemaining: number } => {
    const slotDateTime = new Date(`${slotDate}T${startTime}`);
    const now = new Date();
    const diffMs = slotDateTime.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);
    return { ok: hoursRemaining >= 12, hoursRemaining };
  };

  const handleCreate = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  const handleEdit = (r: Reservation) => {
    const { ok, hoursRemaining } = check12HourRule(r.slotDate, r.startTime);
    if (!ok && (r.status === 'Approved' || r.status === 'Pending')) {
      showToast(
        `Updates require at least 12 hours' notice before scheduled slot (${hoursRemaining > 0 ? `${hoursRemaining.toFixed(1)} hrs remaining` : 'slot in past'}). Modification rejected.`,
        'error'
      );
      return;
    }
    setEditItem(r);
    setModalOpen(true);
  };

  const handleCancel = async (id: string) => {
    const res = reservations.find(r => r.id === id);
    if (!res) return;

    const { ok, hoursRemaining } = check12HourRule(res.slotDate, res.startTime);
    if (!ok) {
      showToast(
        `Cancellations require at least 12 hours' notice before scheduled slot (${hoursRemaining > 0 ? `${hoursRemaining.toFixed(1)} hrs remaining` : 'slot in past'}). Cancellation rejected.`,
        'error'
      );
      return;
    }

    if (window.confirm(`Are you sure you want to cancel reservation ${res.id}?`)) {
      try {
        await reservationsApi.cancel(id);
        setReservations(prev => prev.map(r => (r.id === id ? { ...r, status: 'Cancelled' as ReservationStatus } : r)));
        showToast(`Reservation ${res.id} has been cancelled.`, 'success');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Cancellation failed';
        showToast(msg, 'error');
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await reservationsApi.approve(id);
      setReservations(prev => prev.map(r => (r.id === id ? { ...r, status: 'Approved' as ReservationStatus } : r)));
      showToast(`Reservation ${id} approved and locked into grid schedule.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      showToast(msg, 'error');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Enter reason for rejecting this reservation:', 'Grid capacity constraints');
    if (!reason) return;

    try {
      await reservationsApi.reject(id, reason);
      setReservations(prev => prev.map(r => (r.id === id ? { ...r, status: 'Cancelled' as ReservationStatus } : r)));
      showToast(`Reservation ${id} rejected.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      showToast(msg, 'error');
    }
  };

  const handleSave = async (data: FormState) => {
    try {
      const targetNode = nodes.find(n => n.nodeId === data.nodeId);
      const targetNodeId = targetNode?.id || data.nodeId;

      if (editItem) {
        await reservationsApi.modify(editItem.id, {
          newSlotId: data.slotId || undefined,
          newTradeType: data.type,
          newRequestedKwh: Number(data.requestedKwh) || 20,
        });
        setReservations(prev =>
          prev.map(r =>
            r.id === editItem.id
              ? {
                  ...r,
                  prosumerNic: data.prosumerNic,
                  nodeId: data.nodeId,
                  slotId: data.slotId || r.slotId,
                  requestedKwh: Number(data.requestedKwh) || 20,
                  bayNumber: Number(data.bayNumber),
                  slotDate: data.slotDate,
                  startTime: data.startTime,
                  endTime: data.endTime,
                  type: data.type,
                  status: data.status,
                }
              : r
          )
        );
        showToast(`Reservation ${editItem.id} updated successfully.`, 'success');
      } else {
        const created = await reservationsApi.create({
          nodeId: targetNodeId,
          slotId: data.slotId,
          tradeType: data.type,
          requestedKwh: Number(data.requestedKwh) || 20,
          prosumerNic: data.prosumerNic,
        });
        setReservations(prev => [created, ...prev]);
        showToast(`Reservation ${created.id} created successfully.`, 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing reservation';
      showToast(msg, 'error');
    }
  };

  const filteredReservations = useMemo(() => {
    if (tab === 'Pending') return reservations.filter(r => r.status === 'Pending');
    if (tab === 'Approved') return reservations.filter(r => r.status === 'Approved');
    if (tab === 'History') return reservations.filter(r => r.status === 'Completed' || r.status === 'Cancelled');
    return reservations;
  }, [reservations, tab]);

  const pendingCount = reservations.filter(r => r.status === 'Pending').length;
  const approvedFutureCount = reservations.filter(r => r.status === 'Approved' && r.slotDate >= todayStr()).length;

  const columns = [
    {
      key: 'id',
      header: 'Reservation No',
      render: (r: Reservation) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600 }}>{r.reservationNo || r.id}</span>
      ),
    },
    {
      key: 'prosumerNic',
      header: 'Prosumer',
      render: (r: Reservation) => {
        const p = prosumers.find(x => x.nic === r.prosumerNic);
        return (
          <div>
            <div className="fw-600" style={{ fontSize: '0.82rem' }}>{p ? p.name : r.prosumerName}</div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontFamily: 'monospace' }}>{r.prosumerNic}</div>
          </div>
        );
      },
    },
    {
      key: 'nodeId',
      header: 'Hub / Station',
      render: (r: Reservation) => {
        const n = nodes.find(x => x.nodeId === r.nodeId);
        return <span style={{ fontSize: '0.82rem' }}>{n ? n.name : r.nodeName}</span>;
      },
    },
    {
      key: 'bayNumber',
      header: 'Bay',
      render: (r: Reservation) => (
        <span className="badge" style={{ background: '#f3f4f6', color: '#374151', fontWeight: 700 }}>
          #{r.bayNumber}
        </span>
      ),
    },
    {
      key: 'slotDate',
      header: 'Date',
      render: (r: Reservation) => <span style={{ fontSize: '0.82rem' }}>{r.slotDate}</span>,
    },
    {
      key: 'startTime',
      header: 'Time Window',
      render: (r: Reservation) => (
        <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
          {r.startTime} – {r.endTime}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Flow',
      render: (r: Reservation) => <TypePill type={r.type} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r: Reservation) => <StatusPill status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: Reservation) => (
        <div className="d-flex gap-1 align-items-center">
          {r.status === 'Pending' && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                title="Approve Reservation"
                onClick={() => handleApprove(r.id)}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                <CheckCircle2 size={13} /> Approve
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                title="Reject Reservation"
                onClick={() => handleReject(r.id)}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                <XCircle size={13} /> Reject
              </button>
            </>
          )}
          {(r.status === 'Pending' || r.status === 'Approved') && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-outline-warning"
                title="Update Slot (Requires >= 12h notice)"
                onClick={() => handleEdit(r)}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                title="Cancel Slot (Requires >= 12h notice)"
                onClick={() => handleCancel(r.id)}
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
          <h4>Energy Slot Reservation Management</h4>
          <p>Schedule, manage and review solar power export/import slot reservations</p>
        </div>
        <button
          id="create-reservation-btn"
          type="button"
          className="btn btn-amber d-flex align-items-center gap-2"
          onClick={handleCreate}
        >
          <Plus size={15} /> New Reservation
        </button>
      </div>

      {/* Rules Notice */}
      <div
        className="alert d-flex align-items-start gap-2 mb-3"
        style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.82rem' }}
      >
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
          {(['All', 'Pending', 'Approved', 'History'] as const).map(tabName => {
            const count =
              tabName === 'All'
                ? reservations.length
                : tabName === 'Pending'
                ? pendingCount
                : tabName === 'Approved'
                ? approvedFutureCount
                : reservations.filter(r => r.status === 'Completed' || r.status === 'Cancelled').length;
            const isSelected = tab === tabName;
            return (
              <button
                key={tabName}
                type="button"
                onClick={() => setTab(tabName)}
                className={`btn btn-sm ${isSelected ? 'btn-amber' : 'btn-outline-secondary'}`}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                {tabName}{' '}
                <span className={`badge ms-1 ${isSelected ? 'bg-light text-dark' : 'bg-secondary'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="d-flex gap-2">
          <span
            className="badge"
            style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
          >
            Pending Review: {pendingCount}
          </span>
          <span
            className="badge"
            style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.75rem', padding: '0.4rem 0.6rem' }}
          >
            Approved Future Slots: {approvedFutureCount}
          </span>
        </div>
      </div>

      <div className="ssmts-card">
        <div className="ssmts-card-header">
          Reservations & Bookings{' '}
          <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>
            {filteredReservations.length} shown
          </span>
        </div>
        <div className="ssmts-card-body">
          {loading ? (
            <div className="text-center py-4 text-muted">Loading reservations...</div>
          ) : (
            <DataTable
              data={filteredReservations}
              columns={columns}
              keyExtractor={r => r.id}
              searchKeys={['id', 'prosumerNic', 'nodeId', 'type', 'status']}
            />
          )}
        </div>
      </div>

      {modalOpen && (
        <ReservationModal
          reservation={editItem}
          nodes={nodes}
          prosumers={prosumers}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
