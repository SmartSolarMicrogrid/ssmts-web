import { useState, useMemo, useEffect } from 'react';
import type { Prosumer } from '../../types';
import { prosumersApi } from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import { Plus, Pencil, UserX, UserCheck, ShieldCheck, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

type FormState = { nic: string; name: string; email: string; phone: string; address: string };

function ProsumerModal({
  prosumer,
  onSave,
  onClose,
}: {
  prosumer: Prosumer | null;
  onSave: (d: FormState) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    nic: prosumer?.nic ?? '',
    name: prosumer?.name ?? '',
    email: prosumer?.email ?? '',
    phone: prosumer?.phone ?? '',
    address: prosumer?.address ?? '',
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!prosumer && !form.nic.trim()) e.nic = 'NIC required as Primary Key';
    if (!form.name.trim()) e.name = 'Full name required';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim()) e.phone = 'Phone number required';
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
            <h6 className="modal-title">{prosumer ? 'Edit Prosumer Profile' : 'Register New Solar Prosumer'}</h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label" htmlFor="prosumer-nic">
                  NIC Number <span className="text-muted" style={{ fontSize: '0.75rem' }}>(Primary Key — Immutable once registered)</span>
                </label>
                {prosumer ? (
                  <input
                    id="prosumer-nic"
                    className="form-control-plaintext fw-600 px-2 py-1"
                    style={{ background: '#f3f4f6', fontFamily: 'monospace' }}
                    value={form.nic}
                    readOnly
                  />
                ) : (
                  <>
                    <input
                      id="prosumer-nic"
                      className={`form-control ${err.nic ? 'is-invalid' : ''}`}
                      value={form.nic}
                      onChange={e => set('nic', e.target.value)}
                      placeholder="e.g. 199512345678 or 200112345V"
                    />
                    {err.nic && <div className="invalid-feedback">{err.nic}</div>}
                  </>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="prosumer-name">Full Name</label>
                <input
                  id="prosumer-name"
                  className={`form-control ${err.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
                {err.name && <div className="invalid-feedback">{err.name}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="prosumer-email">Email Address</label>
                <input
                  id="prosumer-email"
                  type="email"
                  className={`form-control ${err.email ? 'is-invalid' : ''}`}
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
                {err.email && <div className="invalid-feedback">{err.email}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="prosumer-phone">Phone Number</label>
                <input
                  id="prosumer-phone"
                  className={`form-control ${err.phone ? 'is-invalid' : ''}`}
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="07XXXXXXXX"
                />
                {err.phone && <div className="invalid-feedback">{err.phone}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="prosumer-address">Premises Address</label>
                <textarea
                  id="prosumer-address"
                  className="form-control"
                  rows={2}
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-amber btn-sm" disabled={loading}>
                {loading ? 'Saving...' : prosumer ? 'Save Changes' : 'Register Prosumer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProsumersPage() {
  const [prosumers, setProsumers] = useState<Prosumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Active' | 'PendingActivation' | 'Deactivated'>('All');
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Prosumer | null>(null);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadProsumers = async () => {
    setLoading(true);
    try {
      const data = await prosumersApi.getAll();
      setProsumers(data);
    } catch {
      showToast('Could not load prosumers from API.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProsumers();
  }, []);

  const handleApprove = async (p: Prosumer) => {
    try {
      await prosumersApi.activate(p.id || p.nic);
      setProsumers(prev => prev.map(x => (x.nic === p.nic ? { ...x, status: 'Active' as const } : x)));
      showToast(`Prosumer ${p.nic} approved and activated successfully.`);
    } catch {
      showToast(`Failed to approve prosumer ${p.nic}.`, 'error');
    }
  };

  const handleReject = async (p: Prosumer) => {
    try {
      await prosumersApi.deactivate(p.id || p.nic);
      setProsumers(prev => prev.map(x => (x.nic === p.nic ? { ...x, status: 'Deactivated' as const } : x)));
      showToast(`Pending activation for ${p.nic} was rejected.`);
    } catch {
      showToast(`Could not reject prosumer ${p.nic}.`, 'error');
    }
  };

  const handleDeactivate = async (p: Prosumer) => {
    try {
      await prosumersApi.deactivate(p.id || p.nic);
      setProsumers(prev => prev.map(x => (x.nic === p.nic ? { ...x, status: 'Deactivated' as const } : x)));
      showToast(`Prosumer ${p.nic} deactivated. Only Backoffice officers can reactivate this account.`);
    } catch {
      showToast(`Could not deactivate prosumer ${p.nic}.`, 'error');
    }
  };

  const handleReactivate = async (p: Prosumer) => {
    try {
      // Backend enforces: [Authorize(Roles = RoleConstants.Backoffice)]
      await prosumersApi.reactivate(p.id || p.nic);
      setProsumers(prev => prev.map(x => (x.nic === p.nic ? { ...x, status: 'Active' as const } : x)));
      showToast(`Prosumer ${p.nic} reactivated by Backoffice officer.`);
    } catch {
      showToast(`Reactivation failed. Ensure you are signed in as Backoffice officer.`, 'error');
    }
  };

  const handleSave = async (d: FormState) => {
    try {
      if (edit) {
        await prosumersApi.update(edit.nic, {
          fullName: d.name,
          phone: d.phone,
          address: d.address,
        });
        setProsumers(p => p.map(x => (x.nic === edit.nic ? { ...x, ...d } : x)));
        showToast(`Prosumer ${edit.nic} profile updated.`);
      } else {
        const created = await prosumersApi.create({
          nic: d.nic,
          fullName: d.name,
          email: d.email,
          phone: d.phone,
          address: d.address,
          password: 'Password123!',
        });
        setProsumers(p => [created, ...p]);
        showToast(`New prosumer ${created.nic} registered successfully.`);
      }
      setModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save prosumer';
      showToast(msg, 'error');
    }
  };

  const filteredProsumers = useMemo(() => {
    if (filter === 'All') return prosumers;
    return prosumers.filter(p => {
      if (filter === 'PendingActivation') return p.status === 'PendingActivation' || p.status === 'Pending';
      if (filter === 'Deactivated') return p.status === 'Deactivated' || p.status === 'Inactive';
      return p.status === filter;
    });
  }, [prosumers, filter]);

  const pendingCount = prosumers.filter(p => p.status === 'PendingActivation' || p.status === 'Pending').length;

  const cols = [
    {
      key: 'nic',
      header: 'NIC (Primary Key)',
      render: (p: Prosumer) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{p.nic}</span>
      ),
    },
    { key: 'name', header: 'Full Name', render: (p: Prosumer) => <span className="fw-600">{p.name}</span> },
    { key: 'email', header: 'Email', render: (p: Prosumer) => <span style={{ fontSize: '0.82rem' }}>{p.email}</span> },
    { key: 'phone', header: 'Phone' },
    {
      key: 'creditBalance',
      header: 'Credit (LKR)',
      render: (p: Prosumer) => (
        <span className="fw-600 text-amber">
          {(p.creditBalance ?? 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (p: Prosumer) => <StatusPill status={p.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (p: Prosumer) => (
        <div className="d-flex gap-1 align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            title="Edit Profile"
            onClick={() => {
              setEdit(p);
              setModal(true);
            }}
          >
            <Pencil size={13} />
          </button>
          {(p.status === 'PendingActivation' || p.status === 'Pending') && (
            <>
              <button
                type="button"
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                title="Approve & Activate"
                onClick={() => handleApprove(p)}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                <ShieldCheck size={13} /> Approve
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                title="Reject Activation"
                onClick={() => handleReject(p)}
              >
                <XCircle size={13} />
              </button>
            </>
          )}
          {p.status === 'Active' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              title="Deactivate Profile"
              onClick={() => handleDeactivate(p)}
            >
              <UserX size={13} />
            </button>
          )}
          {(p.status === 'Deactivated' || p.status === 'Inactive') && (
            <button
              type="button"
              className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
              title="Reactivate (Backoffice Officer Only)"
              onClick={() => handleReactivate(p)}
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
            >
              <UserCheck size={13} /> Reactivate
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h4>Prosumer Management</h4>
          <p>Register, update and manage solar energy prosumers by National Identity Card (NIC)</p>
        </div>
        <button
          id="create-prosumer-btn"
          type="button"
          className="btn btn-amber d-flex align-items-center gap-2"
          onClick={() => {
            setEdit(null);
            setModal(true);
          }}
        >
          <Plus size={15} /> Register Prosumer
        </button>
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
          {toast.type === 'error' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          {toast.text}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3 align-items-center">
        {(['All', 'Active', 'PendingActivation', 'Deactivated'] as const).map(tab => {
          const count = tab === 'All'
            ? prosumers.length
            : prosumers.filter(p => {
                if (tab === 'PendingActivation') return p.status === 'PendingActivation' || p.status === 'Pending';
                if (tab === 'Deactivated') return p.status === 'Deactivated' || p.status === 'Inactive';
                return p.status === tab;
              }).length;
          const label = tab === 'PendingActivation' ? 'Pending Activations' : tab;
          const isSelected = filter === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`btn btn-sm ${isSelected ? 'btn-amber' : 'btn-outline-secondary'}`}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              {label}{' '}
              <span className={`badge ms-1 ${isSelected ? 'bg-light text-dark' : 'bg-secondary'}`}>{count}</span>
            </button>
          );
        })}
        {pendingCount > 0 && filter !== 'PendingActivation' && (
          <span className="ms-2 text-warning fw-600" style={{ fontSize: '0.78rem' }}>
            ⚠️ {pendingCount} prosumer(s) awaiting activation approval!
          </span>
        )}
      </div>

      <div className="ssmts-card">
        <div className="ssmts-card-header">
          Prosumer Registry{' '}
          <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>
            {filteredProsumers.length} shown
          </span>
        </div>
        <div className="ssmts-card-body">
          {loading ? (
            <div className="text-center py-4 text-muted">Loading prosumers...</div>
          ) : (
            <DataTable
              data={filteredProsumers}
              columns={cols}
              keyExtractor={p => p.nic}
              searchKeys={['nic', 'name', 'email', 'phone', 'status']}
            />
          )}
        </div>
      </div>

      {modal && <ProsumerModal prosumer={edit} onSave={handleSave} onClose={() => setModal(false)} />}
    </div>
  );
}
