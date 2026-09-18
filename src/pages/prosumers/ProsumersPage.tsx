import { useState } from 'react';
import { mockProsumers as init } from '../../data/mockData';
import type { Prosumer } from '../../types';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import { Plus, Pencil, UserX, UserCheck, Info } from 'lucide-react';

type FormState = { nic: string; name: string; email: string; phone: string; address: string };

function ProsumerModal({ prosumer, onSave, onClose }: { prosumer: Prosumer | null; onSave: (d: FormState) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>({ nic: prosumer?.nic ?? '', name: prosumer?.name ?? '', email: prosumer?.email ?? '', phone: prosumer?.phone ?? '', address: prosumer?.address ?? '' });
  const [err, setErr] = useState<Record<string, string>>({});

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));
  const validate = () => {
    const e: Record<string, string> = {};
    if (!prosumer && !form.nic.trim()) e.nic = 'NIC required';
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
          <div className="modal-header"><h6 className="modal-title">{prosumer ? 'Edit Prosumer' : 'Register Prosumer'}</h6><button className="btn-close" onClick={onClose} /></div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">NIC Number</label>
                {prosumer
                  ? <input className="form-control-plaintext fw-600" value={form.nic} readOnly />
                  : <><input id="prosumer-nic" className={`form-control ${err.nic ? 'is-invalid' : ''}`} value={form.nic} onChange={e => set('nic', e.target.value)} placeholder="199512345678" />{err.nic && <div className="invalid-feedback">{err.nic}</div>}</>}
              </div>
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input id="prosumer-name" className={`form-control ${err.name ? 'is-invalid' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} />
                {err.name && <div className="invalid-feedback">{err.name}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
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
              <button type="submit" className="btn btn-amber btn-sm">{prosumer ? 'Save Changes' : 'Register'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProsumersPage() {
  const [prosumers, setProsumers] = useState<Prosumer[]>(init);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<Prosumer | null>(null);

  const toggle = (nic: string) => setProsumers(p => p.map(x => x.nic === nic ? { ...x, status: x.status === 'Active' ? 'Deactivated' : 'Active' } : x));

  const save = (d: FormState) => {
    if (edit) setProsumers(p => p.map(x => x.nic === edit.nic ? { ...x, ...d } : x));
    else setProsumers(p => [{ nic: d.nic, name: d.name, email: d.email, phone: d.phone, address: d.address, status: 'Active', creditBalance: 0, registeredAt: new Date().toISOString().split('T')[0] }, ...p]);
    setModal(false);
  };

  const cols = [
    { key: 'nic', header: 'NIC', render: (p: Prosumer) => <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.nic}</span> },
    { key: 'name', header: 'Name', render: (p: Prosumer) => <span className="fw-600">{p.name}</span> },
    { key: 'email', header: 'Email', render: (p: Prosumer) => <span style={{ fontSize: '0.82rem' }}>{p.email}</span> },
    { key: 'phone', header: 'Phone' },
    { key: 'creditBalance', header: 'Credit (LKR)', render: (p: Prosumer) => <span className="fw-600 text-amber">{p.creditBalance.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', header: 'Status', render: (p: Prosumer) => <StatusPill status={p.status} /> },
    {
      key: 'actions', header: 'Actions', render: (p: Prosumer) => (
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-outline-warning" onClick={() => { setEdit(p); setModal(true); }}><Pencil size={13} /></button>
          <button className={`btn btn-sm ${p.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => toggle(p.nic)}>
            {p.status === 'Active' ? <UserX size={13} /> : <UserCheck size={13} />}
          </button>
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div><h4>Prosumer Management</h4><p>Manage registered energy prosumers</p></div>
        <button id="create-prosumer-btn" className="btn btn-amber d-flex align-items-center gap-2" onClick={() => { setEdit(null); setModal(true); }}><Plus size={15} /> Add Prosumer</button>
      </div>
      <div className="alert d-flex align-items-center gap-2 mb-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.82rem' }}>
        <Info size={15} /> Only Backoffice officers can reactivate deactivated prosumer accounts.
      </div>
      <div className="ssmts-card">
        <div className="ssmts-card-header">All Prosumers <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>{prosumers.length} total</span></div>
        <div className="ssmts-card-body">
          <DataTable data={prosumers as unknown as Record<string, unknown>[]} columns={cols as never} keyExtractor={p => (p as unknown as Prosumer).nic} searchKeys={['nic', 'name', 'email', 'phone'] as never[]} />
        </div>
      </div>
      {modal && <ProsumerModal prosumer={edit} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
