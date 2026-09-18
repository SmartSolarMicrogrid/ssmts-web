import type { UserRole } from '../../types';

interface RoleBadgeProps {
  role: UserRole;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const cls = role === 'Backoffice' ? 'role-backoffice' : 'role-gridoperator';
  const label = role === 'Backoffice' ? 'Backoffice' : 'Grid Operator';
  return <span className={`role-badge ${cls}`}>{label}</span>;
}
