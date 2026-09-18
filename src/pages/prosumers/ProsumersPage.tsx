import { useState, useMemo } from 'react';
import { mockProsumers as init } from '../../data/mockData';
import type { Prosumer } from '../../types';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import { Plus, Pencil, UserX, UserCheck, ShieldCheck, XCircle, AlertTriangle } from 'lucide-react';

type FormState = { nic: string; name: string; email: string; phone: string; address: string };

function ProsumerModal({ prosumer, onSave, onClose }: { prosumer: Prosumer | null; onSave: (d: FormState) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>({
    nic: prosumer?.nic ?? '',
    name: prosumer?.name ?? '',
    email: prosumer?.email ?? '',
    phone: prosumer?.phone ?? '',
    address: prosumer?.address ?? '',
  });
  const [err, setErr] = useState<Record<string, string>>({});

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));
  const validate = () => {
    const e: Record<string, string> = {};
    if (!prosumer && !form.nic.trim()) e.nic = 'NIC required as Primary Key';
    if (!form.name.trim()) e.name = 'Name required';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim()) e.phone = 'Phone required';
    setErr(e); return !Object.keys(e).length;
  };
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) onSave(form); };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.4)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title">{prosumer ? 'Edit Prosumer Profile' : 'Register New Prosumer'}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">
                  NIC Number <span className="text-muted" style={{ fontSize: '0.75rem' }}>(Primary Key — Immutable once registered)</span>
                </label>
                {prosumer ? (
                  <input className="form-control-plaintext fw-600 px-2 py-1" style={{ background: '#f3f4f6', fontFamily: 'monospace' }} value={form.nic} readOnly />
                ) : (
                  <>
                    <input id="prosumer-nic" className={`form-control ${err.nic ? 'is-invalid' : ''}`} value={form.nic} onChange={e => set('nic', e.target.value)} placeholder="e.g. 199512345678 or 200112345V" />
                    {err.nic && <div className="invalid-feedback">{err.nic}</div>}
                  </>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input id="prosumer-name" className={`form-control ${err.name ? 'is-invalid' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} />
                {err.name && <div className="invalid-feedback">{err.name}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Email Address</label>
                <input id="prosumer-email" type="email" className={`form-control ${err.email ? 'is-invalid' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} />
                {err.email && <div className="invalid-feedback">{err.email}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Phone</label>
                <input id="prosumer-phone" className={`form-control ${err.phone ? 'is-invalid' : ''}`} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="07XXXXXXXX" />
                {err.phone && <div className="invalid-feedback">{err.phone}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea id="prosumer-address" className="form-control" rows={2} value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-amber btn-sm">{prosumer ? 'Save Changes' : 'Register Prosumer'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProsumersPage() {
  const [prosumers, setProsumers] = useState<Prosumer[]>(init);
  const [filter, setFilter] = useState<'All' | 'Active' | 'PendingActivation' | 'Deactivated'>('All');
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Prosumer | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleApprove = (nic: string) => {
    setProsumers(p => p.map(x => x.nic === nic ? { ...x, status: 'Active' } : x));
    showToast(`Prosumer ${nic} approved and activated successfully.`);
  };

  const handleReject = (nic: string) => {
    setProsumers(p => p.map(x => x.nic === nic ? { ...x, status: 'Deactivated' } : x));
    showToast(`Pending activation for ${nic} was rejected.`);
  };

  const handleDeactivate = (nic: string) => {
    setProsumers(p => p.map(x => x.nic === nic ? { ...x, status: 'Deactivated' } : x));
    showToast(`Prosumer ${nic} deactivated. Only Backoffice officers can reactivate this account.`);
  };

  const handleReactivate = (nic: string) => {
    setProsumers(p => p.map(x => x.nic === nic ? { ...x, status: 'Active' } : x));
    showToast(`Prosumer ${nic} reactivated by Backoffice officer.`);
  };

  const save = (d: FormState) => {
    if (edit) {
      setProsumers(p => p.map(x => x.nic === edit.nic ? { ...x, ...d } : x));
      showToast(`Prosumer profile updated.`);
    } else {
      setProsumers(p => [
        { nic: d.nic, name: d.name, email: d.email, phone: d.phone, address: d.address, status: 'Active', creditBalance: 0, registeredAt: new Date().toISOString().split('T')[0] },
        ...p,
      ]);
      showToast(`New prosumer ${d.nic} registered successfully.`);
    }
    setModal(false);
  };

  const filteredProsumers = useMemo(() => {
    if (filter === 'All') return prosumers;
    return prosumers.filter(p => p.status === filter);
  }, [prosumers, filter]);

  const pendingCount = prosumers.filter(p => p.status === 'PendingActivation').length;

  const cols = [
    { key: 'nic', header: 'NIC (Primary Key)', render: (p: Prosumer) => <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{p.nic}</span> },
    { key: 'name', header: 'Name', render: (p: Prosumer) => <span className="fw-600">{p.name}</span> },
    { key: 'email', header: 'Email', render: (p: Prosumer) => <span style={{ fontSize: '0.82rem' }}>{p.email}</span> },
    { key: 'phone', header: 'Phone' },
    { key: 'creditBalance', header: 'Credit (LKR)', render: (p: Prosumer) => <span className="fw-600 text-amber">{p.creditBalance.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', header: 'Status', render: (p: Prosumer) => <StatusPill status={p.status} /> },
    {
      key: 'actions', header: 'Actions', render: (p: Prosumer) => (
        <div className="d-flex gap-1 align-items-center">
          <button className="btn btn-sm btn-outline-warning" title="Edit Profile" onClick={() => { setEdit(p); setModal(true); }}>
            <Pencil size={13} />
          </button>
          {p.status === 'PendingActivation' && (
            <>
              <button className="btn btn-sm btn-success d-flex align-items-center gap-1" title="Approve & Activate" onClick={() => handleApprove(p.nic)} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
                <ShieldCheck size={13} /> Approve
              </button>
              <button className="btn btn-sm btn-outline-danger" title="Reject Activation" onClick={() => handleReject(p.nic)}>
                <XCircle size={13} />
              </button>
            </>
          )}
          {p.status === 'Active' && (
            <button className="btn btn-sm btn-outline-danger" title="Deactivate Profile" onClick={() => handleDeactivate(p.nic)}>
              <UserX size={13} />
            </button>
          )}
          {p.status === 'Deactivated' && (
            <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" title="Reactivate (Backoffice Officer Only)" onClick={() => handleReactivate(p.nic)} style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}>
              <UserCheck size={13} /> Reactivate
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h4>Prosumer Management</h4>
          <p>Register, update and manage solar energy prosumers by National Identity Card (NIC)</p>
        </div>
        <button id="create-prosumer-btn" className="btn btn-amber d-flex align-items-center gap-2" onClick={() => { setEdit(null); setModal(true); }}>
          <Plus size={15} /> Register Prosumer
        </button>
      </div>

      {toast && (
        <div className="alert d-flex align-items-center gap-2 mb-3" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.82rem' }}>
          <AlertTriangle size={15} /> {toast}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="d-flex gap-2 mb-3 align-items-center">
        {(['All', 'Active', 'PendingActivation', 'Deactivated'] as const).map(tab => {
          const count = tab === 'All' ? prosumers.length : prosumers.filter(p => p.status === tab).length;
          const label = tab === 'PendingActivation' ? 'Pending Activations' : tab;
          const isSelected = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`btn btn-sm ${isSelected ? 'btn-amber' : 'btn-outline-secondary'}`}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              {label} <span className={`badge ms-1 ${isSelected ? 'bg-light text-dark' : 'bg-secondary'}`}>{count}</span>
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
          Prosumer Registry <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>{filteredProsumers.length} shown</span>
        </div>
        <div className="ssmts-card-body">
          <DataTable
            data={filteredProsumers as unknown as Record<string, unknown>[]}
            columns={cols as never}
            keyExtractor={p => (p as unknown as Prosumer).nic}
            searchKeys={['nic', 'name', 'email', 'phone', 'status'] as never[]}
          />
        </div>
      </div>

      {modal && <ProsumerModal prosumer={edit} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
