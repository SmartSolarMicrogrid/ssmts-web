import { useState, useEffect } from 'react';
import type { User, UserRole } from '../../types';
import { usersApi } from '../../services/api';
import DataTable from '../../components/ui/DataTable';
import StatusPill from '../../components/ui/StatusPill';
import RoleBadge from '../../components/ui/RoleBadge';
import { Plus, Pencil, UserX, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

type FormState = { name: string; email: string; role: UserRole; password: string };

function UserModal({
  user,
  onSave,
  onClose,
}: {
  user: User | null;
  onSave: (d: FormState) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'Backoffice',
    password: '',
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email is required';
    if (!user) {
      if (!form.password) {
        e.password = 'Password is required';
      } else if (form.password.length < 8) {
        e.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(form.password)) {
        e.password = 'Password must contain at least one uppercase letter (A-Z)';
      } else if (!/[0-9]/.test(form.password)) {
        e.password = 'Password must contain at least one number (0-9)';
      }
    }
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
            <h6 className="modal-title">{user ? 'Edit System User' : 'Add New Application User'}</h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label" htmlFor="user-name">Full Name</label>
                <input
                  id="user-name"
                  className={`form-control ${err.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
                {err.name && <div className="invalid-feedback">{err.name}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="user-email">Email Address</label>
                <input
                  id="user-email"
                  type="email"
                  disabled={!!user}
                  className={`form-control ${err.email ? 'is-invalid' : ''}`}
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
                {err.email && <div className="invalid-feedback">{err.email}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="user-role">System Role</label>
                <select
                  id="user-role"
                  className="form-select"
                  value={form.role}
                  onChange={e => set('role', e.target.value as UserRole)}
                >
                  <option value="Backoffice">Backoffice (Administration & Management)</option>
                  <option value="GridOperator">Grid Operator (Operational Dispatch Tools)</option>
                </select>
                <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                  {form.role === 'Backoffice'
                    ? 'Access to system administration, prosumer verification, node setups, and user management.'
                    : 'Access to grid operations, daily booking dispatch, slot monitoring, and reservation approvals.'}
                </div>
              </div>
              {!user && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="user-password">Initial Password</label>
                  <input
                    id="user-password"
                    type="password"
                    className={`form-control ${err.password ? 'is-invalid' : ''}`}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="e.g. User@1234"
                  />
                  {err.password ? (
                    <div className="invalid-feedback">{err.password}</div>
                  ) : (
                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      Must be at least 8 characters with at least one uppercase letter (A-Z) and one number (0-9).
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-amber btn-sm" disabled={loading}>
                {loading ? 'Saving...' : user ? 'Save Changes' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<User | null>(null);
  const [toast, setToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const showToast = (text: string, type: 'error' | 'success' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4500);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch {
      showToast('Failed to load users from backend API.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openEdit = (u: User) => {
    setEdit(u);
    setModal(true);
  };

  const openCreate = () => {
    setEdit(null);
    setModal(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const res = await usersApi.toggleStatus(user.id, user.status);
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, status: res.status as User['status'] } : u)));
      showToast(`User ${user.name} status updated to ${res.status}.`);
    } catch {
      showToast(`Could not update status for user ${user.name}.`, 'error');
    }
  };

  const handleSave = async (d: FormState) => {
    try {
      if (edit) {
        await usersApi.update(edit.id, { name: d.name, role: d.role });
        setUsers(prev => prev.map(u => (u.id === edit.id ? { ...u, name: d.name, role: d.role } : u)));
        showToast(`User ${edit.name} updated successfully.`);
      } else {
        const created = await usersApi.create({
          name: d.name,
          email: d.email,
          password: d.password,
          role: d.role,
        });
        setUsers(prev => [created, ...prev]);
        showToast(`User ${created.name} (${created.role}) created successfully.`);
      }
      setModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving user';
      showToast(msg, 'error');
    }
  };

  const cols = [
    { key: 'id', header: 'User ID', render: (u: User) => <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{u.id}</span> },
    { key: 'name', header: 'Name', render: (u: User) => <span className="fw-600">{u.name}</span> },
    { key: 'email', header: 'Email', render: (u: User) => <span style={{ fontSize: '0.82rem' }}>{u.email}</span> },
    { key: 'role', header: 'Assigned Role', render: (u: User) => <RoleBadge role={u.role} /> },
    { key: 'status', header: 'Status', render: (u: User) => <StatusPill status={u.status} /> },
    { key: 'createdAt', header: 'Created', render: (u: User) => <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{u.createdAt}</span> },
    {
      key: 'actions',
      header: 'Actions',
      render: (u: User) => (
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            title="Edit User"
            onClick={() => openEdit(u)}
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            className={`btn btn-sm ${u.status === 'Active' ? 'btn-outline-danger' : 'btn-outline-success'}`}
            title={u.status === 'Active' ? 'Suspend User Access' : 'Reactivate User Access'}
            onClick={() => handleToggleStatus(u)}
          >
            {u.status === 'Active' ? <UserX size={13} /> : <UserCheck size={13} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header d-flex justify-content-between align-items-start">
        <div>
          <h4>User Management</h4>
          <p>Create and manage Backoffice officers and Grid Operator accounts</p>
        </div>
        <button
          id="create-user-btn"
          type="button"
          className="btn btn-amber d-flex align-items-center gap-2"
          onClick={openCreate}
        >
          <Plus size={15} /> Add User
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
          {toast.type === 'error' ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
          {toast.text}
        </div>
      )}

      <div className="ssmts-card">
        <div className="ssmts-card-header d-flex justify-content-between align-items-center">
          <span>All Application Users</span>
          <span className="badge" style={{ background: '#fffbeb', color: '#d97706', fontSize: '0.72rem' }}>
            {users.length} total
          </span>
        </div>
        <div className="ssmts-card-body">
          {loading ? (
            <div className="text-center py-4 text-muted">Loading user accounts...</div>
          ) : (
            <DataTable
              data={users}
              columns={cols}
              keyExtractor={u => u.id}
              searchKeys={['name', 'email', 'role', 'status']}
            />
          )}
        </div>
      </div>

      {modal && <UserModal user={edit} onSave={handleSave} onClose={() => setModal(false)} />}
    </div>
  );
}
