interface StatusPillProps { status: string; }
const map: Record<string, string> = {
  Active: 'status-active', Suspended: 'status-suspended', Deactivated: 'status-deactivated',
  Inactive: 'status-inactive', Maintenance: 'status-maintenance',
  Scheduled: 'status-scheduled', Completed: 'status-completed', Cancelled: 'status-cancelled',
};
export default function StatusPill({ status }: StatusPillProps) {
  return <span className={`status-pill ${map[status] ?? 'status-inactive'}`}>{status}</span>;
}
