import type { ReservationType } from '../../types';

interface TypePillProps {
  type: ReservationType;
}

export default function TypePill({ type }: TypePillProps) {
  const cls = type === 'Export' ? 'type-export' : 'type-import';
  return <span className={`type-pill ${cls}`}>{type}</span>;
}
