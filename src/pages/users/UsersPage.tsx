import { useState } from 'react';
import { mockUsers as init } from '../../data/mockData';
import type { User, UserRole } from '../../types';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import RoleBadge from '../../components/ui/RoleBadge';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';

type FormState = { name: string; email: string; role: UserRole; password: string };

function UserModal({ user, onSave, onClose }: { user: User | null; onSave: (d: FormState) => void; onClose: () => void }) {
  const [form, setForm] = useState<FormState>({ name: user?.name ?? '', email: user?.email ?? '', role: user?.role ?? 'Backoffice', password: '' });
  const [err, setErr] = useState<Record<string, string>>({});

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name required';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!user && !form.password) e.password = 'Password required';
    setErr(e);
    return !Object.keys(e).length;
  };

  const submit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) onSave(form); };

  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,.4)' }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title">{user ? 'Edit User' : 'Add New User'}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input id="user-name" className={`form-control ${err.name ? 'is-invalid' : ''}`} value={form.name} onChange={e => set('name', e.target.value)} />
                {err.name && <div className="invalid-feedback">{err.name}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input id="user-email" type="email" className={`form-control ${err.email ? 'is-invalid' : ''}`} value={form.email} onChange={e => set('email', e.target.value)} />
                {err.email && <div className="invalid-feedback">{err.email}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select id="user-role" className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                  <option value="Backoffice">Backoffice</option>
                  <option value="GridOperator">Grid Operator</option>
                </select>
              </div>
              {!user && (
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input id="user-password" type="password" className={`form-control ${err.password ? 'is-invalid' : ''}`} value={form.password} onChange={e => set('password', e.target.value)} />
                  {err.password && <div className="invalid-feedback">{err.password}</div>}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-amber btn-sm">{user ? 'Save Changes' : 'Create User'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(init);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);

  const openEdit = (u: User) => { setEdit(u); setModal(true); };
  const openCreate = () => { setEdit(null); setModal(true); };

  const toggle = (id: string) => setUsers(p => p.map(u => u.id === id ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u));

  const save = (d: FormState) => {
    if (edit) setUsers(p => p.map(u => u.id === edit.id ? { ...u, ...d } : u));
    else setUsers(p => [{ id: `USR${String(p.length + 1).padStart(3, '0')}`, name: d.name, email: d.email, role: d.role, status: 'Active', createdAt: new Date().toISOString().split('T')[0] }, ...p]);
    setModal(false);
  };

  const cols = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name', render: (u: User) => <span className="fw-600">{u.name}</span> },
    { key: 'email', header: 'Email', render: (u: User) => <span style={{ fontSize: '0.82rem' }}>{u.email}</span> },
    { key: 'role', header: 'Role', render: (u: User) => <RoleBadge role={u.role} /> },
    { key: 'status', header: 'Status', render: (u: User) => <StatusPill status={u.status} /> },
    { key: 'createdAt', header: 'Created', render: (u: User) => <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{u.createdAt}</span> },
    {
      key: 'actions', header: 'Actions', render: (u: User) => (
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-outline-warning" onClick={() => openEdit(u)}><Pencil size={13} /></button>
          <button className={`btn btn-sm ${u.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={() => toggle(u.id)}>
            {u.status === 'Active' ? <UserX size={13} /> : <UserCheck size={13} />}
          </button>
        </div>
      )
    },
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div><h4>User Management</h4><p>Manage system users and role assignments</p></div>
        <button id="create-user-btn" className="btn btn-amber d-flex align-items-center gap-2" onClick={openCreate}><Plus size={15} /> Add User</button>
      </div>
      <div className="ssmts-card">
        <div className="ssmts-card-header">All Users <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>{users.length} total</span></div>
        <div className="ssmts-card-body">
          <DataTable data={users as unknown as Record<string, unknown>[]} columns={cols as never} keyExtractor={u => (u as unknown as User).id} searchKeys={['name', 'email', 'role'] as never[]} />
        </div>
      </div>
      {modal && <UserModal user={edit} onSave={save} onClose={() => setModal(false)} />}
    </div>
  );
}
