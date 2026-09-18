interface StatusPillProps { status: string; }

const map: Record<string, string> = {
  Active: 'status-active',
  Suspended: 'status-suspended',
  Deactivated: 'status-deactivated',
  PendingActivation: 'status-pending',
  Pending: 'status-pending',
  Approved: 'status-approved',
  Scheduled: 'status-scheduled',
  Inactive: 'status-inactive',
  Maintenance: 'status-maintenance',
  Completed: 'status-completed',
  Cancelled: 'status-cancelled',
};

const labelMap: Record<string, string> = {
  PendingActivation: 'Pending Activation',
};

export default function StatusPill({ status }: StatusPillProps) {
  const cls = map[status] ?? 'status-inactive';
  const label = labelMap[status] ?? status;
  return <span className={`status-pill ${cls}`}>{label}</span>;
}
