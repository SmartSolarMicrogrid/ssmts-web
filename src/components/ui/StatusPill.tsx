interface StatusPillProps {
  status: string;
}

const statusMap: Record<string, string> = {
  Active: 'status-active',
  Suspended: 'status-suspended',
  Deactivated: 'status-deactivated',
  Inactive: 'status-inactive',
  Maintenance: 'status-maintenance',
  Scheduled: 'status-scheduled',
  Completed: 'status-completed',
  Cancelled: 'status-cancelled',
};

export default function StatusPill({ status }: StatusPillProps) {
  const cls = statusMap[status] ?? 'status-inactive';
  return <span className={`status-pill ${cls}`}>{status}</span>;
}
